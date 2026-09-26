from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph, START, END
from app.services.openai import llm
from swytchcode_runtime import exec as swy_exec
import json

class AgentState(TypedDict):
    user_request: str
    repository: str
    github_issues: Optional[list]
    analysis: Optional[str]
    decision: Optional[str]
    jira_created: Optional[bool]
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

def create_jira(state: AgentState):
    print("📋 Creating Jira Ticket...")
    # This would execute swy_exec("jira.issue.create", {...}) when the bundle is added
    new_result = state.get("result", "") + "\n\n[Action Taken] Created Jira ticket for tracking."
    return {"jira_created": True, "result": new_result}

def send_slack(state: AgentState):
    print("💬 Sending Slack Notification...")
    # This would execute swy_exec("slack.message.create", {...}) when the bundle is added
    jira_status = "A Jira ticket was created." if state.get("jira_created") else "No Jira ticket was needed."
    new_result = state.get("result", "") + f"\n\n[Action Taken] Sent Slack notification. {jira_status}"
    return {"result": new_result}

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