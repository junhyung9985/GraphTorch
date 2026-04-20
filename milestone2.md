# GraphTorch Milestones (Strategic Roadmap)

## 🎯 Project Direction

GraphTorch is evolving from:

> Graph-based CNN editor
> → into
> **General neural architecture composition tool**

Long-term goal:

* Support diverse architectures (CNN, RNN, Transformer, GNN)
* Enable user-defined abstractions and reusable blocks
* Provide research-friendly workflows (diagram → code → export)

---

# 🧭 Priority Strategy

## 🥇 Priority 1 — Representation Power (MOST IMPORTANT)

> "Support more architectures first"

Focus:

* Expand what users can express
* Increase real-world usability for research

---

## 🥈 Priority 2 — Internal Foundation

> "Make the system extensible"

Focus:

* Prepare for composability and abstraction
* Avoid future refactors

---

## 🥉 Priority 3 — User-defined Abstraction

> "Let users define reusable blocks"

Focus:

* Composition
* Reusability
* Higher-level modeling

---

# 🚀 Milestone Roadmap

---

## 🔵 Milestone 1 — High-Level Operator Expansion (NEXT)

### Goal

Support more model families using high-level nodes.

### Why

* Immediate usability boost
* Enables RNN / Transformer / GNN-style modeling
* More impactful than block system at this stage

### Scope

#### Add Node Types (phased)

**Phase 1 (Immediate)**

* Dropout
* LocalResponseNorm
* AdaptiveAvgPool2d
* Identity
* Softmax

**Phase 2 (Core DL support)**

* LayerNorm
* LSTM
* GRU

**Phase 3 (Transformer support)**

* SelfAttention
* MultiHeadAttention

**Phase 4 (GNN entry point)**

* GCNConv (or MessagePassing placeholder)

---

### Design Rules

* Prefer **high-level nodes** over low-level primitives
* Keep nodes as **black-box operators**
* Avoid introducing loops or control flow
* Preserve current DAG model

#### Recurrence Handling Note

* `LSTM` / `GRU` self-reference is **not** represented as a literal self-edge in the editor graph
* Recurrent semantics should remain black-box in Milestone 1
* True recurrence handling should be deferred to **Milestone 2**, where lowering/expansion can introduce time-step semantics without breaking the DAG editor model
* Layer-name duplication alone is **not** a sufficient solution for recurrent structure

---

### Deliverables

* New node types fully supported:

  * frontend (palette, property panel)
  * backend (validation, shape inference, codegen)
* Stable code generation for new nodes
* No regression in existing graph behavior

---

---

## 🟡 Milestone 2 — Composable Graph Foundation

### Goal

Prepare internal architecture for future reusable blocks.

### Why

* Current system is flat DAG
* Future requires hierarchical/composable graph

---

### Scope

#### 1. Graph IR Separation

Introduce conceptual layers:

* Editor Graph (UI state)
* Compile Graph (pure DAG)
* Future: Lowered Graph (expanded)

---

#### 2. Compiler Pipeline Extension

Current:

* validate → topo → shape → codegen

Future-ready:

* normalize → **lower/expand** → validate → topo → shape → codegen

This is the stage where recurrent/self-referential structures should be resolved:

* editor graph stays acyclic
* recurrent nodes may later lower into expanded step graphs or state-carrying internal representations
* any future self-reference semantics for `LSTM` / `GRU` should be modeled here, not in the flat editor DAG directly

---

#### 3. JSON Schema Versioning

```json
{
  "version": 1,
  "nodes": [...],
  "edges": [...]
}
```

---

#### 4. Node Classification (internal)

* Source
* Sink
* Module
* Functional
* Structural
* Composite (future)

---

### Deliverables

* Internal structure ready for block/subgraph expansion
* No visible UI changes required
* Backward compatibility 유지

---

---

## 🟠 Milestone 3 — SVG Export (Research Feature)

### Goal

Enable paper-ready diagram export.

---

### Scope

* Export full graph (not viewport)
* Clean bounding box + padding
* Remove UI chrome
* Normalize styles
* Output: SVG only

---

### Deliverables

* Deterministic SVG output
* Suitable for research/paper usage

---

---

## 🟢 Milestone 4 — Example Gallery (Presets Upgrade)

### Goal

Transform presets into meaningful architecture examples

---

### Replace presets with:

* LeNet
* AlexNet
* VGGNet
* GoogLeNet
* ResNet

---

### Rules

* Not full reproduction
* Show core idea only
* Keep graph readable

---

---

## 🔴 Milestone 5 — User-defined Reusable Blocks

### Goal

Allow users to define and reuse architectural patterns

---

### Scope

* Select nodes → create block
* Define block inputs/outputs
* Reuse block
* Expand block at compile time

---

### Features

* Block definition vs instance
* Block expansion (lowering)
* Optional repeat count

---

---

## ⚫ Milestone 6 — Advanced Generalization (Future)

### Goal

True general-purpose neural architecture system

---

### Possible Additions

* Loop semantics (RNN unrolling)
* Conditional graph (optional)
* Low-level ops (matmul, reshape, etc.)
* GNN full support
* Attention primitives
* Custom IR

---

---

# ❌ Out of Scope (for now)

* Authentication
* Database persistence
* Real-time collaboration
* Distributed execution

---

# 🧠 Key Philosophy

> "First support more models, then support abstraction"

---

# 📌 One-line Strategy

> Expand expression → stabilize foundation → enable composition
