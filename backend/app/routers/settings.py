from fastapi import APIRouter, HTTPException, status

from backend.app.models.additional_schemas import SystemSettings
from backend.app.database import get_database


router = APIRouter(
    prefix="/settings",
    tags=["System Configuration"]
)


@router.get("", response_model=SystemSettings)
async def get_system_settings():
    """Retrieve app-managed configuration settings without creating synthetic defaults."""

    db = get_database()

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB database is not connected."
        )

    settings_doc = await db.system_settings.find_one(
        {"configId": "SYSTEM"},
        {"_id": 0}
    )

    if settings_doc:
        settings_doc.pop("configId", None)
        return SystemSettings(**settings_doc)

    return SystemSettings()


@router.put("", response_model=SystemSettings)
async def update_system_settings(
    settings: SystemSettings
):
    """Persist app-managed configuration only when an existing settings record is present."""

    db = get_database()

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB database is not connected."
        )

    existing = await db.system_settings.find_one({"configId": "SYSTEM"})
    if not existing:
        return settings

    settings_data = settings.model_dump()
    await db.system_settings.update_one(
        {"configId": "SYSTEM"},
        {"$set": settings_data}
    )

    return settings