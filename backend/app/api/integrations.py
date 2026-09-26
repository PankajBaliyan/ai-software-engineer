import json
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import APIRouter
from openai import OpenAI
from swytchcode_runtime import exec as swy_exec

from app.config import JIRA_PROJECT_KEY
from app.services.openai import llm

router = APIRouter()

TOOLING_PATH = Path(__file__).resolve().parents[2] / ".swytchcode" / "tooling.json"


def swy_data(tool: str, args: dict) -> dict:
    response = swy_exec(tool, args)
    data = response.get("data", {}) if isinstance(response, dict) else response
    if isinstance(data, str):
        data = json.loads(data)
    return data if isinstance(data, dict) else {}


def short_error(e: Exception) -> str:
    # Swytchcode errors embed the full CLI log; keep only the final line
    return str(e).strip().splitlines()[-1][:200]


def check_github() -> dict:
    user = swy_data("github.user.list1", {})
    repos = (user.get("public_repos") or 0) + (user.get("total_private_repos") or 0)
    return {"status": "connected", "detail": f"{user.get('login')} · {repos} repositories"}


def check_jira() -> dict:
    project_key = JIRA_PROJECT_KEY
    project = swy_data("jira.api.project.get2", {"projectIdOrKey": project_key})
    issue_type = os.getenv("JIRA_ISSUE_TYPE", "Task")
    types = [t.get("name") for t in project.get("issueTypes", [])]
    if issue_type not in types:
        return {"status": "error", "detail": f"Project {project_key} has no '{issue_type}' issue type"}
    return {"status": "connected", "detail": f"Project {project.get('key')} · {project.get('name')}"}


def check_slack() -> dict:
    auth = swy_data("slack.auth.test.list", {"token": ""})
    if not auth.get("ok"):
        return {"status": "error", "detail": f"Slack auth failed: {auth.get('error', 'unknown error')}"}
    return {"status": "connected", "detail": f"Workspace {auth.get('team')} · bot @{auth.get('user')}"}


def check_openai() -> dict:
    if not os.getenv("OPENAI_API_KEY"):
        return {"status": "disconnected", "detail": "OPENAI_API_KEY is not set"}
    # Validates the key; models.retrieve() 404s on aliases like gpt-5.6 even though chat accepts them
    OpenAI(timeout=10).models.list()
    return {"status": "connected", "detail": f"Model {llm.model_name}"}


def check_swytchcode() -> dict:
    tooling = json.loads(TOOLING_PATH.read_text())
    providers = len(tooling.get("integrations", {}))
    tools = len(tooling.get("tools", {}))
    return {"status": "connected", "detail": f"{providers} providers · {tools} tools enabled · {tooling.get('mode')} mode"}


INTEGRATIONS = [
    ("github", "GitHub", "Issue discovery and repository context", check_github),
    ("jira", "Jira", "Task creation and tracking", check_jira),
    ("slack", "Slack", "Team notifications", check_slack),
    ("openai", "OpenAI", "Reasoning and bug classification", check_openai),
    ("swytchcode", "Swytchcode", "Tool routing and API execution layer", check_swytchcode),
]


def run_check(integration) -> dict:
    id_, name, description, check = integration
    try:
        result = check()
    except Exception as e:
        print(f"Integration check failed for {name}: {e}")
        result = {"status": "error", "detail": short_error(e)}
    return {"id": id_, "name": name, "description": description, **result}


@router.get("/api/integrations")
def get_integrations():
    # Each check is a blocking network call, so run them side by side
    with ThreadPoolExecutor(max_workers=len(INTEGRATIONS)) as pool:
        return list(pool.map(run_check, INTEGRATIONS))
