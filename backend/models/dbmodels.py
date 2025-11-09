from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field, Column, Boolean, text, JSON  

class Charity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(min_length=3, max_length=30, unique=True, index=True)
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    address: str = Field(min_length=5)
    description: str = Field(default="")
    website: str = Field(default="")
    contact: str = Field(min_length=5)
    needs_volunteers: bool = Field(
        sa_column=Column(Boolean, nullable=False, server_default=text("false"))
    )
    needs_donations: bool = Field(
        sa_column=Column(Boolean, nullable=False, server_default=text("false"))
    )
    is_approved: bool = Field(
        sa_column=Column(Boolean, nullable=False, server_default=text("false"))
    )
    geojson: Dict[str, Any] = Field(
        sa_column=Column(JSON, nullable=False, comment="GeoJSON Feature(Point), derived from address")
    )