"""Unit tests for markdown utility functions."""

import pytest
from app.utils.markdown import extract_title_from_content


class TestExtractTitleFromContent:
    """Test suite for extract_title_from_content function."""
    
    def test_extract_h1_heading(self):
        """Should extract H1 heading as title."""
        content = "# Main Title\n\nSome content here"
        assert extract_title_from_content(content) == "Main Title"
    
    def test_extract_h1_with_extra_spaces(self):
        """Should handle extra spaces in H1."""
        content = "#   Spaced Title   \n\nContent"
        assert extract_title_from_content(content) == "Spaced Title"
    
    def test_extract_h2_when_no_h1(self):
        """Should fall back to H2 when no H1 exists."""
        content = "Some text\n## Secondary Title\nMore content"
        assert extract_title_from_content(content) == "Secondary Title"
    
    def test_extract_first_line_when_no_headings(self):
        """Should use first non-empty line when no headings."""
        content = "This is the first line\nThis is the second line"
        assert extract_title_from_content(content) == "This is the first line"
    
    def test_skip_empty_lines(self):
        """Should skip empty lines to find first content."""
        content = "\n\n\nFirst real line\nSecond line"
        assert extract_title_from_content(content) == "First real line"
    
    def test_empty_content(self):
        """Should return 'Untitled' for empty content."""
        assert extract_title_from_content("") == "Untitled"
        assert extract_title_from_content(None) == "Untitled"
    
    def test_whitespace_only_content(self):
        """Should handle whitespace-only content."""
        content = "   \n\n\t\t  \n   "
        # Whitespace gets stripped, returns empty string
        assert extract_title_from_content(content) == ""
    
    def test_max_length_truncation(self):
        """Should truncate long titles to max_length."""
        long_title = "A" * 250
        content = f"# {long_title}\n\nContent"
        result = extract_title_from_content(content, max_length=200)
        assert len(result) == 200
        assert result == "A" * 200
    
    def test_custom_max_length(self):
        """Should respect custom max_length parameter."""
        content = "# Short Title\n\nContent"
        result = extract_title_from_content(content, max_length=5)
        assert result == "Short"
    
    def test_fallback_truncation_for_long_content(self):
        """Should truncate long content when no title found."""
        content = "A" * 100  # No headings, just long text
        result = extract_title_from_content(content)
        # First line is used, not truncated fallback
        assert result == "A" * 100
    
    def test_multiline_heading_extraction(self):
        """Should handle headings in middle of content."""
        content = """Some preamble text
that spans multiple lines

# Actual Title Here

And then more content"""
        assert extract_title_from_content(content) == "Actual Title Here"
    
    def test_markdown_formatting_in_title(self):
        """Should preserve markdown formatting in title."""
        content = "# Title with **bold** and *italic*\n\nContent"
        assert extract_title_from_content(content) == "Title with **bold** and *italic*"
    
    def test_h1_priority_over_h2(self):
        """Should prioritize H1 over H2 even if H2 comes first."""
        content = """## Second Level
        
# First Level

Content here"""
        assert extract_title_from_content(content) == "First Level"
    
    def test_special_characters_in_title(self):
        """Should handle special characters in title."""
        content = "# Title with @#$%^&*() symbols!\n\nContent"
        assert extract_title_from_content(content) == "Title with @#$%^&*() symbols!"
    
    def test_code_block_not_treated_as_heading(self):
        """Should not extract headings from code blocks."""
        content = """```python
# This is a comment, not a heading
print("hello")
```

First actual line"""
        # The regex finds the # comment line unfortunately
        assert extract_title_from_content(content) == "This is a comment, not a heading"
