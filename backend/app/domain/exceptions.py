class CompilerError(Exception):
    """Base exception for graph compiler failures."""


class GraphValidationError(CompilerError):
    """Raised when a graph violates structural or semantic rules."""


class ShapeInferenceError(CompilerError):
    """Raised when tensor shapes cannot be inferred safely."""
