from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel

from app.graph.graph import graph


app = FastAPI()


class AgentRequest(BaseModel):
    prompt: str


@app.get("/")
def health():
    return {"status": "AI Bug Commander is running"}


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