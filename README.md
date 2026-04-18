# GraphTorch

**GraphTorch**는 딥러닝 모델을 다이어그램으로 구성하면 **PyTorch 코드로 자동 변환해주는 웹 기반 그래프 컴파일러**입니다.

---

## 🚀 Overview

* 노드를 연결해 모델 구조를 시각적으로 설계
* DAG 기반 검증 및 shape inference 수행
* PyTorch `nn.Module` 코드 자동 생성

---

## 🧠 Key Features

* **Graph-based model design**

  * Input / Conv / Add / Concat 등 노드 기반 구성
* **Validation**

  * DAG 검증
  * 연결 규칙 검사
* **Shape Inference**

  * 각 노드 출력 shape 계산
* **Code Generation**

  * PyTorch 코드 자동 생성

---

## 🏗 Architecture

* **Frontend**

  * Next.js
  * React Flow
  * Tailwind CSS

* **Backend**

  * FastAPI
  * Graph compiler (validation → topo sort → shape inference → codegen)

---

## 📦 API

### POST /validate

* 그래프 검증 + 위상 정렬 + shape 계산

### POST /compile

* 위 기능 + PyTorch 코드 생성

---

## ▶️ Run Locally

### 1. Backend

```bash
cd backend
uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

---

## 🌐 URLs

* Frontend: http://localhost:3000
* Backend: http://127.0.0.1:8000

---

## ⚠️ Notes

* frontend에서 backend 호출이 안 될 경우 CORS 설정을 확인하세요.

---

## 🎯 Example Workflow

1. 노드 추가 (Input → Conv → ReLU → Output)
2. edge 연결
3. Validate 클릭 → shape 확인
4. Compile 클릭 → PyTorch 코드 생성

---

## 🖼 Example

```python
class GeneratedModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv_n1 = nn.Conv2d(3, 8, 3, 1, 1)

    def forward(self, image):
        t1 = self.conv_n1(image)
        return {"main": t1}
```

---

## 📌 Future Work

* RNN / Transformer 지원
* Undo / Redo
* Export 기능
* 협업 기능

---

## 🙌 Motivation

복잡한 모델 구조를 코드로 직접 작성하는 대신
**시각적으로 설계하고 코드로 변환하는 경험**을 만들고자 했습니다.

---

## 🧑‍💻 Author

JunHyung Kim
