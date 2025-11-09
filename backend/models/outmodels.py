from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field

class CharityRead(SQLModel):
    id: int
    username: str
    name: str
    address: str
    description: str
    website: str
    contact: str
    needs_volunteers: bool
    needs_donations: bool
    is_approved: bool
    geojson: Dict[str, Any]