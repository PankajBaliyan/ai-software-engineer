from typing import TypedDict

from langgraph.graph import StateGraph, START, END
from app.services.openai import llm


class AgentState(TypedDict):
    user_request: str
    result: str


def understand_request(state: AgentState):

    print("🧠 Understanding request...")

    response = llm.invoke(
        f"""
You are AI Bug Commander, an AI software engineering agent.

Understand the user's request and determine what they want the agent to accomplish.

User request:
{state["user_request"]}

Return a concise explanation of:
1. The user's goal
2. What information we need
3. What actions may be required

Do not execute anything yet.
"""
    )

    print("🤖 OpenAI response:")
    print(response.content)

    return {
        "result": response.content
    }


graph_builder = StateGraph(AgentState)

graph_builder.add_node(
    "understand_request",
    understand_request
)

graph_builder.add_edge(
    START,
    "understand_request"
)

graph_builder.add_edge(
    "understand_request",
    END
)

graph = graph_builder.compile()