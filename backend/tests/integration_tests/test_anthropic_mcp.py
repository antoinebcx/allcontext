#!/usr/bin/env python
"""
Test ContextHub MCP server with Anthropic SDK.

Before running:
1. Start the MCP server: python app/main.py
2. (Optional) Start ngrok: ngrok http 8000
3. Set NGROK_URL in .env if using ngrok
4. Ensure .env has ANTHROPIC_API_KEY and CONTEXTHUB_API_KEY
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
backend_dir = Path(__file__).parent.parent.parent  # Go up to backend/
load_dotenv(backend_dir / ".env")

# Add backend to path for imports
sys.path.insert(0, str(backend_dir))

from anthropic import Anthropic

# Configuration
NGROK_URL = os.getenv("NGROK_URL", "http://localhost:8000")
MCP_URL = f"{NGROK_URL}/mcp"
API_KEY = os.getenv("CONTEXTHUB_API_KEY")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")

if not API_KEY:
    print("Error: CONTEXTHUB_API_KEY not found in .env")
    sys.exit(1)

if not ANTHROPIC_KEY:
    print("Error: ANTHROPIC_API_KEY not found in .env")
    sys.exit(1)

# Initialize Anthropic client
client = Anthropic(api_key=ANTHROPIC_KEY)

def test_list_artifacts():
    """Test listing artifacts."""
    print("\n" + "=" * 60)
    print("TEST: List Artifacts")
    print("=" * 60)
    
    try:
        response = client.beta.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": "List my artifacts using the available tools"
            }],
            mcp_servers=[{
                "type": "url",
                "url": MCP_URL,
                "name": "contexthub",
                "authorization_token": API_KEY
            }],
            betas=["mcp-client-2025-04-04"]
        )
        
        # Check response content
        for content in response.content:
            if content.type == "text":
                print(f"Assistant: {content.text}")
            elif content.type == "mcp_tool_use":
                print(f"\nTool used: {content.name}")
                print(f"Server: {content.server_name}")
                print(f"Input: {content.input}")
            elif content.type == "mcp_tool_result":
                print(f"\nTool result:")
                for result_content in content.content:
                    if result_content.type == "text":
                        print(f"  {result_content.text[:200]}...")
                        
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    return True

def test_create_artifact():
    """Test creating an artifact."""
    print("\n" + "=" * 60)
    print("TEST: Create Artifact")
    print("=" * 60)
    
    try:
        response = client.beta.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": "Create an artifact with the content '# Test from Anthropic\n\nThis artifact was created via Anthropic SDK.'"
            }],
            mcp_servers=[{
                "type": "url",
                "url": MCP_URL,
                "name": "contexthub",
                "authorization_token": API_KEY
            }],
            betas=["mcp-client-2025-04-04"]
        )
        
        # Check response
        for content in response.content:
            if content.type == "text":
                print(f"Assistant: {content.text}")
            elif content.type == "mcp_tool_use":
                print(f"\nCreating artifact...")
                print(f"Tool: {content.name}")
            elif content.type == "mcp_tool_result":
                print(f"Result: Created successfully!")
                
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    return True

def test_search_artifacts():
    """Test searching artifacts."""
    print("\n" + "=" * 60)
    print("TEST: Search Artifacts")
    print("=" * 60)
    
    try:
        response = client.beta.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": "Search for artifacts containing 'Anthropic'"
            }],
            mcp_servers=[{
                "type": "url",
                "url": MCP_URL,
                "name": "contexthub",
                "authorization_token": API_KEY
            }],
            betas=["mcp-client-2025-04-04"]
        )
        
        # Check response
        for content in response.content:
            if content.type == "text":
                print(f"Assistant: {content.text}")
            elif content.type == "mcp_tool_use":
                print(f"\nSearching with query: {content.input.get('query', 'N/A')}")
            elif content.type == "mcp_tool_result":
                print(f"Search completed!")
                
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    return True

def test_get_specific_artifact():
    """Test getting a specific artifact after listing."""
    print("\n" + "=" * 60)
    print("TEST: Get Specific Artifact")
    print("=" * 60)
    
    try:
        # First, list artifacts to get an ID
        response = client.beta.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": "First list my artifacts, then get the details of the first one if any exist"
            }],
            mcp_servers=[{
                "type": "url",
                "url": MCP_URL,
                "name": "contexthub",
                "authorization_token": API_KEY
            }],
            betas=["mcp-client-2025-04-04"]
        )
        
        # Check response
        for content in response.content:
            if content.type == "text":
                print(f"Assistant: {content.text[:500]}...")
            elif content.type == "mcp_tool_use":
                print(f"\nTool: {content.name}")
                if content.name == "get_artifact":
                    print(f"Getting artifact ID: {content.input.get('artifact_id', 'N/A')}")
                    
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    return True

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("ContextHub MCP Server - Anthropic SDK Test Suite")
    print("=" * 60)
    print(f"MCP Server URL: {MCP_URL}")
    print(f"API Key: {API_KEY[:8]}...{API_KEY[-4:]}")
    
    # Note about ngrok
    if NGROK_URL == "http://localhost:8000":
        print("\n⚠️  Using localhost. Set NGROK_URL in .env for remote testing")
    else:
        print(f"\n🌐 Using ngrok URL: {NGROK_URL}")
    
    # Note about beta
    print("\n📝 Note: Using Anthropic beta feature 'mcp-client-2025-04-04'")
    print("   This feature may change in future releases.")
    
    # Run tests
    tests = [
        ("List Artifacts", test_list_artifacts),
        ("Create Artifact", test_create_artifact),
        ("Search Artifacts", test_search_artifacts),
        ("Get Specific Artifact", test_get_specific_artifact)
    ]
    
    results = []
    for name, test_func in tests:
        success = test_func()
        results.append((name, success))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{name}: {status}")
    
    # Overall result
    all_passed = all(success for _, success in results)
    if all_passed:
        print("\n🎉 All tests passed!")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")

if __name__ == "__main__":
    main()
