"""Markdown utility functions."""

import re


def extract_title_from_content(content: str, max_length: int = 200) -> str:
    """
    Extract a title from markdown content.
    
    Priority:
    1. First # heading
    2. First ## heading  
    3. First non-empty line
    4. Truncated content (fallback)
    
    Args:
        content: Markdown content to extract title from
        max_length: Maximum title length (default 200)
        
    Returns:
        Extracted title, truncated to max_length
    """
    if not content:
        return "Untitled"
    
    # Clean content
    content = content.strip()
    
    # 1. Try to find first # heading
    h1_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if h1_match:
        title = h1_match.group(1).strip()
        return title[:max_length] if len(title) > max_length else title
    
    # 2. Try to find first ## heading
    h2_match = re.search(r'^##\s+(.+)$', content, re.MULTILINE)
    if h2_match:
        title = h2_match.group(1).strip()
        return title[:max_length] if len(title) > max_length else title
    
    # 3. Use first non-empty line
    lines = content.split('\n')
    for line in lines:
        cleaned_line = line.strip()
        if cleaned_line:
            return cleaned_line[:max_length] if len(cleaned_line) > max_length else cleaned_line
    
    # 4. Fallback: truncate content
    if len(content) > 50:
        return content[:50].strip() + "..."
    
    return content
