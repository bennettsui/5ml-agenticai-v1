"""
Entry point for running the service with uvicorn:
  uvicorn service.main:app --host 0.0.0.0 --port 8080
"""
from service.app import app  # noqa: F401
