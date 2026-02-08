"""
FastAPI application entry point for the CRM + Knowledge Base API.

Registers all routers, configures CORS, and exposes health/root endpoints.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.orchestration.middleware import OrchestrationMiddleware

# ---------------------------------------------------------------------------
# Router imports
# ---------------------------------------------------------------------------
from app.auth.router import router as auth_router
from app.clients.router import router as clients_router
from app.contacts.router import router as contacts_router
from app.contracts.router import router as contracts_router
from app.opportunities.router import router as opportunities_router
from app.projects.router import router as projects_router
from app.brand.router import router as brand_router
from app.feedback.router import router as feedback_router
from app.rules.router import router as rules_router
from app.patterns.router import router as patterns_router
from app.utils.kb_router import router as kb_router
from app.chatbot.router import router as chatbot_router
from app.gmail.router import router as gmail_router
from app.orchestration.router import router as orchestration_router

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Client CRM + Knowledge Base API",
    description=(
        "Agentic AI-powered CRM and Knowledge Base system for managing "
        "clients, contacts, contracts, opportunities, projects, brand "
        "profiles, feedback, rules, and patterns."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

_cors_origins = [o for o in [settings.WEB_BASE_URL] if o]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI orchestration middleware (token monitoring, circuit breaker, model downgrade)
app.add_middleware(OrchestrationMiddleware)

# ---------------------------------------------------------------------------
# Include routers
# ---------------------------------------------------------------------------

app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(contacts_router)
app.include_router(contracts_router)
app.include_router(opportunities_router)
app.include_router(projects_router)
app.include_router(brand_router)
app.include_router(feedback_router)
app.include_router(rules_router)
app.include_router(patterns_router)
app.include_router(kb_router)
app.include_router(chatbot_router)
app.include_router(gmail_router)
app.include_router(orchestration_router)


# ---------------------------------------------------------------------------
# Root and health endpoints
# ---------------------------------------------------------------------------


@app.get("/health", tags=["health"])
async def health_check():
    """Lightweight health check for load balancers and orchestrators."""
    return {"status": "healthy"}


@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Client CRM + Knowledge Base API",
        "version": "0.1.0",
        "docs": f"{settings.API_BASE_URL}/docs",
        "health": f"{settings.API_BASE_URL}/health",
    }
