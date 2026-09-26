from fastapi import APIRouter

from app.services.slack_log import list_messages

router = APIRouter()


@router.get("/api/slack/messages")
def get_slack_messages(limit: int = 50):
    return list_messages(min(max(limit, 1), 200))
