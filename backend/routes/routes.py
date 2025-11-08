# app/routes.py
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import SQLModel, Field, Session, select
from deps import get_session, SessionDep, RedisDep


router = APIRouter()

