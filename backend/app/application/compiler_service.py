from __future__ import annotations

from dataclasses import dataclass

from app.codegen.pytorch import PyTorchCodeGenerator
from app.domain.compiler import GraphAnalysis, GraphCompiler
from app.domain.graph import Edge, Graph, Node


@dataclass(frozen=True)
class ValidationResult:
    valid: bool
    topological_order: list[str]
    shapes: dict[str, list[int]]


@dataclass(frozen=True)
class CompileResult:
    code: str
    topological_order: list[str]
    shapes: dict[str, list[int]]


class CompilerService:
    def __init__(
        self,
        compiler: GraphCompiler | None = None,
        code_generator: PyTorchCodeGenerator | None = None,
    ) -> None:
        self.compiler = compiler or GraphCompiler()
        self.code_generator = code_generator or PyTorchCodeGenerator()

    def validate(self, graph_payload: dict[str, object]) -> ValidationResult:
        graph = self._build_graph(graph_payload)
        analysis = self.compiler.analyze(graph)
        return ValidationResult(
            valid=True,
            topological_order=analysis.topological_order,
            shapes=self._serialize_shapes(analysis),
        )

    def compile(self, graph_payload: dict[str, object]) -> CompileResult:
        graph = self._build_graph(graph_payload)
        analysis = self.compiler.analyze(graph)
        code = self.code_generator.generate(graph, analysis)
        return CompileResult(
            code=code,
            topological_order=analysis.topological_order,
            shapes=self._serialize_shapes(analysis),
        )

    def _build_graph(self, graph_payload: dict[str, object]) -> Graph:
        nodes = [
            Node(
                id=node_payload["id"],
                type=node_payload["type"],
                params=dict(node_payload.get("params", {})),
                name=node_payload.get("name"),
            )
            for node_payload in graph_payload["nodes"]
        ]
        edges = [Edge(source=edge_payload["source"], target=edge_payload["target"]) for edge_payload in graph_payload["edges"]]
        return Graph(nodes=nodes, edges=edges)

    def _serialize_shapes(self, analysis: GraphAnalysis) -> dict[str, list[int]]:
        return {node_id: list(shape) for node_id, shape in analysis.shapes.items()}
