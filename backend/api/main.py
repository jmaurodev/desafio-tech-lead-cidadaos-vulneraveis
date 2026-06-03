from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import cache
from .routers import auth, chamados, dashboard, tipos, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    cache.startup()
    yield


app = FastAPI(
    title="Chamados 1746 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(chamados.router, prefix="/chamados", tags=["chamados"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(tipos.router, prefix="/tipos", tags=["tipos"])
app.include_router(users.router, prefix="/users", tags=["users"])


@app.get("/health")
def health():
    return {"status": "ok"}
