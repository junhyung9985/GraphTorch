from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class NodePayload(BaseModel):
    id: str
    type: str
    name: str | None = None
    params: dict[str, Any] = Field(default_factory=dict)


class EdgePayload(BaseModel):
    source: str
    target: str


class GraphRequest(BaseModel):
    nodes: list[NodePayload]
    edges: list[EdgePayload]


class ValidationResponse(BaseModel):
    valid: bool
    topological_order: list[str]
    shapes: dict[str, list[int]]


class CompileResponse(BaseModel):
    code: str
    topological_order: list[str]
    shapes: dict[str, list[int]]
