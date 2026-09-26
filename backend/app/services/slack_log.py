import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from swytchcode_runtime import exec as swy_exec

from app.config import SLACK_CHANNEL, SLACK_WORKSPACE_URL

# The Slack app lacks channels:history, so we keep our own record of what the agent sent
LOG_PATH = Path(__file__).resolve().parents[2] / "data" / "slack_activity.jsonl"
_lock = threading.Lock()


def record_message(channel: str, message: str, status: str, repository: str = "",
                   channel_id: str | None = None, ts: str | None = None, error: str | None = None) -> dict:
    entry = {
        "id": uuid.uuid4().hex,
        "channel": channel,
        "message": message,
        "status": status,
        "repository": repository,
        "sentAt": datetime.now(timezone.utc).isoformat(),
        "url": f"{SLACK_WORKSPACE_URL}/archives/{channel_id}/p{ts.replace('.', '')}" if channel_id and ts else None,
        "error": error,
    }
    with _lock:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LOG_PATH.open("a") as f:
            f.write(json.dumps(entry) + "\n")
    return entry


def list_messages(limit: int = 50) -> list[dict]:
    if not LOG_PATH.exists():
        return []
    with _lock:
        lines = LOG_PATH.read_text().splitlines()
    entries = []
    for line in reversed(lines):
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            continue
        if len(entries) >= limit:
            break
    return entries


def post_to_slack(message: str, repository: str = "") -> dict:
    """Post to the agent's Slack channel and record the outcome in the activity log."""
    try:
        response = swy_exec("slack.chat.postmessage.create", {
            "token": "",
            "body": {"channel": SLACK_CHANNEL, "text": message},
        })
        print(f"Slack response: {response}")
        data = response.get("data", {}) if isinstance(response, dict) else {}
        # Slack reports failures like not_in_channel as HTTP 200 with ok=false
        if not data.get("ok"):
            raise RuntimeError(f"Slack API error: {data.get('error', 'unknown error')}")
        return record_message(SLACK_CHANNEL, message, "sent", repository,
                              channel_id=data.get("channel"), ts=data.get("ts"))
    except Exception as e:
        print(f"Error sending Slack: {e}")
        return record_message(SLACK_CHANNEL, message, "failed", repository,
                              error=str(e).strip().splitlines()[-1][:200])
