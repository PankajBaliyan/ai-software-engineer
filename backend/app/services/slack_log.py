import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.config import SLACK_WORKSPACE_URL

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
