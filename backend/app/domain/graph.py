from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Node:
    id: str
    type: str
    params: dict[str, Any] = field(default_factory=dict)
    name: str | None = None


@dataclass(frozen=True)
class Edge:
    source: str
    target: str


@dataclass(frozen=True)
class Graph:
    nodes: list[Node]
    edges: list[Edge]


Shape = tuple[int, ...]
