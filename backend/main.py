
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI application
app = FastAPI(
    title="EnergyLens API",
    description="Backend API for EnergyLens Energy Management System",
    version="1.0.0"
)

# React frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Homepage endpoint
@app.get("/")
async def home():
    return {
        "message": "Welcome to EnergyLens API",
        "status": "running"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "application": "EnergyLens"
    }


# API information endpoint
@app.get("/api/info")
async def api_info():
    return {
        "project": "EnergyLens",
        "backend": "FastAPI",
        "version": "1.0.0",
        "modules": [
            "OCR",
            "Translation",
            "Analytics",
            "Predictions"
        ]
    }
