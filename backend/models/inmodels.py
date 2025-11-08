from sqlmodel import SQLModel, Field, Column, Boolean, text

class CharityCreate(SQLModel):
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    address: str = Field(min_length=5)
    description: str = Field(default="")
    website: str = Field(default="")
    contact: str = Field(min_length=5)

class CharityLogin(SQLModel): 
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=6) 

class CharityEdit(SQLModel): 
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