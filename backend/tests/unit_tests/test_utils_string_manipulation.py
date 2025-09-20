"""Unit tests for string manipulation utility functions."""

import pytest
from app.utils.text import (
    find_and_replace,
    insert_at_line,
    validate_unique_match
)


class TestFindAndReplace:
    """Tests for find_and_replace function."""

    def test_simple_replacement(self):
        """Test basic string replacement."""
        content = "Hello world, this is a test."
        result, count = find_and_replace(content, "world", "Python")
        assert result == "Hello Python, this is a test."
        assert count == 1

    def test_multiple_replacements(self):
        """Test replacing multiple occurrences."""
        content = "foo bar foo baz foo"
        result, count = find_and_replace(content, "foo", "qux")
        assert result == "qux bar qux baz qux"
        assert count == 3

    def test_limited_replacements(self):
        """Test replacing limited number of occurrences."""
        content = "foo bar foo baz foo"
        result, count = find_and_replace(content, "foo", "qux", count=2)
        assert result == "qux bar qux baz foo"
        assert count == 2

    def test_no_match_raises_error(self):
        """Test that ValueError is raised when string not found."""
        content = "Hello world"
        with pytest.raises(ValueError, match="String not found"):
            find_and_replace(content, "Python", "Java")

    def test_empty_string_raises_error(self):
        """Test that empty old_string raises ValueError."""
        content = "Hello world"
        with pytest.raises(ValueError, match="old_string cannot be empty"):
            find_and_replace(content, "", "something")

    def test_preserve_whitespace(self):
        """Test that whitespace is preserved exactly."""
        content = "def function():\n    return True\n"
        result, count = find_and_replace(
            content,
            "    return True",
            "    return False"
        )
        assert result == "def function():\n    return False\n"
        assert count == 1

    def test_multiline_replacement(self):
        """Test replacing multiline strings."""
        content = """Line 1
Line 2
Line 3"""
        result, count = find_and_replace(
            content,
            "Line 2\nLine 3",
            "Modified 2\nModified 3"
        )
        assert result == """Line 1
Modified 2
Modified 3"""
        assert count == 1


class TestInsertAtLine:
    """Tests for insert_at_line function."""

    def test_insert_at_beginning(self):
        """Test inserting at the beginning (line 1)."""
        content = "Line 1\nLine 2\nLine 3"
        result = insert_at_line(content, 1, "New first line")
        assert result == "New first line\nLine 1\nLine 2\nLine 3"

    def test_insert_in_middle(self):
        """Test inserting in the middle."""
        content = "Line 1\nLine 2\nLine 3"
        result = insert_at_line(content, 2, "Inserted line")
        assert result == "Line 1\nInserted line\nLine 2\nLine 3"

    def test_insert_at_end(self):
        """Test inserting at the end."""
        content = "Line 1\nLine 2\nLine 3"
        result = insert_at_line(content, 4, "New last line")
        assert result == "Line 1\nLine 2\nLine 3\nNew last line"

    def test_insert_in_single_line(self):
        """Test inserting in content with single line."""
        content = "Single line"
        result = insert_at_line(content, 1, "Before")
        assert result == "Before\nSingle line"

    def test_line_out_of_range_low(self):
        """Test that line number < 1 raises error."""
        content = "Line 1\nLine 2"
        with pytest.raises(ValueError, match="Line number 0 out of range"):
            insert_at_line(content, 0, "Text")

    def test_line_out_of_range_high(self):
        """Test that line number too high raises error."""
        content = "Line 1\nLine 2"
        with pytest.raises(ValueError, match="Line number 5 out of range"):
            insert_at_line(content, 5, "Text")

    def test_empty_content(self):
        """Test inserting into empty content."""
        content = ""
        result = insert_at_line(content, 1, "First line")
        # Empty content splits to [''], so inserting adds a newline
        assert result == "First line\n"

    def test_insert_empty_line(self):
        """Test inserting an empty line."""
        content = "Line 1\nLine 2"
        result = insert_at_line(content, 2, "")
        assert result == "Line 1\n\nLine 2"


class TestValidateUniqueMatch:
    """Tests for validate_unique_match function."""

    def test_single_match_passes(self):
        """Test that single match passes validation."""
        content = "Hello world"
        count = validate_unique_match(content, "world")
        assert count == 1

    def test_no_match_raises_error(self):
        """Test that no match raises error."""
        content = "Hello world"
        with pytest.raises(ValueError, match="String not found"):
            validate_unique_match(content, "Python")

    def test_multiple_matches_raises_error(self):
        """Test that multiple matches raise error by default."""
        content = "foo bar foo baz foo"
        with pytest.raises(ValueError, match="String appears 3 times"):
            validate_unique_match(content, "foo")

    def test_multiple_matches_allowed(self):
        """Test allowing multiple matches."""
        content = "foo bar foo baz foo"
        count = validate_unique_match(content, "foo", allow_multiple=True)
        assert count == 3

    def test_empty_search_string_raises_error(self):
        """Test that empty search string raises error."""
        content = "Hello world"
        with pytest.raises(ValueError, match="Search string cannot be empty"):
            validate_unique_match(content, "")

    def test_error_message_includes_context(self):
        """Test that error message includes line context for disambiguation."""
        content = """Line 1 with foo
Line 2 with foo
Line 3 with foo
Line 4 with foo"""
        with pytest.raises(ValueError) as exc_info:
            validate_unique_match(content, "foo")

        error_msg = str(exc_info.value)
        assert "String appears 4 times" in error_msg
        assert "Line 1:" in error_msg
        assert "Line 2:" in error_msg
        assert "Line 3:" in error_msg
        assert "and 1 more" in error_msg

    def test_long_string_truncation(self):
        """Test that long strings are truncated in error messages."""
        content = "x" * 200
        with pytest.raises(ValueError) as exc_info:
            validate_unique_match(content, "y")

        error_msg = str(exc_info.value)
        # Should not include the entire 200-char string
        assert len(error_msg) < 150
