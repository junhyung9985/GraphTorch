from __future__ import annotations

import keyword
from collections import deque
from dataclasses import dataclass
from math import floor, prod

from app.domain.exceptions import GraphValidationError, ShapeInferenceError
from app.domain.graph import Edge, Graph, Node, Shape


SUPPORTED_NODE_TYPES = {
    "Input",
    "Output",
    "Conv2d",
    "Linear",
    "BatchNorm2d",
    "ReLU",
    "MaxPool2d",
    "AvgPool2d",
    "Add",
    "Concat",
    "Flatten",
    "Reshape",
    "Permute",
}
MODULE_NODE_TYPES = {"Conv2d", "Linear", "BatchNorm2d", "ReLU", "MaxPool2d", "AvgPool2d"}
UNARY_NODE_TYPES = {
    "Conv2d",
    "Linear",
    "BatchNorm2d",
    "ReLU",
    "MaxPool2d",
    "AvgPool2d",
    "Flatten",
    "Reshape",
    "Permute",
}


@dataclass(frozen=True)
class GraphAnalysis:
    topological_order: list[str]
    shapes: dict[str, Shape]


class GraphCompiler:
    def analyze(self, graph: Graph) -> GraphAnalysis:
        nodes_by_id = self._build_node_index(graph.nodes)
        node_order = {node.id: index for index, node in enumerate(graph.nodes)}
        incoming, outgoing = self._build_adjacency(graph.edges, nodes_by_id)
        self._validate_nodes(graph.nodes)
        self._validate_edges(graph.edges)
        self._validate_connection_rules(graph.nodes, incoming, outgoing)
        topological_order = self._topological_sort(nodes_by_id, incoming, outgoing, node_order)
        shapes = self._infer_shapes(graph, nodes_by_id, incoming, topological_order)
        return GraphAnalysis(topological_order=topological_order, shapes=shapes)

    def _build_node_index(self, nodes: list[Node]) -> dict[str, Node]:
        nodes_by_id: dict[str, Node] = {}
        for node in nodes:
            if node.id in nodes_by_id:
                raise GraphValidationError(f"Duplicate node id '{node.id}'")
            nodes_by_id[node.id] = node
        return nodes_by_id

    def _build_adjacency(
        self, edges: list[Edge], nodes_by_id: dict[str, Node]
    ) -> tuple[dict[str, list[str]], dict[str, list[str]]]:
        incoming = {node_id: [] for node_id in nodes_by_id}
        outgoing = {node_id: [] for node_id in nodes_by_id}
        for edge in edges:
            if edge.source not in nodes_by_id:
                raise GraphValidationError(f"Edge source '{edge.source}' does not exist")
            if edge.target not in nodes_by_id:
                raise GraphValidationError(f"Edge target '{edge.target}' does not exist")
            incoming[edge.target].append(edge.source)
            outgoing[edge.source].append(edge.target)
        return incoming, outgoing

    def _validate_nodes(self, nodes: list[Node]) -> None:
        seen_input_names: set[str] = set()
        seen_output_names: set[str] = set()
        for node in nodes:
            if node.type not in SUPPORTED_NODE_TYPES:
                raise GraphValidationError(f"Unsupported node type '{node.type}'")
            if node.type == "Input":
                if not node.name:
                    raise GraphValidationError(f"Input node '{node.id}' must define a name")
                if not node.name.isidentifier():
                    raise GraphValidationError(f"Input name '{node.name}' must be a valid Python identifier")
                if keyword.iskeyword(node.name):
                    raise GraphValidationError(f"Input name '{node.name}' must not be a reserved keyword")
                if node.name in seen_input_names:
                    raise GraphValidationError(f"Duplicate input name '{node.name}'")
                seen_input_names.add(node.name)
                self._require_params(node, {"shape"})
            elif node.type == "Output":
                if not node.name:
                    raise GraphValidationError(f"Output node '{node.id}' must define a name")
                if node.name in seen_output_names:
                    raise GraphValidationError(f"Duplicate output name '{node.name}'")
                seen_output_names.add(node.name)
            elif node.name is not None:
                raise GraphValidationError(f"Node '{node.id}' of type '{node.type}' must not define a name")
            elif node.type == "Conv2d":
                self._require_params(node, {"in_channels", "out_channels", "kernel_size"})
            elif node.type == "Linear":
                self._require_params(node, {"in_features", "out_features"})
            elif node.type == "BatchNorm2d":
                self._require_params(node, {"num_features"})
            elif node.type in {"MaxPool2d", "AvgPool2d"}:
                self._require_params(node, {"kernel_size"})
            elif node.type == "Concat":
                self._require_params(node, {"dim"})
            elif node.type == "Reshape":
                self._require_params(node, {"shape"})
            elif node.type == "Permute":
                self._require_params(node, {"dims"})

    def _validate_edges(self, edges: list[Edge]) -> None:
        for edge in edges:
            if edge.source == edge.target:
                raise GraphValidationError(f"Self-loop is not allowed for node '{edge.source}'")

    def _validate_connection_rules(
        self,
        nodes: list[Node],
        incoming: dict[str, list[str]],
        outgoing: dict[str, list[str]],
    ) -> None:
        for node in nodes:
            incoming_count = len(incoming[node.id])
            outgoing_count = len(outgoing[node.id])
            if node.type == "Input" and incoming_count != 0:
                raise GraphValidationError(f"Input node '{node.id}' cannot have incoming edges")
            if node.type == "Output":
                if outgoing_count != 0:
                    raise GraphValidationError(f"Output node '{node.id}' cannot have outgoing edges")
                if incoming_count != 1:
                    raise GraphValidationError(f"Output node '{node.id}' must have exactly 1 incoming edge")
            if node.type in UNARY_NODE_TYPES and incoming_count != 1:
                raise GraphValidationError(f"Node '{node.id}' of type '{node.type}' must have exactly 1 incoming edge")
            if node.type == "Add" and incoming_count < 2:
                raise GraphValidationError(f"Add node '{node.id}' must have at least 2 incoming edges")
            if node.type == "Concat" and incoming_count < 2:
                raise GraphValidationError(f"Concat node '{node.id}' must have at least 2 incoming edges")

    def _topological_sort(
        self,
        nodes_by_id: dict[str, Node],
        incoming: dict[str, list[str]],
        outgoing: dict[str, list[str]],
        node_order: dict[str, int],
    ) -> list[str]:
        indegree = {node_id: len(parents) for node_id, parents in incoming.items()}
        queue = deque(node_id for node_id in nodes_by_id if indegree[node_id] == 0)
        order: list[str] = []
        while queue:
            node_id = queue.popleft()
            order.append(node_id)
            for child_id in sorted(outgoing[node_id], key=node_order.get):
                indegree[child_id] -= 1
                if indegree[child_id] == 0:
                    queue.append(child_id)
        if len(order) != len(nodes_by_id):
            raise GraphValidationError("Graph must be a DAG")
        return order

    def _infer_shapes(
        self,
        graph: Graph,
        nodes_by_id: dict[str, Node],
        incoming: dict[str, list[str]],
        topological_order: list[str],
    ) -> dict[str, Shape]:
        del graph
        shapes: dict[str, Shape] = {}
        for node_id in topological_order:
            node = nodes_by_id[node_id]
            parent_shapes = [shapes[parent_id] for parent_id in incoming[node_id]]
            if node.type == "Input":
                shapes[node_id] = self._parse_shape(node.params["shape"], node.id)
            elif node.type == "Output":
                shapes[node_id] = parent_shapes[0]
            elif node.type == "Conv2d":
                shapes[node_id] = self._infer_conv2d(node, parent_shapes[0])
            elif node.type == "Linear":
                shapes[node_id] = self._infer_linear(node, parent_shapes[0])
            elif node.type == "BatchNorm2d":
                shapes[node_id] = self._infer_batch_norm(node, parent_shapes[0])
            elif node.type == "ReLU":
                shapes[node_id] = parent_shapes[0]
            elif node.type in {"MaxPool2d", "AvgPool2d"}:
                shapes[node_id] = self._infer_pool(node, parent_shapes[0])
            elif node.type == "Add":
                shapes[node_id] = self._infer_add(node, parent_shapes)
            elif node.type == "Concat":
                shapes[node_id] = self._infer_concat(node, parent_shapes)
            elif node.type == "Flatten":
                shapes[node_id] = self._infer_flatten(node, parent_shapes[0])
            elif node.type == "Reshape":
                shapes[node_id] = self._infer_reshape(node, parent_shapes[0])
            elif node.type == "Permute":
                shapes[node_id] = self._infer_permute(node, parent_shapes[0])
        return shapes

    def _infer_conv2d(self, node: Node, input_shape: Shape) -> Shape:
        if len(input_shape) != 4:
            raise ShapeInferenceError(f"Conv2d node '{node.id}' expects a 4D input shape")
        batch, channels, height, width = input_shape
        if channels != int(node.params["in_channels"]):
            raise ShapeInferenceError(f"Conv2d node '{node.id}' expected {node.params['in_channels']} input channels")
        kernel_h, kernel_w = self._normalize_pair(node.params["kernel_size"], "kernel_size", node.id)
        stride_h, stride_w = self._normalize_pair(node.params.get("stride", 1), "stride", node.id)
        padding_h, padding_w = self._normalize_pair(node.params.get("padding", 0), "padding", node.id)
        out_height = floor((height + 2 * padding_h - kernel_h) / stride_h) + 1
        out_width = floor((width + 2 * padding_w - kernel_w) / stride_w) + 1
        if out_height <= 0 or out_width <= 0:
            raise ShapeInferenceError(f"Conv2d node '{node.id}' produced a non-positive spatial shape")
        return (batch, int(node.params["out_channels"]), out_height, out_width)

    def _infer_linear(self, node: Node, input_shape: Shape) -> Shape:
        if len(input_shape) != 2:
            raise ShapeInferenceError(f"Linear node '{node.id}' expects a 2D input shape")
        batch, features = input_shape
        if features != int(node.params["in_features"]):
            raise ShapeInferenceError(f"Linear node '{node.id}' expected {node.params['in_features']} input features")
        return (batch, int(node.params["out_features"]))

    def _infer_batch_norm(self, node: Node, input_shape: Shape) -> Shape:
        if len(input_shape) < 2:
            raise ShapeInferenceError(f"BatchNorm2d node '{node.id}' expects rank >= 2")
        if input_shape[1] != int(node.params["num_features"]):
            raise ShapeInferenceError(f"BatchNorm2d node '{node.id}' expected {node.params['num_features']} features")
        return input_shape

    def _infer_pool(self, node: Node, input_shape: Shape) -> Shape:
        if len(input_shape) != 4:
            raise ShapeInferenceError(f"{node.type} node '{node.id}' expects a 4D input shape")
        batch, channels, height, width = input_shape
        kernel_h, kernel_w = self._normalize_pair(node.params["kernel_size"], "kernel_size", node.id)
        stride_h, stride_w = self._normalize_pair(node.params.get("stride", node.params["kernel_size"]), "stride", node.id)
        padding_h, padding_w = self._normalize_pair(node.params.get("padding", 0), "padding", node.id)
        out_height = floor((height + 2 * padding_h - kernel_h) / stride_h) + 1
        out_width = floor((width + 2 * padding_w - kernel_w) / stride_w) + 1
        if out_height <= 0 or out_width <= 0:
            raise ShapeInferenceError(f"{node.type} node '{node.id}' produced a non-positive spatial shape")
        return (batch, channels, out_height, out_width)

    def _infer_add(self, node: Node, input_shapes: list[Shape]) -> Shape:
        first_shape = input_shapes[0]
        for shape in input_shapes[1:]:
            if shape != first_shape:
                raise ShapeInferenceError(
                    f"Add node '{node.id}' requires all input shapes to match. "
                    f"Expected shape: {list(first_shape)}. Actual shape: {list(shape)}."
                )
        return first_shape

    def _infer_concat(self, node: Node, input_shapes: list[Shape]) -> Shape:
        first_shape = input_shapes[0]
        rank = len(first_shape)
        dim = self._normalize_dim(int(node.params["dim"]), rank, node.id)
        for shape in input_shapes[1:]:
            if len(shape) != rank:
                raise ShapeInferenceError(f"Concat node '{node.id}' requires all inputs to have the same rank")
            for axis, size in enumerate(shape):
                if axis != dim and size != first_shape[axis]:
                    raise ShapeInferenceError(
                        f"Concat node '{node.id}' requires matching dimensions except along axis {dim}. "
                        f"Expected shape: {list(first_shape)}. Actual shape: {list(shape)}."
                    )
        output_shape = list(first_shape)
        output_shape[dim] = sum(shape[dim] for shape in input_shapes)
        return tuple(output_shape)

    def _infer_flatten(self, node: Node, input_shape: Shape) -> Shape:
        start_dim = int(node.params.get("start_dim", 1))
        if start_dim < 0:
            start_dim += len(input_shape)
        if start_dim < 0 or start_dim >= len(input_shape):
            raise ShapeInferenceError(f"Flatten node '{node.id}' has an invalid start_dim")
        return input_shape[:start_dim] + (prod(input_shape[start_dim:]),)

    def _infer_reshape(self, node: Node, input_shape: Shape) -> Shape:
        target_shape = self._parse_shape(node.params["shape"], node.id)
        if prod(input_shape) != prod(target_shape):
            raise ShapeInferenceError(f"Reshape node '{node.id}' must preserve the total number of elements")
        return target_shape

    def _infer_permute(self, node: Node, input_shape: Shape) -> Shape:
        dims = node.params["dims"]
        if not isinstance(dims, list) or not dims:
            raise ShapeInferenceError(f"Permute node '{node.id}' must define a non-empty dims list")
        normalized_dims = [self._normalize_dim(int(dim), len(input_shape), node.id) for dim in dims]
        if len(normalized_dims) != len(input_shape) or len(set(normalized_dims)) != len(input_shape):
            raise ShapeInferenceError(f"Permute node '{node.id}' must provide a full permutation of dimensions")
        return tuple(input_shape[index] for index in normalized_dims)

    def _require_params(self, node: Node, required_keys: set[str]) -> None:
        missing = [key for key in required_keys if key not in node.params]
        if missing:
            raise GraphValidationError(f"Node '{node.id}' of type '{node.type}' is missing params: {', '.join(missing)}")

    def _parse_shape(self, raw_shape: object, node_id: str) -> Shape:
        if not isinstance(raw_shape, list) or not raw_shape:
            raise ShapeInferenceError(f"Node '{node_id}' must define a non-empty shape list")
        parsed = []
        for value in raw_shape:
            if not isinstance(value, int) or value <= 0:
                raise ShapeInferenceError(f"Node '{node_id}' has an invalid shape dimension '{value}'")
            parsed.append(value)
        return tuple(parsed)

    def _normalize_pair(self, raw_value: object, field_name: str, node_id: str) -> tuple[int, int]:
        if isinstance(raw_value, int):
            if raw_value <= 0 and field_name != "padding":
                raise ShapeInferenceError(f"Node '{node_id}' has an invalid {field_name} value")
            if raw_value < 0 and field_name == "padding":
                raise ShapeInferenceError(f"Node '{node_id}' has an invalid {field_name} value")
            return (raw_value, raw_value)
        if isinstance(raw_value, list) and len(raw_value) == 2 and all(isinstance(item, int) for item in raw_value):
            left, right = raw_value
            if field_name == "padding":
                if left < 0 or right < 0:
                    raise ShapeInferenceError(f"Node '{node_id}' has an invalid {field_name} value")
            elif left <= 0 or right <= 0:
                raise ShapeInferenceError(f"Node '{node_id}' has an invalid {field_name} value")
            return (left, right)
        raise ShapeInferenceError(f"Node '{node_id}' has an invalid {field_name} value")

    def _normalize_dim(self, dim: int, rank: int, node_id: str) -> int:
        if dim < 0:
            dim += rank
        if dim < 0 or dim >= rank:
            raise ShapeInferenceError(f"Node '{node_id}' references invalid dimension {dim}")
        return dim
