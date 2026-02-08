"""
FastAPI router for BrandProfile and TasteExample endpoints.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.brand.schemas import (
    BrandExtractionRequest,
    BrandExtractionResponse,
    BrandProfileCreate,
    BrandProfileResponse,
    BrandProfileUpdate,
    TasteExampleCreate,
    TasteExampleResponse,
    TasteExampleUpdate,
)
from app.brand.service import (
    create_brand_profile,
    create_taste_example,
    delete_taste_example,
    extract_brand_from_documents,
    get_brand_profile,
    get_taste_example,
    list_taste_examples,
    update_brand_profile,
    update_taste_example,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(tags=["brand"])


# ---------------------------------------------------------------------------
# BrandProfile
# ---------------------------------------------------------------------------


@router.post(
    "/api/clients/{client_id}/brand-profile",
    response_model=BrandProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_brand_profile_endpoint(
    client_id: UUID,
    body: BrandProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await create_brand_profile(
        db, client_id, body.model_dump(exclude_unset=True)
    )
    return BrandProfileResponse.model_validate(profile)


@router.get(
    "/api/clients/{client_id}/brand-profile",
    response_model=BrandProfileResponse,
)
async def get_brand_profile_endpoint(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await get_brand_profile(db, client_id)
    return BrandProfileResponse.model_validate(profile)


@router.patch(
    "/api/clients/{client_id}/brand-profile",
    response_model=BrandProfileResponse,
)
async def update_brand_profile_endpoint(
    client_id: UUID,
    body: BrandProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await update_brand_profile(
        db, client_id, body.model_dump(exclude_unset=True)
    )
    return BrandProfileResponse.model_validate(profile)


@router.post(
    "/api/clients/{client_id}/brand-profile/extract",
    response_model=BrandExtractionResponse,
)
async def extract_brand_profile_endpoint(
    client_id: UUID,
    body: BrandExtractionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await extract_brand_from_documents(
        db, client_id, body.document_refs
    )
    return BrandExtractionResponse(**result)


# ---------------------------------------------------------------------------
# TasteExample
# ---------------------------------------------------------------------------


@router.post(
    "/api/clients/{client_id}/taste/examples",
    response_model=TasteExampleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_taste_example_endpoint(
    client_id: UUID,
    body: TasteExampleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    example = await create_taste_example(
        db, client_id, body.model_dump(exclude_unset=True), added_by=current_user.id
    )
    return TasteExampleResponse.model_validate(example)


@router.get(
    "/api/clients/{client_id}/taste/examples",
    response_model=list[TasteExampleResponse],
)
async def list_taste_examples_endpoint(
    client_id: UUID,
    category: Optional[str] = Query(default=None, pattern="^(likes|dislikes)$"),
    type: Optional[str] = Query(
        default=None,
        alias="type",
        pattern="^(campaign|KV|video|social_post|website|copy)$",
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    examples = await list_taste_examples(
        db, client_id, category=category, type_filter=type
    )
    return [TasteExampleResponse.model_validate(e) for e in examples]


@router.get(
    "/api/taste/examples/{example_id}",
    response_model=TasteExampleResponse,
)
async def get_taste_example_endpoint(
    example_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    example = await get_taste_example(db, example_id)
    return TasteExampleResponse.model_validate(example)


@router.patch(
    "/api/taste/examples/{example_id}",
    response_model=TasteExampleResponse,
)
async def update_taste_example_endpoint(
    example_id: UUID,
    body: TasteExampleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    example = await update_taste_example(
        db, example_id, body.model_dump(exclude_unset=True)
    )
    return TasteExampleResponse.model_validate(example)


@router.delete(
    "/api/taste/examples/{example_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_taste_example_endpoint(
    example_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_taste_example(db, example_id)
