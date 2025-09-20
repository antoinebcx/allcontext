"""Text processing utility functions."""

from typing import Optional, Tuple


def generate_snippet(content: str, max_length: int = 200) -> str:
    """
    Generate a snippet from content.

    Args:
        content: Full content to create snippet from
        max_length: Maximum length of snippet (default 200)

    Returns:
        Snippet of content, truncated with ellipsis if needed
    """
    if not content:
        return ""

    # Clean up whitespace
    content = content.strip()

    if len(content) <= max_length:
        return content

    return content[:max_length] + "..."


def find_and_replace(
    content: str,
    old_string: str,
    new_string: str,
    count: Optional[int] = None
) -> Tuple[str, int]:
    """
    Replace occurrences of old_string with new_string in content.

    Args:
        content: The text content to modify
        old_string: The exact string to find and replace
        new_string: The replacement string
        count: Maximum number of replacements (None for all)

    Returns:
        Tuple of (modified_content, number_of_replacements_made)

    Raises:
        ValueError: If old_string is empty or not found
    """
    if not old_string:
        raise ValueError("old_string cannot be empty")

    # Count occurrences
    occurrences = content.count(old_string)

    if occurrences == 0:
        raise ValueError(f"String not found: '{old_string[:100]}{'...' if len(old_string) > 100 else ''}'")

    # Perform replacement
    if count is None:
        modified = content.replace(old_string, new_string)
        replacements_made = occurrences
    else:
        modified = content.replace(old_string, new_string, count)
        replacements_made = min(count, occurrences)

    return modified, replacements_made


def insert_at_line(content: str, line_number: int, text: str) -> str:
    """
    Insert text at a specific line number (1-based).

    Args:
        content: The text content to modify
        line_number: The line number where to insert (1-based)
        text: The text to insert

    Returns:
        Modified content with text inserted

    Raises:
        ValueError: If line_number is out of range
    """
    lines = content.split('\n')

    # Validate line number (1-based, but can insert at end+1)
    if line_number < 1 or line_number > len(lines) + 1:
        raise ValueError(f"Line number {line_number} out of range (1-{len(lines)+1})")

    # Convert to 0-based index
    index = line_number - 1

    # Insert the text
    # If inserting at the end (line_number == len(lines) + 1)
    if index == len(lines):
        lines.append(text)
    else:
        # Insert before the specified line
        lines.insert(index, text)

    return '\n'.join(lines)


def validate_unique_match(content: str, old_string: str, allow_multiple: bool = False) -> int:
    """
    Validate that old_string appears exactly once (or handle multiple).

    Args:
        content: The text content to check
        old_string: The string to find
        allow_multiple: If True, allows multiple matches

    Returns:
        Number of occurrences found

    Raises:
        ValueError: If validation fails
    """
    if not old_string:
        raise ValueError("Search string cannot be empty")

    occurrences = content.count(old_string)

    if occurrences == 0:
        raise ValueError(f"String not found: '{old_string[:100]}{'...' if len(old_string) > 100 else ''}'")

    if occurrences > 1 and not allow_multiple:
        # Try to provide context for disambiguation
        lines = content.split('\n')
        matching_lines = []
        for i, line in enumerate(lines, 1):
            if old_string in line:
                matching_lines.append(f"Line {i}: {line.strip()[:80]}...")
                if len(matching_lines) >= 3:
                    matching_lines.append(f"... and {occurrences - 3} more")
                    break

        context = '\n'.join(matching_lines)
        raise ValueError(
            f"String appears {occurrences} times. Please be more specific.\n"
            f"Found in:\n{context}"
        )

    return occurrences
