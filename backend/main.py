from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, evaluations, payments
from app.database import connect_db, disconnect_db

app = FastAPI(title="AI Answer Sheet Evaluator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/api/auth",        tags=["Authentication"])
app.include_router(evaluations.router, prefix="/api/evaluations", tags=["Evaluations"])
app.include_router(payments.router,    prefix="/api/payments",    tags=["Payments"])

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()

@app.get("/")
async def root():
    return {"message": "AI Answer Sheet Evaluator API is running"}