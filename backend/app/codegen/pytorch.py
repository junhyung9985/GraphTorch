from __future__ import annotations

import keyword
import re

from app.domain.compiler import GraphAnalysis, MODULE_NODE_TYPES
from app.domain.graph import Graph, Node


class PyTorchCodeGenerator:
    def generate(self, graph: Graph, analysis: GraphAnalysis) -> str:
        nodes_by_id = {node.id: node for node in graph.nodes}
        incoming = {node.id: [] for node in graph.nodes}
        for edge in graph.edges:
            incoming[edge.target].append(edge.source)

        name_registry = NameRegistry()
        module_names: dict[str, str] = {}
        tensor_names: dict[str, str] = {}
        input_nodes = [node for node in graph.nodes if node.type == "Input"]
        output_nodes = [node for node in graph.nodes if node.type == "Output"]

        init_lines = ["super().__init__()"]
        forward_lines: list[str] = []

        for node_id in analysis.topological_order:
            node = nodes_by_id[node_id]
            if node.type in MODULE_NODE_TYPES:
                module_name = name_registry.unique(self._base_name(node.id), prefix=node.type.lower())
                module_names[node.id] = module_name
                init_lines.append(f"self.{module_name} = {self._module_expression(node)}")

        for node_id in analysis.topological_order:
            node = nodes_by_id[node_id]
            if node.type == "Input":
                tensor_names[node.id] = node.name or node.id
                continue
            if node.type == "Output":
                continue

            target_name = name_registry.unique(f"t_{self._base_name(node.id)}", prefix="tensor")
            tensor_names[node.id] = target_name
            parent_tensors = [tensor_names[parent_id] for parent_id in incoming[node.id]]

            if node.type in MODULE_NODE_TYPES:
                forward_lines.append(f"{target_name} = self.{module_names[node.id]}({parent_tensors[0]})")
            elif node.type == "Add":
                forward_lines.append(f"{target_name} = {' + '.join(parent_tensors)}")
            elif node.type == "Concat":
                forward_lines.append(f"{target_name} = torch.cat([{', '.join(parent_tensors)}], dim={int(node.params['dim'])})")
            elif node.type == "Flatten":
                start_dim = int(node.params.get("start_dim", 1))
                forward_lines.append(f"{target_name} = torch.flatten({parent_tensors[0]}, start_dim={start_dim})")
            elif node.type == "Reshape":
                shape = ", ".join(str(value) for value in node.params["shape"])
                forward_lines.append(f"{target_name} = {parent_tensors[0]}.reshape({shape})")
            elif node.type == "Permute":
                dims = ", ".join(str(value) for value in node.params["dims"])
                forward_lines.append(f"{target_name} = {parent_tensors[0]}.permute({dims})")

        output_entries = []
        for node in output_nodes:
            parent_id = incoming[node.id][0]
            output_entries.append(f'"{node.name}": {tensor_names[parent_id]}')
        forward_lines.append(f"return {{{', '.join(output_entries)}}}")

        forward_args = ", ".join(node.name for node in input_nodes if node.name)
        init_block = self._indent_block(init_lines)
        forward_block = self._indent_block(forward_lines or ["return {}"])
        return "\n".join(
            [
                "import torch",
                "import torch.nn as nn",
                "",
                "class GeneratedModel(nn.Module):",
                "    def __init__(self):",
                init_block,
                "",
                f"    def forward(self, {forward_args}):",
                forward_block,
            ]
        )

    def _module_expression(self, node: Node) -> str:
        if node.type == "Conv2d":
            return self._nn_call("Conv2d", node.params)
        if node.type == "Linear":
            return self._nn_call("Linear", node.params)
        if node.type == "BatchNorm2d":
            return self._nn_call("BatchNorm2d", node.params)
        if node.type == "ReLU":
            return self._nn_call("ReLU", node.params)
        if node.type == "MaxPool2d":
            return self._nn_call("MaxPool2d", node.params)
        if node.type == "AvgPool2d":
            return self._nn_call("AvgPool2d", node.params)
        raise ValueError(f"Unsupported module node type '{node.type}'")

    def _nn_call(self, class_name: str, params: dict[str, object]) -> str:
        rendered_params = ", ".join(f"{key}={repr(value)}" for key, value in params.items())
        return f"nn.{class_name}({rendered_params})"

    def _base_name(self, raw_value: str) -> str:
        sanitized = re.sub(r"\W+", "_", raw_value).strip("_").lower()
        return sanitized or "node"

    def _indent_block(self, lines: list[str]) -> str:
        return "\n".join(f"        {line}" for line in lines)


class NameRegistry:
    def __init__(self) -> None:
        self._used: set[str] = set()

    def unique(self, base: str, prefix: str) -> str:
        candidate = self._sanitize(base, prefix)
        if candidate not in self._used:
            self._used.add(candidate)
            return candidate
        index = 2
        while True:
            suffixed = f"{candidate}_{index}"
            if suffixed not in self._used:
                self._used.add(suffixed)
                return suffixed
            index += 1

    def _sanitize(self, raw_value: str, prefix: str) -> str:
        sanitized = re.sub(r"\W+", "_", raw_value).strip("_").lower()
        if not sanitized:
            sanitized = prefix
        if sanitized[0].isdigit():
            sanitized = f"{prefix}_{sanitized}"
        if keyword.iskeyword(sanitized):
            sanitized = f"{prefix}_{sanitized}"
        return sanitized
