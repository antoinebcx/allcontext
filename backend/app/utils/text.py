"""Text processing utility functions."""


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
