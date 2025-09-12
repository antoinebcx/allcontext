"""Configuration management for the Context Platform."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / '.env'
load_dotenv(env_path)


class Config:
    """Application configuration."""
    
    # Database mode
    USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"
    
    # Supabase settings
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    
    # API settings
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))
    
    # MCP settings
    MCP_MODE = os.getenv("MCP_MODE", "false").lower() == "true"
    
    @classmethod
    def get_artifact_service(cls):
        """Get the appropriate artifact service based on configuration."""
        if cls.USE_SUPABASE:
            from app.services.artifacts_supabase import artifact_service_supabase
            return artifact_service_supabase
        else:
            from app.services.artifacts import artifact_service
            return artifact_service


config = Config()
