from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph, START, END
from app.services.openai import llm
from app.config import JIRA_PROJECT_KEY, JIRA_SITE_URL, SLACK_CHANNEL
from app.services.slack_log import record_message
from swytchcode_runtime import exec as swy_exec
import json
import os

class AgentState(TypedDict):
    user_request: str
    repository: str
    github_issues: Optional[list]
    analysis: Optional[str]
    decision: Optional[str]
    jira_created: Optional[bool]
    jira_key: Optional[str]
    jira_summary: Optional[str]
    jira_url: Optional[str]
    slack_message: Optional[dict]
    result: str

def understand_request(state: AgentState):
    print("🧠 Understanding request...")
    response = llm.invoke(
        f"You are AI Bug Commander. Understand the following user request and outline a plan: {state['user_request']}"
    )
    return {"result": response.content}

def fetch_github_issues(state: AgentState):
    print(f"🐙 Fetching GitHub Issues for {state.get('repository')}...")
    try:
        # Use github.issue.list1 (search API) to fetch open issues for the selected repository
        response = swy_exec("github.issue.list1", {
            "q": f"repo:{state.get('repository')} state:open"
        })
        
        # The search API returns { data: { items: [...] } }
        payload = response.get("data", {}) if isinstance(response, dict) else response
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except Exception:
                payload = {}
        
        issues = payload.get("items", []) if isinstance(payload, dict) else []
    except Exception as e:
        print(f"Error fetching issues: {e}")
        issues = []
    return {"github_issues": issues}

def analyze_issues(state: AgentState):
    print("🔎 Analyzing Issues with OpenAI...")
    issues = state.get('github_issues') or []
    issues_summary = "\n".join([f"- {i.get('title', 'Unknown Issue')}: {i.get('body', 'No description')[:100]}" for i in issues])
    prompt = f"Analyze these GitHub issues based on the user's request '{state['user_request']}':\n{issues_summary}"
    response = llm.invoke(prompt)
    return {"analysis": response.content}

def decide_actions(state: AgentState):
    print("🤔 Deciding Actions (Jira / Slack)...")
    prompt = f"Based on this analysis:\n{state.get('analysis')}\nDoes this situation warrant creating a formal Jira bug ticket? Reply only 'YES' or 'NO'."
    response = llm.invoke(prompt)
    decision = response.content.strip().upper()
    return {"decision": decision}

def to_adf(text: str):
    # Jira REST API v3 requires Atlassian Document Format for the description field
    paragraphs = [p for p in text.split("\n\n") if p.strip()] or [text]
    return {
        "type": "doc",
        "version": 1,
        "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": p}]}
            for p in paragraphs
        ],
    }

def jira_summary(state: AgentState):
    fallback = f"Bug from {state.get('repository', 'Unknown')}"
    try:
        response = llm.invoke(
            f"Based on this analysis:\n{state.get('analysis')}\n"
            "Write a concise Jira ticket title (max 100 characters) for the single most critical bug. "
            "Reply with the title only, no quotes or prefixes."
        )
        title = response.content.strip().strip('"').splitlines()[0].strip()
        # Jira rejects summaries longer than 255 characters
        return title[:255] if title else fallback
    except Exception as e:
        print(f"Error generating Jira summary: {e}")
        return fallback

def create_jira(state: AgentState):
    print("📋 Creating Jira Ticket...")
    summary = jira_summary(state)
    try:
        response = swy_exec("jira.api.issue.create", {
            "body": {
                "fields": {
                    "project": {"key": JIRA_PROJECT_KEY},
                    "summary": summary,
                    "description": to_adf(state.get('analysis') or "Please investigate the recent bug."),
                    "issuetype": {"name": os.getenv("JIRA_ISSUE_TYPE", "Task")}
                }
            }
        })
        print(f"Jira response: {response}")
        data = response.get("data", {}) if isinstance(response, dict) else {}
        jira_key = data.get("key") if isinstance(data, dict) else None
        new_result = state.get("result", "") + f"\n\n[Action Taken] Created Jira ticket {jira_key or ''} for tracking."
        return {"jira_created": True, "jira_key": jira_key, "jira_summary": summary,
                "jira_url": f"{JIRA_SITE_URL}/browse/{jira_key}" if jira_key else None, "result": new_result}
    except Exception as e:
        print(f"Error creating Jira: {e}")
        new_result = state.get("result", "") + f"\n\n[Action Taken] Failed to create Jira ticket: {e}"
        return {"jira_created": False, "result": new_result}

def send_slack(state: AgentState):
    print("💬 Sending Slack Notification...")
    jira_created = state.get("jira_created")
    jira_key = state.get("jira_key")
    if jira_created is True and jira_key:
        jira_status = f"Created Jira ticket {jira_key}: {JIRA_SITE_URL}/browse/{jira_key}"
    elif jira_created is True:
        jira_status = "A Jira ticket was created."
    elif jira_created is False:
        jira_status = "Jira ticket creation failed - check the backend logs."
    else:
        jira_status = "No Jira ticket was needed."
    message = f"AI Bug Commander Update for {state.get('repository')}: {jira_status}"
    
    try:
        response = swy_exec("slack.chat.postmessage.create", {
            "token": "",
            "body": {
                "channel": SLACK_CHANNEL,
                "text": message
            }
        })
        print(f"Slack response: {response}")
        data = response.get("data", {}) if isinstance(response, dict) else {}
        # Slack reports failures like not_in_channel as HTTP 200 with ok=false
        if not data.get("ok"):
            raise RuntimeError(f"Slack API error: {data.get('error', 'unknown error')}")
        slack_message = record_message(SLACK_CHANNEL, message, "sent", state.get("repository", ""),
                       channel_id=data.get("channel"), ts=data.get("ts"))
        new_result = state.get("result", "") + f"\n\n[Action Taken] Sent Slack notification. {jira_status}"
    except Exception as e:
        print(f"Error sending Slack: {e}")
        slack_message = record_message(SLACK_CHANNEL, message, "failed", state.get("repository", ""), error=str(e).strip().splitlines()[-1][:200])
        new_result = state.get("result", "") + f"\n\n[Action Taken] Failed to send Slack notification. {jira_status}"
    
    return {"result": new_result, "slack_message": slack_message}

def route_jira_decision(state: AgentState):
    if "YES" in state.get("decision", ""):
        return "create_jira"
    return "send_slack"

# --- Build the Graph ---
graph_builder = StateGraph(AgentState)

# Add Nodes
graph_builder.add_node("understand_request", understand_request)
graph_builder.add_node("fetch_github_issues", fetch_github_issues)
graph_builder.add_node("analyze_issues", analyze_issues)
graph_builder.add_node("decide_actions", decide_actions)
graph_builder.add_node("create_jira", create_jira)
graph_builder.add_node("send_slack", send_slack)

# Add Edges
graph_builder.add_edge(START, "understand_request")
graph_builder.add_edge("understand_request", "fetch_github_issues")
graph_builder.add_edge("fetch_github_issues", "analyze_issues")
graph_builder.add_edge("analyze_issues", "decide_actions")

# Conditional Routing for Jira
graph_builder.add_conditional_edges(
    "decide_actions",
    route_jira_decision,
    {
        "create_jira": "create_jira",
        "send_slack": "send_slack"
    }
)

# Connect back to flow
graph_builder.add_edge("create_jira", "send_slack")
graph_builder.add_edge("send_slack", END)

graph = graph_builder.compile()