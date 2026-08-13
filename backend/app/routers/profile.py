from fastapi import APIRouter, HTTPException, status

from backend.app.models.additional_schemas import UserProfile
from backend.app.database import get_database


router = APIRouter(
    prefix="/profile",
    tags=["User Profile"]
)


@router.get("", response_model=UserProfile)
async def get_user_profile():
    """Return an existing app-managed user profile without inventing workforce data."""

    db = get_database()

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB database is not connected."
        )

    profile = await db.user_profiles.find_one(
        {"userId": "CURRENT_USER"},
        {"_id": 0}
    )

    if profile:
        profile.pop("userId", None)
        return UserProfile(**profile)

    return UserProfile()


@router.put("", response_model=UserProfile)
async def update_user_profile(profile: UserProfile):
    """Update an existing app-managed profile only when one is already present."""

    db = get_database()

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB database is not connected."
        )

    existing = await db.user_profiles.find_one({"userId": "CURRENT_USER"})
    if not existing:
        return profile

    profile_data = profile.model_dump()
    await db.user_profiles.update_one(
        {"userId": "CURRENT_USER"},
        {"$set": profile_data}
    )

    return profile