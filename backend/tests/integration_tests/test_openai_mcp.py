#!/usr/bin/env python
"""
Test Allcontext MCP server with OpenAI SDK.

Before running:
1. Start the MCP server: python app/main.py
2. (Optional) Start ngrok: ngrok http 8000
3. Set NGROK_URL in .env if using ngrok
4. Ensure .env has OPENAI_API_KEY and ALLCONTEXT_API_KEY
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

from openai import OpenAI

# Configuration
NGROK_URL = os.getenv("NGROK_URL", "http://localhost:8000")
MCP_URL = f"{NGROK_URL}/mcp"
API_KEY = os.getenv("ALLCONTEXT_API_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

if not API_KEY:
    print("Error: ALLCONTEXT_API_KEY not found in .env")
    sys.exit(1)

if not OPENAI_KEY:
    print("Error: OPENAI_API_KEY not found in .env")
    sys.exit(1)

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_KEY)

def test_list_artifacts():
    """Test listing artifacts."""
    print("\n" + "=" * 60)
    print("TEST: List Artifacts")
    print("=" * 60)
    
    try:
        response = client.responses.create(
            model="gpt-4o",
            tools=[{
                "type": "mcp",
                "server_label": "Allcontext",
                "server_description": "Personal AI context management platform",
                "server_url": MCP_URL,
                "authorization": API_KEY,
                "require_approval": "never"
            }],
            input="List my artifacts"
        )
        
        print(f"Response: {response.output_text}")
        
        # Check for MCP tool outputs
        for output in response.output:
            if output.type == "mcp_list_tools":
                print(f"\nTools imported: {len(output.tools)} tools")
                for tool in output.tools:
                    # Use attribute access for objects
                    tool_name = tool.name if hasattr(tool, 'name') else str(tool)
                    tool_desc = tool.description if hasattr(tool, 'description') else 'No description'
                    print(f"  - {tool_name}: {tool_desc[:50]}...")
            elif output.type == "mcp_call":
                print(f"\nTool called: {output.name}")
                # Handle None output
                if output.output:
                    print(f"Output: {output.output[:200] if len(output.output) > 200 else output.output}")
                else:
                    print(f"Output: None")
                
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
        response = client.responses.create(
            model="gpt-4o",
            tools=[{
                "type": "mcp",
                "server_label": "Allcontext",
                "server_description": "Personal AI context management platform",
                "server_url": MCP_URL,
                "authorization": API_KEY,
                "require_approval": "never"
            }],
            input="Create an artifact with the content '# Test from OpenAI\n\nThis artifact was created via OpenAI SDK.'"
        )
        
        print(f"Response: {response.output_text}")
        
        # Check for tool execution
        for output in response.output:
            if output.type == "mcp_call" and output.name == "create_artifact":
                print(f"\nTool called: {output.name}")
                # Handle None output
                if output.output:
                    print(f"Output: {output.output}")
                else:
                    print(f"Output: None")
                
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
        response = client.responses.create(
            model="gpt-4o",
            tools=[{
                "type": "mcp",
                "server_label": "Allcontext",
                "server_description": "Personal AI context management platform",
                "server_url": MCP_URL,
                "authorization": API_KEY,
                "require_approval": "never"
            }],
            input="Search for artifacts containing 'OpenAI'"
        )
        
        print(f"Response: {response.output_text}")
        
        # Check results
        for output in response.output:
            if output.type == "mcp_call" and output.name == "search_artifacts":
                print(f"\nTool called: {output.name}")
                # Handle None output safely
                if output.output:
                    print(f"Results: {output.output[:300] if len(output.output) > 300 else output.output}")
                else:
                    print(f"Results: None")
                
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    return True

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("Allcontext MCP Server - OpenAI SDK Test Suite")
    print("=" * 60)
    print(f"MCP Server URL: {MCP_URL}")
    print(f"API Key: {API_KEY[:8]}...{API_KEY[-4:]}")
    
    # Note about ngrok
    if NGROK_URL == "http://localhost:8000":
        print("\n⚠️  Using localhost. Set NGROK_URL in .env for remote testing")
    else:
        print(f"\n🌐 Using ngrok URL: {NGROK_URL}")
    
    # Run tests
    tests = [
        ("List Artifacts", test_list_artifacts),
        ("Create Artifact", test_create_artifact),
        ("Search Artifacts", test_search_artifacts)
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
