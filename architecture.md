# 🧠 Diagram → PyTorch Code Generator (MVP Architecture)

## 1. Overview

This project is a web-based visual programming tool that allows users to:
- Draw neural network architectures as node-based diagrams
- Automatically convert them into PyTorch code

Core idea:
Graph (DAG) → Intermediate Representation → PyTorch Code

---

## 2. Core Concept

- Nodes = Operations (layers, tensor ops)
- Edges = Tensor flow (data movement)

---

## 3. Design Principles

[Edge Rule]
Edges only represent data flow.
They must NOT contain logic like add / concat / skip.

[Node Rule]
All operations must be nodes.

Layer Nodes:
- Conv2d
- Linear
- BatchNorm
- ReLU
- Pooling

Functional Nodes:
- Add
- Concat
- Flatten
- Reshape
- Permute

Special Nodes:
- Input
- Output

[Skip Connection]
Represented as:
branch + Add node

---

## 4. Supported Scope (MVP)

Supported:
- CNN
- MLP
- ResNet-like (Add node)
- Multi-branch DAG

Not Supported:
- RNN / LSTM / GRU
- loops / recursion
- dynamic control flow

---

## 5. Graph Model

Node Structure:
{
  "id": "n1",
  "type": "Conv2d",
  "params": {
    "in_channels": 3,
    "out_channels": 64,
    "kernel_size": 3,
    "stride": 1,
    "padding": 1
  }
}

Edge Structure:
{
  "source": "n1",
  "target": "n2"
}

Full Graph:
{
  "nodes": [...],
  "edges": [...]
}

---

## 6. Node Categories

Source:
- Input

Module:
- Conv2d
- Linear
- BatchNorm
- ReLU
- Pooling

Functional:
- Add
- Concat
- Flatten
- Reshape
- Permute

Sink:
- Output

---

## 7. Backend Pipeline

1. Parse JSON
2. Validate graph
3. Check DAG
4. Topological sort
5. Shape inference
6. Build modules
7. Generate __init__
8. Generate forward
9. Return code

---

## 8. Validation Rules

General:
- No duplicate IDs
- Valid edges
- DAG only

Input Count:
Conv2d: 1
Linear: 1
ReLU: 1
Add: ≥2
Concat: ≥2
Output: ≥1

---

## 9. Shape Rules

Conv2d:
H_out = floor((H + 2P - K) / S) + 1
W_out = floor((W + 2P - K) / S) + 1

Add:
All shapes must match

Concat:
All dims except concat dim must match

Flatten:
[C,H,W] → [C*H*W]

Reshape:
Total elements must match

---

## 10. Code Generation

__init__:
self.conv1 = nn.Conv2d(...)
self.relu1 = nn.ReLU()

forward:
x1 = x
x2 = self.conv1(x1)
x3 = self.relu1(x2)

Functional:
Add → x = a + b
Concat → x = torch.cat([...], dim=1)

---

## 11. Example

Graph:
Input → Conv → ReLU → Conv ----\
                               Add → Output
Input --------------------------/

Code:
class Model(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3,64,3,padding=1)
        self.relu1 = nn.ReLU()
        self.conv2 = nn.Conv2d(64,64,3,padding=1)

    def forward(self, x):
        x0 = x
        x1 = self.conv1(x0)
        x2 = self.relu1(x1)
        x3 = self.conv2(x2)
        x4 = x3 + x0
        return x4

---

## 12. Backend

Stack:
- FastAPI
- Pydantic
- SQLAlchemy

Structure:
app/
  api/
  core/
    validator.py
    topo_sort.py
    shape_infer.py
    codegen.py

---

## 13. Frontend

Stack:
- Next.js
- React
- Graph editor (React Flow)

Features:
- Node palette
- Canvas
- Property panel
- Code preview

---

## 14. API

POST /validate
POST /compile

Response:
{
  "code": "...",
  "shapes": {...}
}

---

## 15. Deployment

Frontend: Vercel
Backend: Railway / Render
DB: Supabase

---

## 16. Philosophy

- correctness > features
- DAG only
- no loops
- no execution

---

## 17. Future

- RNN (loop node)
- Transformer
- ONNX
- AutoML

---

## 18. Summary

Node-based DAG → PyTorch code generator