# FastAPI DAG Compiler MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight FastAPI backend that validates DAG graphs, infers tensor shapes, and emits PyTorch code for multiple named inputs and outputs.

**Architecture:** Keep HTTP concerns in FastAPI only, orchestrate compile flow in an application service, and implement graph validation, topological sort, and shape inference in the domain layer. Emit PyTorch code from a separate generator module with stable sanitized names.

**Tech Stack:** Python 3.12, FastAPI, Pydantic, unittest

---

### Task 1: Scaffold the backend package

**Files:**
- Create: `app/__init__.py`
- Create: `app/main.py`
- Create: `app/api/__init__.py`
- Create: `app/api/routes.py`
- Create: `app/api/schemas.py`
- Create: `app/application/__init__.py`
- Create: `app/application/compiler_service.py`
- Create: `app/domain/__init__.py`
- Create: `app/domain/graph.py`
- Create: `app/domain/compiler.py`
- Create: `app/domain/exceptions.py`
- Create: `app/codegen/__init__.py`
- Create: `app/codegen/pytorch.py`

- [ ] **Step 1: Write the failing test**

```python
from app.main import app


def smoke():
    assert app is not None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest discover -s tests -v`
Expected: FAIL with import errors because package files do not exist yet

- [ ] **Step 3: Write minimal implementation**

```python
from fastapi import FastAPI

app = FastAPI()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest discover -s tests -v`
Expected: import succeeds and smoke test passes

### Task 2: Lock domain behavior with tests

**Files:**
- Create: `tests/test_compiler.py`

- [ ] **Step 1: Write the failing tests**

```python
def test_compile_graph_generates_forward_signature():
    ...

def test_validate_rejects_reserved_input_name():
    ...
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest discover -s tests -v`
Expected: FAIL because compiler service and domain rules are not implemented

- [ ] **Step 3: Write minimal implementation**

```python
class GraphCompiler:
    def validate(...): ...
    def compile(...): ...
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest discover -s tests -v`
Expected: tests pass with valid topological order, shapes, and generated code

### Task 3: Add HTTP endpoints and exception mapping

**Files:**
- Modify: `app/main.py`
- Modify: `app/api/routes.py`
- Modify: `app/api/schemas.py`
- Modify: `tests/test_compiler.py`

- [ ] **Step 1: Write the failing API tests**

```python
def test_validate_returns_400_for_invalid_graph():
    ...

def test_compile_returns_code_and_shapes():
    ...
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest discover -s tests -v`
Expected: FAIL because routes and exception handling are missing

- [ ] **Step 3: Write minimal implementation**

```python
@router.post("/validate")
def validate_graph(...): ...

@router.post("/compile")
def compile_graph(...): ...
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest discover -s tests -v`
Expected: both domain and API tests pass
