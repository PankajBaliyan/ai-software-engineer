import json

from fastapi import APIRouter, HTTPException
from swytchcode_runtime import exec as swy_exec

from app.config import JIRA_PROJECT_KEY, JIRA_SITE_URL

router = APIRouter()

# Jira priority names -> the frontend's Severity scale
PRIORITY_TO_SEVERITY = {
    "highest": "critical",
    "high": "high",
    "medium": "medium",
    "low": "low",
    "lowest": "low",
}


def to_task(issue: dict) -> dict:
    fields = issue.get("fields", {})
    priority = (fields.get("priority") or {}).get("name", "")
    assignee = (fields.get("assignee") or {}).get("displayName")
    return {
        "key": issue.get("key"),
        "title": fields.get("summary", ""),
        "priority": PRIORITY_TO_SEVERITY.get(priority.lower(), "medium"),
        "status": (fields.get("status") or {}).get("name", "Unknown"),
        "assignee": assignee or "Unassigned",
        "issueType": (fields.get("issuetype") or {}).get("name", ""),
        "createdAt": fields.get("created", ""),
        "url": f"{JIRA_SITE_URL}/browse/{issue.get('key')}",
    }


@router.get("/api/jira/tasks")
def get_jira_tasks(limit: int = 50):
    try:
        response = swy_exec("jira.api.jql.list", {
            "jql": f"project = {JIRA_PROJECT_KEY} ORDER BY created DESC",
            "maxResults": min(max(limit, 1), 100),
            "fields": "summary,status,priority,assignee,issuetype,created",
        })
        data = response.get("data", {}) if isinstance(response, dict) else response
        if isinstance(data, str):
            data = json.loads(data)
        return [to_task(issue) for issue in data.get("issues", [])]
    except Exception as e:
        print(f"Error fetching Jira tasks: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch Jira tasks")
