from fastapi import FastAPI
from .routers.auth import router as auth_router
from .routers.profile import router as profile_router
from .routers.flowers import router as flowers_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(flowers_router)
