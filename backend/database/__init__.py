from database.session import Base, engine, SessionLocal, get_db
from database import models  # noqa: F401 - ensures models are registered on Base before create_all

Base.metadata.create_all(bind=engine)
