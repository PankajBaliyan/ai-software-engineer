from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel

from app.graph.graph import graph


app = FastAPI()


class AgentRequest(BaseModel):
    prompt: str


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
        
        # Swytchcode expects SWYTCHCODE_TOKEN in env for headless use
        if os.getenv("SWYTCHCODE_API_KEY") and not os.getenv("SWYTCHCODE_TOKEN"):
            os.environ["SWYTCHCODE_TOKEN"] = os.getenv("SWYTCHCODE_API_KEY")
            
        # Execute the GitHub list repositories tool via Swytchcode runtime
        response = exec("github.repository.list", {})
        
        # Parse the Swytchcode response which maps to the GitHub API schema
        result = response.get("repositories", response) if isinstance(response, dict) else response
        if not isinstance(result, list):
            result = []
            
        repos = []
        for r in result:
            repos.append({
                "id": str(r.get("id", "")),
                "owner": r.get("owner", {}).get("login", "") if isinstance(r.get("owner"), dict) else "",
                "name": r.get("name", ""),
                "fullName": r.get("full_name", ""),
                "visibility": "private" if r.get("private") else "public",
                "openIssues": r.get("open_issues_count", 0),
                "language": r.get("language", "") or "Unknown"
            })
        return repos
    except Exception as e:
        print(f"Error fetching repos from Swytchcode: {e}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Failed to fetch repos from Swytchcode")


@app.post("/api/agent/run")
def run_agent(request: AgentRequest):

    result = graph.invoke({
        "user_request": request.prompt,
        "result": ""
    })

    return {
        "success": True,
        "result": result
    }