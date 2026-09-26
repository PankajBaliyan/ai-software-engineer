import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.code_review import SEVERITY_RANK, Finding, review_diff
from app.services.slack_log import post_to_slack

router = APIRouter()

MAX_DIFF_CHARS = 120_000


class LocalSecret(BaseModel):
    """A secret the hook found locally. Only its location and type are sent, never the value."""
    file: str
    line: int
    type: str


class PrecommitReviewRequest(BaseModel):
    diff: str = Field(description="Staged diff with secrets already redacted by the hook")
    repository: str = ""
    branch: str = ""
    author: str = ""
    block_on: str = "high"
    local_secrets: list[LocalSecret] = []


class PrecommitReviewResponse(BaseModel):
    verdict: str
    summary: str
    findings: list[Finding]
    slack_notified: bool
    slack_error: Optional[str] = None


def format_slack_alert(req: PrecommitReviewRequest, findings: list[Finding], threshold: int) -> str:
    who = req.author or "Someone"
    where = f"{req.repository or 'a repository'}" + (f" ({req.branch})" if req.branch else "")
    lines = [f":no_entry: Pre-commit review blocked a commit by {who} in {where}."]
    for s in req.local_secrets[:10]:
        lines.append(f"• CRITICAL secret: {s.type} in {s.file}:{s.line}")
    for f in findings:
        if SEVERITY_RANK[f.severity] >= threshold:
            loc = f"{f.file}:{f.line}" if f.line else f.file
            lines.append(f"• {f.severity.upper()} {f.category}: {f.title} ({loc})")
    return "\n".join(lines[:21])


@router.post("/api/review/precommit", response_model=PrecommitReviewResponse)
def review_precommit(req: PrecommitReviewRequest):
    if req.block_on not in SEVERITY_RANK:
        raise HTTPException(status_code=422, detail=f"block_on must be one of {list(SEVERITY_RANK)}")
    if len(req.diff) > MAX_DIFF_CHARS:
        raise HTTPException(status_code=413, detail=f"Diff exceeds {MAX_DIFF_CHARS} characters")

    try:
        result = review_diff(req.diff, req.repository)
    except Exception as e:
        print(f"Pre-commit review failed: {e}")
        raise HTTPException(status_code=502, detail="AI review failed")

    threshold = SEVERITY_RANK[req.block_on]
    blocked = bool(req.local_secrets) or any(SEVERITY_RANK[f.severity] >= threshold for f in result.findings)

    slack_entry = None
    if blocked and os.getenv("PRECOMMIT_SLACK_NOTIFY", "true").lower() == "true":
        slack_entry = post_to_slack(format_slack_alert(req, result.findings, threshold), req.repository)

    return PrecommitReviewResponse(
        verdict="FAIL" if blocked else "PASS",
        summary=result.summary,
        findings=result.findings,
        slack_notified=bool(slack_entry and slack_entry["status"] == "sent"),
        slack_error=slack_entry.get("error") if slack_entry else None,
    )
