from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel

from app.graph.graph import graph
from app.api.integrations import router as integrations_router
from app.api.jira import router as jira_router
from app.api.slack import router as slack_router


app = FastAPI()
app.include_router(integrations_router)
app.include_router(jira_router)
app.include_router(slack_router)


class AgentRequest(BaseModel):
    prompt: str
    repository: str | None = None


import os
import httpx

@app.get("/")
def health():
    return {"status": "AI Bug Commander is running"}

@app.get("/api/repositories")
async def get_repositories():
    try:
        from swytchcode_runtime import exec
        import os
        import json

        # Swytchcode expects SWYTCHCODE_TOKEN in env for headless use
        if os.getenv("SWYTCHCODE_API_KEY") and not os.getenv("SWYTCHCODE_TOKEN"):
            os.environ["SWYTCHCODE_TOKEN"] = os.getenv("SWYTCHCODE_API_KEY")

        username = "PankajBaliyan"
        # MUST be small (e.g. 15) to prevent Swytchcode from truncating the large JSON output.
        # If truncated, json.loads() fails and it returns an empty array.
        per_page = 15
        page = 1

        all_repos = []

        while True:
            response = exec(
                "github.repo.get4",
                {
                    "username": username,
                    "per_page": per_page,
                    "page": page,
                }
            )

            result = response if isinstance(response, list) else response.get("data", [])

            if isinstance(result, str):
                try:
                    result = json.loads(result)
                except Exception:
                    result = []

            if not isinstance(result, list):
                result = []

            all_repos.extend(result)

            # Last page reached
            if len(result) < per_page:
                break

            page += 1

        repos = []
        # print("all_repos",all_repos)
        for r in all_repos:
            repos.append({
                "id": str(r.get("id", "")),
                "owner": (
                    r.get("owner", {}).get("login", "")
                    if isinstance(r.get("owner"), dict)
                    else ""
                ),
                "name": r.get("name", ""),
                "fullName": r.get("full_name", ""),
                "visibility": "private" if r.get("private") else "public",
                "openIssues": r.get("open_issues_count", 0),
                "language": r.get("language", "") or "Unknown",
            })

        return repos

    except Exception as e:
        print(f"Error fetching repos from Swytchcode: {e}")

        from fastapi import HTTPException
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch repos from Swytchcode"
        )

@app.post("/api/agent/run")
def run_agent(request: AgentRequest):

    result = graph.invoke({
        "user_request": request.prompt,
        "repository": request.repository or "",
        "result": ""
    })

    return {
        "success": True,
        "state": result
    }