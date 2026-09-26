from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.services.openai import llm

Severity = Literal["critical", "high", "medium", "low"]
SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}


class Finding(BaseModel):
    severity: Severity
    category: Literal["security", "secret", "bug", "performance", "other"]
    file: str
    line: Optional[int] = Field(None, description="New-file line number from the L<n> annotation, if known")
    title: str = Field(description="One-line description of the problem")
    detail: str = Field(description="Why it is a problem, in one or two sentences")
    suggestion: str = Field(description="Concrete fix")


class ReviewResult(BaseModel):
    summary: str = Field(description="One or two sentences on the overall state of the change")
    findings: list[Finding]


SYSTEM_PROMPT = """You are a strict senior code reviewer running as a git pre-commit hook.
You receive the staged diff. Added lines are prefixed "L<n> +" with their line number in the new file;
removed lines are "-" and context lines are " ". Review ONLY added lines, using the rest as context.

Report real problems in these areas:
- security: injection (SQL, command, template, path traversal), unsafe deserialization, disabled TLS
  verification, weak crypto, missing authorization checks, SSRF, XSS, insecure CORS, eval of untrusted input
- secret: hardcoded credentials, tokens, private keys or connection strings with passwords.
  Values shown as [REDACTED:<type>] were already caught by a local scanner - do not report those again
- bug: crashes, unhandled errors, missing null checks, off-by-one, race conditions, resource leaks
- performance: only clear problems such as N+1 queries or unbounded loops over large data

Severity guide:
- critical: exploitable vulnerability or leaked credential
- high: likely security issue or a bug that will break functionality
- medium: real but limited risk
- low: minor issue worth knowing about

Do not report style, naming, formatting, missing tests, or speculative issues you cannot point to in the diff.
If nothing is wrong, return an empty findings list. Use the exact file paths from the diff."""


def review_diff(diff: str, repository: str = "") -> ReviewResult:
    reviewer = llm.with_structured_output(ReviewResult)
    return reviewer.invoke([
        ("system", SYSTEM_PROMPT),
        ("human", f"Repository: {repository or 'unknown'}\n\nStaged diff:\n{diff}"),
    ])
