"""Utility functions for the Context Platform."""

from .markdown import extract_title_from_content
from .text import (
    generate_snippet,
    find_and_replace,
    insert_at_line,
    validate_unique_match
)

__all__ = [
    'extract_title_from_content',
    'generate_snippet',
    'find_and_replace',
    'insert_at_line',
    'validate_unique_match'
]