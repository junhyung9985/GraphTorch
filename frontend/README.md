# GraphTorch Frontend MVP

Next.js frontend for editing DAG graphs, validating them against the backend, and generating PyTorch code.

## Backend Base URL

The frontend calls the backend using:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

If not set, the frontend defaults to `http://127.0.0.1:8000`.

## Frontend Env

Example `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

An example file is also available at `frontend/.env.local.example`.

## Local Run

1. Start the backend

From `backend/`:

```bash
uvicorn app.main:app --reload
```

Backend will be available at `http://127.0.0.1:8000`.

2. Start the frontend

From `frontend/`:

```bash
npm run dev
```

Frontend will be available at `http://127.0.0.1:3000`.

## Optional Checks

From `backend/`:

```bash
python -m unittest discover -s tests -v
```

From `frontend/`:

```bash
npm test
npm run build
```
