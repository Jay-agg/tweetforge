from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import generate, evaluate, improve

app = FastAPI(
    title="TweetForge Engine",
    description="AI-powered tweet generation and evaluation engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router)
app.include_router(evaluate.router)
app.include_router(improve.router)


@app.get("/health")
async def health():
    return {"status": "ok", "engine": "TweetForge AI"}
