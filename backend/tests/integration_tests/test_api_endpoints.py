#!/usr/bin/env python
"""
Comprehensive integration test for Allcontext API endpoints.

Tests the full API lifecycle that developers would use when integrating
with the Allcontext service programmatically via Python requests.

Before running:
1. Start the API server: python app/main.py
2. Ensure .env has ALLCONTEXT_API_KEY set
3. (Optional) Set NGROK_URL in .env for remote testing

Usage:
    python tests/integration_tests/test_api_endpoints.py
"""

import os
import sys
import time
import json
import requests
from pathlib import Path
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from uuid import uuid4

# Load environment variables
backend_dir = Path(__file__).parent.parent.parent  # Go up to backend/
load_dotenv(backend_dir / ".env")

# Configuration
BASE_URL = os.getenv("NGROK_URL", "http://localhost:8000")
API_KEY = os.getenv("ALLCONTEXT_API_KEY")

if not API_KEY:
    print("❌ Error: ALLCONTEXT_API_KEY not found in .env")
    sys.exit(1)

# Test configuration
HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

# Test data for cleanup
created_artifacts = []


class APITestResults:
    """Track test results and statistics."""

    def __init__(self):
        self.tests = []
        self.start_time = time.time()

    def add_test(self, name: str, success: bool, duration: float, details: str = ""):
        self.tests.append({
            "name": name,
            "success": success,
            "duration": duration,
            "details": details
        })

    def print_summary(self):
        total_duration = time.time() - self.start_time
        passed = sum(1 for t in self.tests if t["success"])
        failed = len(self.tests) - passed

        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)

        for test in self.tests:
            status = "✅ PASSED" if test["success"] else "❌ FAILED"
            duration = f"{test['duration']:.3f}s"
            print(f"{test['name']:<50} {status:<10} ({duration})")
            if not test["success"] and test["details"]:
                print(f"  └── {test['details']}")

        print(f"\nResults: {passed} passed, {failed} failed")
        print(f"Total duration: {total_duration:.3f}s")

        if failed == 0:
            print("\n🎉 All tests passed!")
        else:
            print(f"\n⚠️  {failed} test(s) failed. Check the output above.")


results = APITestResults()


def make_request(method: str, endpoint: str, use_default_auth: bool = True, **kwargs) -> requests.Response:
    """Make a request with proper error handling and logging."""
    url = f"{BASE_URL}{endpoint}"

    # Add headers
    if "headers" not in kwargs:
        if use_default_auth:
            kwargs["headers"] = HEADERS.copy()
        else:
            kwargs["headers"] = {"Content-Type": "application/json"}
    else:
        # If custom headers provided and we want default auth, merge them
        if use_default_auth:
            merged_headers = HEADERS.copy()
            merged_headers.update(kwargs["headers"])
            kwargs["headers"] = merged_headers
        # Otherwise, use custom headers as-is (for auth testing)

    # Add timeout
    if "timeout" not in kwargs:
        kwargs["timeout"] = 30

    print(f"  → {method} {endpoint}")

    try:
        response = requests.request(method, url, **kwargs)
        print(f"  ← {response.status_code} ({len(response.content)} bytes)")
        return response
    except requests.exceptions.RequestException as e:
        print(f"  ← Request failed: {e}")
        raise


def test_server_health():
    """Test server health endpoint."""
    print("\n" + "=" * 60)
    print("TEST: Server Health Check")
    print("=" * 60)

    start_time = time.time()
    success = False
    details = ""

    try:
        # Test health endpoint (no auth required)
        response = make_request("GET", "/health")

        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print(f"✅ Server is healthy: {data}")
                success = True
            else:
                details = f"Unexpected health response: {data}"
        else:
            details = f"Health check failed with status {response.status_code}"

    except Exception as e:
        details = f"Health check error: {str(e)}"

    duration = time.time() - start_time
    results.add_test("Server Health Check", success, duration, details)
    return success


def test_authentication():
    """Test API key authentication scenarios."""
    print("\n" + "=" * 60)
    print("TEST: Authentication")
    print("=" * 60)

    start_time = time.time()
    success = False
    details = ""

    try:
        # Test 1: Valid API key
        print("\n  Testing valid API key...")
        response = make_request("GET", "/api/v1/artifacts")

        if response.status_code in [200, 404]:  # 200 = has artifacts, 404 = no artifacts
            print("  ✅ Valid API key accepted")
        else:
            details = f"Valid API key rejected with status {response.status_code}"
            results.add_test("Authentication", False, time.time() - start_time, details)
            return False

        # Test 2: Invalid API key
        print("\n  Testing invalid API key...")
        invalid_headers = {"Content-Type": "application/json", "X-API-Key": "sk_invalid_key"}
        response = make_request("GET", "/api/v1/artifacts", use_default_auth=False, headers=invalid_headers)

        if response.status_code == 401:
            print("  ✅ Invalid API key properly rejected")
            success = True
        else:
            details = f"Invalid API key not rejected properly (got {response.status_code})"

        # Test 3: Missing API key
        print("\n  Testing missing API key...")
        no_auth_headers = {"Content-Type": "application/json"}
        response = make_request("GET", "/api/v1/artifacts", use_default_auth=False, headers=no_auth_headers)

        if response.status_code == 401:
            print("  ✅ Missing API key properly rejected")
        else:
            details = f"Missing API key not rejected properly (got {response.status_code})"
            success = False

    except Exception as e:
        details = f"Authentication test error: {str(e)}"

    duration = time.time() - start_time
    results.add_test("Authentication", success, duration, details)
    return success


def test_create_artifacts():
    """Test artifact creation scenarios."""
    print("\n" + "=" * 60)
    print("TEST: Create Artifacts")
    print("=" * 60)

    start_time = time.time()
    success = False
    details = ""

    try:
        # Test 1: Create artifact with title and content
        print("\n  Creating artifact with title...")
        artifact_data = {
            "title": "API Test Artifact",
            "content": "# API Integration Test\n\nThis artifact was created via API integration test.\n\n## Features\n- Authentication\n- CRUD operations\n- Search functionality",
            "metadata": {
                "category": "testing",
                "created_by": "api_integration_test"
            },
            "is_public": False
        }

        response = make_request("POST", "/api/v1/artifacts", json=artifact_data)

        if response.status_code == 201:
            artifact = response.json()
            created_artifacts.append(artifact["id"])
            print(f"  ✅ Created artifact: {artifact['id']}")
            print(f"     Title: {artifact['title']}")
            print(f"     Content length: {len(artifact['content'])}")
        else:
            details = f"Failed to create artifact with title (status {response.status_code}): {response.text}"
            results.add_test("Create Artifacts", False, time.time() - start_time, details)
            return False

        # Test 2: Create artifact without title (auto-generation)
        print("\n  Creating artifact without title (auto-generation)...")
        no_title_data = {
            "content": "# Auto-Generated Title Test\n\nThis tests the auto-title generation from H1 heading.",
            "metadata": {"test_type": "auto_title"}
        }

        response = make_request("POST", "/api/v1/artifacts", json=no_title_data)

        if response.status_code == 201:
            artifact = response.json()
            created_artifacts.append(artifact["id"])
            print(f"  ✅ Created artifact with auto-title: {artifact['title']}")

            # Verify title was auto-generated from H1
            if artifact["title"] == "Auto-Generated Title Test":
                print("  ✅ Title correctly auto-generated from H1 heading")
            else:
                details = f"Auto-title generation unexpected: got '{artifact['title']}'"
        else:
            details = f"Failed to create artifact without title (status {response.status_code})"
            results.add_test("Create Artifacts", False, time.time() - start_time, details)
            return False

        # Test 3: Create artifact with H2 title (fallback test)
        print("\n  Testing H2 fallback for auto-title...")
        h2_title_data = {
            "content": "No H1 heading here.\n\n## H2 Heading Test\n\nThis should use the H2 for title generation."
        }

        response = make_request("POST", "/api/v1/artifacts", json=h2_title_data)

        if response.status_code == 201:
            artifact = response.json()
            created_artifacts.append(artifact["id"])
            print(f"  ✅ Created artifact with H2 auto-title: {artifact['title']}")
        else:
            details = f"Failed to create artifact with H2 title (status {response.status_code})"

        # Test 4: Test content length validation
        print("\n  Testing content length validation...")
        long_content = "x" * 100001  # Exceed 100k limit
        long_content_data = {
            "content": long_content
        }

        response = make_request("POST", "/api/v1/artifacts", json=long_content_data)

        if response.status_code == 422:  # Validation error
            print("  ✅ Content length limit properly enforced")
            success = True
        else:
            details = f"Content length validation failed (got status {response.status_code})"
            success = False

    except Exception as e:
        details = f"Create artifacts error: {str(e)}"

    duration = time.time() - start_time
    results.add_test("Create Artifacts", success, duration, details)
    return success


def test_list_artifacts():
    """Test artifact listing functionality."""
    print("\n" + "=" * 60)
    print("TEST: List Artifacts")
    print("=" * 60)

    start_time = time.time()
    success = False
    details = ""

    try:
        # Test 1: List all artifacts
        print("\n  Listing all artifacts...")
        response = make_request("GET", "/api/v1/artifacts")

        if response.status_code == 200:
            data = response.json()
            artifacts = data.get("items", [])
            total = data.get("total", 0)

            print(f"  ✅ Listed {len(artifacts)} artifacts (total: {total})")

            # Verify we can see our created artifacts
            our_artifacts = [a for a in artifacts if a["id"] in created_artifacts]
            print(f"  ✅ Found {len(our_artifacts)} of our created artifacts")

        else:
            details = f"Failed to list artifacts (status {response.status_code})"
            results.add_test("List Artifacts", False, time.time() - start_time, details)
            return False

        # Test 2: Test pagination
        print("\n  Testing pagination...")
        response = make_request("GET", "/api/v1/artifacts?limit=2&offset=0")

        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Pagination works: got {len(data.get('items', []))} items")
            success = True
        else:
            details = f"Pagination test failed (status {response.status_code})"

    except Exception as e:
        details = f"List artifacts error: {str(e)}"

    duration = time.time() - start_time
    results.add_test("List Artifacts", success, duration, details)
    return success


def test_get_artifact():
    """Test getting specific artifacts."""
    print("\n" + "=" * 60)
    print("TEST: Get Specific Artifacts")
    print("=" * 60)

    start_time = time.time()
    success = False
    details = ""

    if not created_artifacts:
        details = "No artifacts available to test"
        results.add_test("Get Specific Artifacts", False, time.time() - start_time, details)
        return False

    try:
        artifact_id = created_artifacts[0]

        # Test 1: Get existing artifact
        print(f"\n  Getting artifact {artifact_id}...")
        response = make_request("GET", f"/api/v1/artifacts/{artifact_id}")

        if response.status_code == 200:
            artifact = response.json()
            print(f"  ✅ Retrieved artifact: {artifact['title']}")
            print(f"     Content length: {len(artifact['content'])}")
            print(f"     Created: {artifact['created_at']}")
        else:
            details = f"Failed to get artifact (status {response.status_code})"
            results.add_test("Get Specific Artifacts", False, time.time() - start_time, details)
            return False

        # Test 2: Get non-existent artifact
        print("\n  Testing non-existent artifact...")
        fake_id = str(uuid4())
        response = make_request("GET", f"/api/v1/artifacts/{fake_id}")

        if response.status_code == 404:
            print("  ✅ Non-existent artifact properly returns 404")
        else:
            details = f"Non-existent artifact handling failed (got {response.status_code})"

        # Test 3: Invalid UUID format
        print("\n  Testing invalid UUID format...")
        response = make_request("GET", "/api/v1/artifacts/invalid-uuid")

        if response.status_code in [400, 422]:  # Bad request or validation error
            print("  ✅ Invalid UUID properly rejected")
            success = True
        else:
            details = f"Invalid UUID handling failed (got {response.status_code})"
            success = False

    except Exception as e:
        details = f"Get artifact error: {str(e)}"

    duration = time.time() - start_time
    results.add_test("Get Specific Artifacts", success, duration, details)
    return success


def test_search_artifacts():
    """Test artifact search functionality."""
    print("\n" + "=" * 60)
    print("TEST: Search Artifacts")
    print("=" * 60)

    start_time = time.time()
    success = False
    details = ""

    try:
        # Test 1: Search for content we created
        print("\n  Searching for 'API Integration Test'...")
        response = make_request("GET", "/api/v1/artifacts/search?q=API Integration Test")

        if response.status_code == 200:
            results_data = response.json()
            print(f"  ✅ Search returned {len(results_data)} results")

            # Verify our artifact is in the results
            our_results = [r for r in results_data if r["id"] in created_artifacts]
            if our_results:
                print(f"  ✅ Found {len(our_results)} of our artifacts in search results")
            else:
                print("  ⚠️  Our artifacts not found in search results")
        else:
            details = f"Search failed (status {response.status_code})"
            results.add_test("Search Artifacts", False, time.time() - start_time, details)
            return False

        # Test 2: Search with no results
        print("\n  Searching for non-existent content...")
        response = make_request("GET", "/api/v1/artifacts/search?q=ThisShouldNotExistAnywhere12345")

        if response.status_code == 200:
            results_data = response.json()
            print(f"  ✅ Empty search returned {len(results_data)} results")
        else:
            details = f"Empty search handling failed (status {response.status_code})"

        # Test 3: Search with special characters
        print("\n  Testing search with special characters...")
        response = make_request("GET", "/api/v1/artifacts/search?q=test & integration")

        if response.status_code == 200:
            print("  ✅ Special character search handled")
        else:
            details = f"Special character search failed (status {response.status_code})"

        # Test 4: Empty search query
        print("\n  Testing empty search query...")
        response = make_request("GET", "/api/v1/artifacts/search?q=")

        if response.status_code == 422:  # FastAPI/Pydantic validation error (correct)
            print("  ✅ Empty search query properly rejected with validation error")
            success = True
        else:
            details = f"Empty search query not handled properly (got {response.status_code}, expected 422)"
            success = False

    except Exception as e:
        details = f"Search artifacts error: {str(e)}"

    duration = time.time() - start_time
    results.add_test("Search Artifacts", success, duration, details)
    return success


def test_update_artifacts():
    """Test artifact update functionality."""
    print("\n" + "=" * 60)
    print("TEST: Update Artifacts")
    print("=" * 60)

    start_time = time.time()
    success = False
    details = ""

    if not created_artifacts:
        details = "No artifacts available to test"
        results.add_test("Update Artifacts", False, time.time() - start_time, details)
        return False

    try:
        artifact_id = created_artifacts[0]

        # Test 1: Update title only
        print(f"\n  Updating title of artifact {artifact_id}...")
        update_data = {
            "title": "Updated API Test Artifact"
        }

        response = make_request("PUT", f"/api/v1/artifacts/{artifact_id}", json=update_data)

        if response.status_code == 200:
            artifact = response.json()
            print(f"  ✅ Updated title to: {artifact['title']}")
        else:
            details = f"Failed to update title (status {response.status_code})"
            results.add_test("Update Artifacts", False, time.time() - start_time, details)
            return False

        # Test 2: Update content only
        print("\n  Updating content...")
        update_data = {
            "content": "# Updated Content\n\nThis content has been updated via API test.\n\n## Update Test\n- Title update ✅\n- Content update ✅\n- Metadata update (next)"
        }

        response = make_request("PUT", f"/api/v1/artifacts/{artifact_id}", json=update_data)

        if response.status_code == 200:
            artifact = response.json()
            print(f"  ✅ Updated content ({len(artifact['content'])} chars)")
        else:
            details = f"Failed to update content (status {response.status_code})"

        # Test 3: Update metadata only
        print("\n  Updating metadata...")
        update_data = {
            "metadata": {
                "category": "testing",
                "updated_by": "api_integration_test",
                "update_count": 3,
                "last_test": "metadata_update"
            }
        }

        response = make_request("PUT", f"/api/v1/artifacts/{artifact_id}", json=update_data)

        if response.status_code == 200:
            artifact = response.json()
            print(f"  ✅ Updated metadata: {artifact['metadata']}")
        else:
            details = f"Failed to update metadata (status {response.status_code})"

        # Test 4: Update non-existent artifact
        print("\n  Testing update of non-existent artifact...")
        fake_id = str(uuid4())
        response = make_request("PUT", f"/api/v1/artifacts/{fake_id}", json={"title": "Should fail"})

        if response.status_code == 404:
            print("  ✅ Non-existent artifact update properly rejected")
            success = True
        else:
            details = f"Non-existent artifact update not handled properly (got {response.status_code})"
            success = False

    except Exception as e:
        details = f"Update artifacts error: {str(e)}"

    duration = time.time() - start_time
    results.add_test("Update Artifacts", success, duration, details)
    return success


def test_full_workflow():
    """Test a complete workflow scenario."""
    print("\n" + "=" * 60)
    print("TEST: Full Workflow Integration")
    print("=" * 60)

    start_time = time.time()
    success = False
    details = ""

    try:
        # Step 1: Create a workflow test artifact
        print("\n  Step 1: Creating workflow test artifact...")
        workflow_data = {
            "content": "# Workflow Test Document\n\nThis tests the complete API workflow.\n\n## Workflow Steps\n1. Create document\n2. Search for it\n3. Retrieve it\n4. Update it\n5. Delete it",
            "metadata": {"workflow_test": True}
        }

        response = make_request("POST", "/api/v1/artifacts", json=workflow_data)

        if response.status_code != 201:
            details = f"Workflow create failed (status {response.status_code})"
            results.add_test("Full Workflow Integration", False, time.time() - start_time, details)
            return False

        workflow_artifact = response.json()
        workflow_id = workflow_artifact["id"]
        print(f"  ✅ Created: {workflow_artifact['title']}")

        # Step 2: Search for the artifact
        print("\n  Step 2: Searching for workflow artifact...")
        response = make_request("GET", "/api/v1/artifacts/search?q=Workflow Test Document")

        if response.status_code != 200:
            details = f"Workflow search failed (status {response.status_code})"
            results.add_test("Full Workflow Integration", False, time.time() - start_time, details)
            return False

        search_results = response.json()
        found = any(r["id"] == workflow_id for r in search_results)
        if found:
            print("  ✅ Found in search results")
        else:
            details = "Artifact not found in search results"
            results.add_test("Full Workflow Integration", False, time.time() - start_time, details)
            return False

        # Step 3: Retrieve the artifact
        print("\n  Step 3: Retrieving workflow artifact...")
        response = make_request("GET", f"/api/v1/artifacts/{workflow_id}")

        if response.status_code != 200:
            details = f"Workflow retrieve failed (status {response.status_code})"
            results.add_test("Full Workflow Integration", False, time.time() - start_time, details)
            return False

        retrieved_artifact = response.json()
        print(f"  ✅ Retrieved: {retrieved_artifact['title']}")

        # Step 4: Update the artifact
        print("\n  Step 4: Updating workflow artifact...")
        update_data = {
            "content": retrieved_artifact["content"] + "\n\n## Workflow Status\n✅ All steps completed successfully!",
            "metadata": {**retrieved_artifact["metadata"], "workflow_completed": True}
        }

        response = make_request("PUT", f"/api/v1/artifacts/{workflow_id}", json=update_data)

        if response.status_code != 200:
            details = f"Workflow update failed (status {response.status_code})"
            results.add_test("Full Workflow Integration", False, time.time() - start_time, details)
            return False

        updated_artifact = response.json()
        print(f"  ✅ Updated: {len(updated_artifact['content'])} chars")

        # Step 5: Delete the artifact
        print("\n  Step 5: Deleting workflow artifact...")
        response = make_request("DELETE", f"/api/v1/artifacts/{workflow_id}")

        if response.status_code != 204:
            details = f"Workflow delete failed (status {response.status_code})"
            results.add_test("Full Workflow Integration", False, time.time() - start_time, details)
            return False

        print("  ✅ Deleted successfully")

        # Step 6: Verify deletion
        print("\n  Step 6: Verifying deletion...")
        response = make_request("GET", f"/api/v1/artifacts/{workflow_id}")

        if response.status_code == 404:
            print("  ✅ Artifact properly deleted")
            success = True
        else:
            details = f"Artifact not properly deleted (still accessible with status {response.status_code})"
            success = False

    except Exception as e:
        details = f"Full workflow error: {str(e)}"

    duration = time.time() - start_time
    results.add_test("Full Workflow Integration", success, duration, details)
    return success


def test_delete_artifacts():
    """Test artifact deletion and cleanup."""
    print("\n" + "=" * 60)
    print("TEST: Delete Artifacts (Cleanup)")
    print("=" * 60)

    start_time = time.time()
    success = False
    details = ""

    try:
        if not created_artifacts:
            print("  No artifacts to delete")
            success = True
        else:
            deleted_count = 0

            for artifact_id in created_artifacts[:]:  # Copy list to avoid modification during iteration
                print(f"\n  Deleting artifact {artifact_id}...")
                response = make_request("DELETE", f"/api/v1/artifacts/{artifact_id}")

                if response.status_code == 204:
                    print("  ✅ Deleted successfully")
                    created_artifacts.remove(artifact_id)
                    deleted_count += 1
                elif response.status_code == 404:
                    print("  ⚠️  Already deleted or not found")
                    created_artifacts.remove(artifact_id)
                    deleted_count += 1
                else:
                    print(f"  ❌ Delete failed with status {response.status_code}")

            print(f"\n  Cleaned up {deleted_count} artifacts")
            success = deleted_count > 0 or len(created_artifacts) == 0

    except Exception as e:
        details = f"Delete artifacts error: {str(e)}"

    duration = time.time() - start_time
    results.add_test("Delete Artifacts (Cleanup)", success, duration, details)
    return success


def main():
    """Run the complete API integration test suite."""
    print("=" * 80)
    print("ALLCONTEXT API INTEGRATION TEST SUITE")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Key: {API_KEY[:12]}...{API_KEY[-4:]}")

    if BASE_URL == "http://localhost:8000":
        print("\n⚠️  Using localhost. Set NGROK_URL in .env for remote testing")
    else:
        print(f"\n🌐 Using remote URL: {BASE_URL}")

    # Test suite
    test_functions = [
        test_server_health,
        test_authentication,
        test_create_artifacts,
        test_list_artifacts,
        test_get_artifact,
        test_search_artifacts,
        test_update_artifacts,
        test_full_workflow,
        test_delete_artifacts,  # Cleanup
    ]

    # Run all tests
    print(f"\nRunning {len(test_functions)} test scenarios...\n")

    for test_func in test_functions:
        try:
            test_func()
        except KeyboardInterrupt:
            print("\n\n⚠️  Test interrupted by user")
            break
        except Exception as e:
            print(f"\n❌ Unexpected error in {test_func.__name__}: {e}")
            results.add_test(test_func.__name__, False, 0, str(e))

    # Print final summary
    results.print_summary()

    # Cleanup any remaining artifacts
    if created_artifacts:
        print(f"\n🧹 Cleaning up {len(created_artifacts)} remaining artifacts...")
        for artifact_id in created_artifacts:
            try:
                requests.delete(f"{BASE_URL}/api/v1/artifacts/{artifact_id}", headers=HEADERS, timeout=10)
            except:
                pass


if __name__ == "__main__":
    main()