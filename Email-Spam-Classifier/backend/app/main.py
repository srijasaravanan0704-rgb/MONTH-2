import os
import sys
from pathlib import Path
import logging

# Ensure backend and project root directories are in sys.path
_current_file = Path(__file__).resolve()
_backend_dir = _current_file.parent.parent  # .../backend
_root_dir = _backend_dir.parent             # .../

for _p in [str(_backend_dir), str(_root_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes import health, prediction, model_info

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("spam_classifier_backend")

app = FastAPI(
    title="Email Spam Classifier API",
    description="Production-quality REST API serving real machine learning inference for email spam classification.",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
]

custom_origins = os.getenv("CORS_ORIGINS")
if custom_origins:
    origins.extend([o.strip() for o in custom_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if custom_origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com" if not custom_origins else None,
    allow_credentials=True if custom_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers - standard endpoints
app.include_router(health.router)
app.include_router(prediction.router)
app.include_router(model_info.router)

# Also mount under /api prefix for Vercel Serverless Function & proxy routing compatibility
app.include_router(health.router, prefix="/api")
app.include_router(prediction.router, prefix="/api")
app.include_router(model_info.router, prefix="/api")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal server error occurred. Please try again later."}
    )

@app.get("/")
@app.get("/api")
def root():
    return {
        "title": "Email Spam Classifier API",
        "docs": "/docs",
        "health": "/health",
        "predict": "/predict",
        "model_info": "/model-info",
        "samples": "/samples",
        "statistics": "/statistics"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
