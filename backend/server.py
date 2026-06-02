from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
from typing import Optional, Any, Dict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ.get("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "sajdah")]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    device_id: str = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatusCheckCreate(BaseModel):
    client_name: str
    device_id: str = None


class SyncPayload(BaseModel):
    device_id: str
    client_name: str
    settings: Dict[str, Any]
    tasbih: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SyncResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    backup_size: int


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


@api_router.post("/sync", response_model=SyncResponse)
async def sync_backup(input: SyncPayload):
    backup_doc = input.dict()
    backup_doc["updated_at"] = datetime.utcnow()
    backup_doc["backup_size"] = len(str(backup_doc.get("settings", {}))) + len(str(backup_doc.get("tasbih", {})))

    await db.device_backups.update_one(
        {"device_id": input.device_id},
        {"$set": backup_doc},
        upsert=True,
    )

    return SyncResponse(
        device_id=input.device_id,
        timestamp=backup_doc["updated_at"],
        backup_size=backup_doc["backup_size"],
    )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
