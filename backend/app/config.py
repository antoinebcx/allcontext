"""Configuration management for the Context Platform using Pydantic Settings."""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with validation and type conversion."""

    # Supabase settings (required)
    supabase_url: str
    supabase_key: str
    supabase_anon_key: str

    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Environment
    environment: str = "development"
    debug: bool = False

    # API Base URL for MCP
    api_base_url: str = "https://api.allcontext.dev"

    @property
    def port(self) -> int:
        """Get port from environment (Heroku) or use api_port."""
        return int(os.environ.get('PORT', self.api_port))

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development."""
        return self.environment == "development"

    class Config:
        """Pydantic config."""
        # Load from .env file if it exists (local dev)
        # Environment variables always take precedence
        env_file = '.env' if os.path.exists('.env') else None
        env_file_encoding = 'utf-8'
        case_sensitive = False
        extra = 'ignore'  # Ignore extra env vars not defined in Settings


# Create singleton instance
settings = Settings()