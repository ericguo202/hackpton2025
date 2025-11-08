from contextlib import asynccontextmanager
import os
from typing import Optional, Generator, List

from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import SQLModel, Field, Session, create_engine, select
import redis  


DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5434"))  
DB_NAME = os.getenv("DB_NAME", "charity")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)



engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session



r: Optional[redis.Redis] = None



class Note(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str



@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)  
    global r
    r = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        decode_responses=True,
    )
    try:
        yield
    finally:
        if r is not None:
            try:
                r.close()
            except Exception:
                pass


app = FastAPI(lifespan=lifespan)


# --- Routes ---
@app.get("/health")
def health():
    global r
    try:
        pong = r.ping()
        return {"db": "ok", "redis": pong}
    except Exception as e:
        return {"db": "ok", "redis": False, "error": str(e)}


@app.post("/notes", response_model=Note)
def create_note(text: str, session: Session = Depends(get_session)):
    note = Note(text=text)
    session.add(note)
    session.commit()
    session.refresh(note)

    try:
        r.set("last_note_id", note.id)
    except Exception:
        pass

    return note


@app.get("/notes", response_model=List[Note])
def list_notes(session: Session = Depends(get_session)):
    return session.exec(select(Note)).all()


@app.get("/notes/{note_id}", response_model=Note)
def get_note(note_id: int, session: Session = Depends(get_session)):
    note = session.get(Note, note_id)
    if not note:
        raise HTTPException(404, "Note not found")
    return note
