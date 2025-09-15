"""Unit tests for text utility functions."""

import pytest
from app.utils.text import generate_snippet


class TestGenerateSnippet:
    """Test suite for generate_snippet function."""

    def test_empty_content(self):
        """Should return empty string for empty content."""
        assert generate_snippet("") == ""
        assert generate_snippet(None) == ""

    def test_short_content_no_truncation(self):
        """Should return full content when under max_length."""
        content = "Short content"
        assert generate_snippet(content) == "Short content"

        content = "A" * 200  # Exactly at limit
        assert generate_snippet(content) == "A" * 200

    def test_long_content_truncation(self):
        """Should truncate and add ellipsis when over max_length."""
        content = "A" * 250
        result = generate_snippet(content)
        assert len(result) == 203  # 200 chars + "..."
        assert result == "A" * 200 + "..."

    def test_exact_boundary(self):
        """Should handle content at exact boundary."""
        content = "A" * 200
        assert generate_snippet(content) == "A" * 200  # No ellipsis

        content = "A" * 201
        assert generate_snippet(content) == "A" * 200 + "..."  # With ellipsis

    def test_custom_max_length(self):
        """Should respect custom max_length parameter."""
        content = "Hello World!"
        assert generate_snippet(content, max_length=5) == "Hello..."

        content = "Hello World!"
        assert generate_snippet(content, max_length=6) == "Hello ..."

    def test_whitespace_handling(self):
        """Should strip whitespace from content."""
        content = "  \n\n  Content with spaces  \n\n  "
        assert generate_snippet(content) == "Content with spaces"

        # All whitespace
        content = "   \n\n\t\t  \n   "
        assert generate_snippet(content) == ""

    def test_multiline_content(self):
        """Should handle multiline content correctly."""
        content = """Line 1
Line 2
Line 3
Line 4"""
        result = generate_snippet(content, max_length=15)
        assert result == "Line 1\nLine 2\nL..."

    def test_unicode_content(self):
        """Should handle unicode characters."""
        content = "Hello 世界 🌍 " * 50
        result = generate_snippet(content)
        assert len(result) == 203  # 200 + "..."
        assert result.endswith("...")

    def test_markdown_content(self):
        """Should not strip markdown formatting."""
        content = "# Title\n\n**Bold** and *italic* text with `code`"
        result = generate_snippet(content, max_length=30)
        assert result == "# Title\n\n**Bold** and *italic*..."

    def test_very_small_max_length(self):
        """Should handle very small max_length values."""
        content = "Hello"
        assert generate_snippet(content, max_length=1) == "H..."
        assert generate_snippet(content, max_length=0) == "..."

    def test_preserves_internal_whitespace(self):
        """Should preserve whitespace within content."""
        content = "Word1    Word2\n\nWord3"
        result = generate_snippet(content, max_length=50)
        assert result == "Word1    Word2\n\nWord3"
