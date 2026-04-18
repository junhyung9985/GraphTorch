from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.api.schemas import CompileResponse, GraphRequest, ValidationResponse
from app.application.compiler_service import CompilerService
from app.domain.exceptions import CompilerError


router = APIRouter()
service = CompilerService()


@router.post("/validate", response_model=ValidationResponse)
def validate_graph(request: GraphRequest) -> ValidationResponse:
    try:
        result = service.validate(request.model_dump())
        return ValidationResponse(**result.__dict__)
    except CompilerError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/compile", response_model=CompileResponse)
def compile_graph(request: GraphRequest) -> CompileResponse:
    try:
        result = service.compile(request.model_dump())
        return CompileResponse(**result.__dict__)
    except CompilerError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
