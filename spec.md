# GraphTorch MVP Spec

## Overview

GraphTorch is a visual DAG editor that converts node-based neural network diagrams into PyTorch code.

Core flow:

`Diagram JSON -> Graph validation -> Topological sort -> Shape inference -> PyTorch code generation`

This MVP supports DAG-based neural network graphs only.

Supported:
- CNN
- MLP
- ResNet-like skip connections through `Add`
- Multi-branch DAG
- Multiple named `Input` and `Output` nodes

Not supported:
- RNN / LSTM / GRU
- loops
- recursion
- dynamic control flow

## Design Principles

- Edges represent tensor flow only
- All operations must be nodes
- Skip connections are represented by branches plus an `Add` node
- Backend API contract is minimal and stable
- Frontend UI state is separate from backend payloads
- Implementation should stay lightweight and avoid unnecessary abstraction

## Graph Model

### Node

Each node has:

```json
{
  "id": "string",
  "type": "string",
  "params": {}
}
```

`Input` and `Output` nodes additionally use top-level `name`:

```json
{
  "id": "input_1",
  "type": "Input",
  "name": "image",
  "params": {
    "shape": [1, 3, 32, 32]
  }
}
```

### Edge

```json
{
  "source": "node_id",
  "target": "node_id"
}
```

### Supported Node Types

Source:
- `Input`

Module:
- `Conv2d`
- `Linear`
- `BatchNorm2d`
- `ReLU`
- `MaxPool2d`
- `AvgPool2d`

Functional:
- `Add`
- `Concat`
- `Flatten`
- `Reshape`
- `Permute`

Sink:
- `Output`

## Validation Rules

General:
- Node ids must be unique
- Edge endpoints must exist
- Self-loops are not allowed
- Graph must be a DAG

Connection rules:
- `Input`: exactly `0` incoming edges
- `Output`: exactly `1` incoming edge and `0` outgoing edges
- Unary nodes: exactly `1` incoming edge
- `Add`: at least `2` incoming edges
- `Concat`: at least `2` incoming edges

Naming rules:
- `Input.name` is required
- `Input.name` must be a valid Python identifier
- `Input.name` must not be a reserved keyword
- `Input.name` must be unique across the graph
- `Output.name` is required
- `Output.name` must be unique across the graph
- Non-`Input` / non-`Output` nodes must not define `name`

## Shape Inference Rules

Shape semantics:
- Shapes always include batch dimension
- Successful validation/compilation returns output shape for every node

Examples:
- `Input`: shape comes from `params.shape`
- `Conv2d`: `(N, C, H, W) -> (N, out_channels, H_out, W_out)`
- `Linear`: `(N, in_features) -> (N, out_features)`
- `BatchNorm2d`, `ReLU`: preserve shape
- `MaxPool2d`, `AvgPool2d`: update spatial dimensions
- `Flatten`: default `start_dim=1`
- `Add`: all input shapes must match
- `Concat`: all dimensions except concat axis must match
- `Reshape`: total element count must be preserved
- `Permute`: must provide a valid full permutation
- `Output`: returns its input shape

Shape mismatch errors should include expected vs actual shape information when practical.

## Backend Architecture

Backend lives in `/backend`.

Layers:
- FastAPI layer for HTTP schema validation and HTTP 400 error mapping
- Application layer for compile flow orchestration
- Domain layer for graph rules, validation, topological sort, and shape inference
- Separate code generator module for PyTorch code emission

Current structure:
- `backend/app/api`
- `backend/app/application`
- `backend/app/domain`
- `backend/app/codegen`

## Backend API Contract

### POST /validate

Request:

```json
{
  "nodes": [...],
  "edges": [...]
}
```

Success response:

```json
{
  "valid": true,
  "topological_order": ["input_1", "conv_1", "output_1"],
  "shapes": {
    "input_1": [1, 3, 32, 32],
    "conv_1": [1, 16, 32, 32],
    "output_1": [1, 16, 32, 32]
  }
}
```

### POST /compile

Request:
- Same as `/validate`

Success response:

```json
{
  "code": "import torch\nimport torch.nn as nn\n...",
  "topological_order": ["input_1", "conv_1", "output_1"],
  "shapes": {
    "input_1": [1, 3, 32, 32],
    "conv_1": [1, 16, 32, 32],
    "output_1": [1, 16, 32, 32]
  }
}
```

### Error Responses

Validation and compiler failures are returned as HTTP 400:

```json
{
  "detail": "string"
}
```

### CORS

For the current MVP, backend CORS allows all origins.

## Code Generation Rules

Generated model:
- uses `nn.Module`
- creates module layers in `__init__`
- emits tensor flow in `forward`

Input/output handling:
- `Input.name` maps directly to `forward()` argument names
- generated intermediate tensors use stable names such as `t_conv_1`
- `Output.name` becomes the returned dictionary key

Example:

```python
def forward(self, image, aux):
    t_merge = image + aux
    return {"main": t_merge, "skip": aux}
```

## Frontend Architecture

Frontend lives in `/frontend`.

Stack:
- Next.js App Router
- React
- React Flow
- Tailwind CSS

State model:
- local component state only
- no global state library
- UI graph state is separate from backend request payloads
- serialization to backend payload happens only right before API calls

## Frontend Layout

Canvas is the primary full-width area.

UI structure:
- `Palette` is attached to the left edge of the canvas
- `Results` is attached to the right edge of the canvas
- `Properties` is a fixed floating inspector in the upper-right area of the canvas
- `Presets` are in a collapsed header dropdown

### Palette

- left slide-out panel
- collapsed by default
- opened/closed through an edge-attached vertical handle
- width is resizable from the right edge
- width range: `240px` to `420px`
- node categories are collapsed by default

### Results

- right slide-out panel
- collapsed by default
- opened/closed through an edge-attached vertical handle
- width is resizable from the left edge
- width range: `320px` to `560px`
- internal scrolling is enabled so long validation results are not clipped

### Floating Inspector

- shown only when a single node or edge is selected
- fixed width
- supports editing node properties
- supports deleting nodes and edges

## Frontend Features

Graph editing:
- add nodes from palette
- connect edges on canvas
- select nodes and edges
- edit node properties
- delete nodes and edges

Clipboard:
- single node copy/paste
- multi-node selection copy/paste
- internal edges between copied nodes are preserved
- shortcuts:
  - `Ctrl/Cmd + C`
  - `Ctrl/Cmd + V`
  - `Delete` / `Backspace`

Presets:
- loaded from header dropdown
- collapsed by default
- preset loading replaces the whole graph
- successful load resets previous results and current selection state

Diagram save/load:
- uses diagram JSON format
- preserves node positions
- excludes transient UI state
- `Save JSON`: read-only textarea + copy button
- `Load JSON`: editable textarea + apply button
- load failure keeps current graph unchanged and shows modal-local error

## Result Panel Behavior

Order:
- HTTP 400 detail
- Generated Code
- Topological Order
- Shapes

Generated code includes a copy button.

## Local Run

Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm run dev
```

Frontend expects:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Current Status

Implemented:
- FastAPI DAG compiler MVP
- stable MVP backend API contract
- frontend graph editor MVP
- presets
- JSON save/load
- clipboard shortcuts
- panel toggles and resize
- shape-aware validation messages

This `spec.md` is the consolidated product-level summary of the current MVP state.
