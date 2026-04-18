# GraphTorch Backend MVP

FastAPI backend for validating DAG graphs, inferring tensor shapes, and generating PyTorch code.

## Structure

- `app/main.py`: FastAPI entrypoint
- `app/api/`: HTTP schemas and routes
- `app/application/`: compile orchestration
- `app/domain/`: graph rules, validation, topological sort, shape inference
- `app/codegen/`: PyTorch code generation
- `tests/`: backend tests

## Run

From `backend/`:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Then run:

```bash
uvicorn app.main:app --reload
```

API docs:

- `http://127.0.0.1:8000/docs`
- Frontend expects the backend base URL to be `http://127.0.0.1:8000`

## Local Run With Frontend

1. Start the backend from `backend/`

```bash
source venv/bin/activate
uvicorn app.main:app --reload
```

2. Set the frontend backend URL in `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

3. Start the frontend from `frontend/`

```bash
npm run dev
```

## Test

From `backend/`:

```bash
source venv/bin/activate
python -m unittest discover -s tests -v
```

## Sample Requests

Validate:

```bash
curl -X POST http://127.0.0.1:8000/validate \
  -H "Content-Type: application/json" \
  --data @examples/validate_graph.json
```

Compile:

```bash
curl -X POST http://127.0.0.1:8000/compile \
  -H "Content-Type: application/json" \
  --data @examples/compile_graph.json
```

## Response Shape

`POST /validate`

```json
{
  "valid": true,
  "topological_order": ["input_image", "conv-1", "relu 1", "output_main"],
  "shapes": {
    "input_image": [1, 3, 32, 32],
    "conv-1": [1, 8, 32, 32],
    "relu 1": [1, 8, 32, 32],
    "output_main": [1, 8, 32, 32]
  }
}
```

`POST /compile`

Returns:

- `code`
- `topological_order`
- `shapes`
