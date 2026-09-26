#!/usr/bin/env python3
"""AI Bug Commander pre-commit hook.

1. Scans staged changes for hardcoded credentials locally (secrets never leave the machine).
2. Sends the redacted staged diff to the AI Bug Commander backend for a security/bug review.
3. Blocks the commit on secrets or on findings at/above AI_PRECOMMIT_BLOCK_ON.

Bypass once with:  git commit --no-verify
Skip AI review:    AI_PRECOMMIT_SKIP_AI=1 git commit ...
Silence a line:    add "pragma: allowlist secret" in a comment on that line

Config (environment variables):
  AI_PRECOMMIT_URL       backend base URL           (default http://127.0.0.1:8000)
  AI_PRECOMMIT_BLOCK_ON  critical|high|medium|low   (default high)
  AI_PRECOMMIT_TIMEOUT   seconds to wait for the AI (default 90)
  AI_PRECOMMIT_STRICT    1 = block when the backend is unreachable (default 0)
  AI_PRECOMMIT_SKIP_AI   1 = only run the local secret scan
"""
import json
import math
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

BACKEND_URL = os.getenv("AI_PRECOMMIT_URL", "http://127.0.0.1:8000").rstrip("/")
BLOCK_ON = os.getenv("AI_PRECOMMIT_BLOCK_ON", "high").lower()
TIMEOUT = int(os.getenv("AI_PRECOMMIT_TIMEOUT", "90"))
STRICT = os.getenv("AI_PRECOMMIT_STRICT") == "1"
SKIP_AI = os.getenv("AI_PRECOMMIT_SKIP_AI") == "1"
MAX_DIFF_CHARS = 100_000
ALLOW_MARKER = "pragma: allowlist secret"

SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}

# Files that are noise for review: lockfiles, generated/minified output, binaries, media
IGNORED_NAMES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb", "poetry.lock",
    "Pipfile.lock", "Cargo.lock", "go.sum", "composer.lock", "Gemfile.lock", "uv.lock",
}
IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".pdf", ".zip", ".gz", ".tar",
    ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mp3", ".mov", ".exe", ".dll", ".so", ".dylib",
    ".pyc", ".class", ".jar", ".map", ".lockb",
}
IGNORED_SUFFIXES = (".min.js", ".min.css", ".gen.ts")
IGNORED_DIRS = ("node_modules/", "dist/", "build/", "vendor/", ".venv/", "venv/", "__pycache__/")

# Files that should never be committed at all
FORBIDDEN_FILES = re.compile(r"(^|/)(\.env(\.[\w-]+)?|id_rsa|id_ed25519|.*\.pem|.*\.p12|.*\.pfx|credentials\.json)$")
FORBIDDEN_ALLOWED = re.compile(r"\.env\.(example|sample|template)$")

SECRET_PATTERNS = [
    ("AWS access key", re.compile(r"\b(AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("GitHub token", re.compile(r"\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{50,}\b")),
    ("Slack token", re.compile(r"\bxox[abposr]-[A-Za-z0-9-]{10,}\b")),
    ("Slack webhook", re.compile(r"https://hooks\.slack\.com/services/[A-Za-z0-9/]+")),
    ("OpenAI API key", re.compile(r"\bsk-(proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}\b")),
    ("Anthropic API key", re.compile(r"\bsk-ant-[A-Za-z0-9_-]{20,}\b")),
    ("Google API key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("Stripe secret key", re.compile(r"\b(sk|rk)_live_[0-9A-Za-z]{20,}\b")),
    ("Atlassian API token", re.compile(r"\bATATT3[A-Za-z0-9_=-]{20,}\b")),
    ("Private key", re.compile(r"-----BEGIN (RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY( BLOCK)?-----")),
    ("JWT", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("Credentials in URL", re.compile(r"\b[a-z][a-z0-9+.-]*://[^\s:/@]+:[^\s:/@]{3,}@[^\s/]+", re.I)),
]
# key = "value" style assignments; the value must look random to count
GENERIC_ASSIGNMENT = re.compile(
    r"""(?i)\b([\w.-]*(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?key|auth[_-]?token|token|private[_-]?key|client[_-]?secret))\b"""
    r"""\s*[:=]\s*["']([^"'\s]{8,})["']"""
)
PLACEHOLDER = re.compile(r"(?i)^(x+|\*+|changeme|change_me|password|secret|your[_-].*|<.*>|\$\{.*\}|example.*|dummy.*|test.*|placeholder.*|redacted.*)$")

RED, GREEN, YELLOW, BOLD, DIM, RESET = (
    ("\033[31m", "\033[32m", "\033[33m", "\033[1m", "\033[2m", "\033[0m")
    if sys.stderr.isatty() and not os.getenv("NO_COLOR") else ("",) * 6
)


def out(msg: str = "") -> None:
    print(msg, file=sys.stderr)


def git(*args: str) -> str:
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def is_reviewable(path: str) -> bool:
    name = path.rsplit("/", 1)[-1]
    lower = path.lower()
    if name in IGNORED_NAMES or lower.endswith(IGNORED_SUFFIXES):
        return False
    if any(f"/{d}" in f"/{lower}" for d in IGNORED_DIRS):
        return False
    ext = os.path.splitext(lower)[1]
    return ext not in IGNORED_EXTENSIONS


def entropy(value: str) -> float:
    counts = {c: value.count(c) for c in set(value)}
    return -sum(n / len(value) * math.log2(n / len(value)) for n in counts.values())


def find_secrets(line: str) -> list[tuple[str, str]]:
    """Return (type, matched value) pairs for secrets on one added line."""
    if ALLOW_MARKER in line:
        return []
    hits = [(name, m.group(0)) for name, pattern in SECRET_PATTERNS for m in pattern.finditer(line)]
    for m in GENERIC_ASSIGNMENT.finditer(line):
        value = m.group(2)
        if PLACEHOLDER.match(value) or any(value in h[1] or h[1] in value for h in hits):
            continue
        if entropy(value) >= 3.5 and not value.startswith(("http://", "https://", "/", "./")):
            hits.append((f"Hardcoded {m.group(1)}", value))
    return hits


def parse_diff(diff: str):
    """Annotate added lines with new-file line numbers, redact secrets, and collect secret hits."""
    annotated, secrets = [], []
    current_file, new_line = None, 0
    for raw in diff.splitlines():
        if raw.startswith("+++ "):
            path = raw[4:]
            current_file = path[2:] if path.startswith("b/") else path
            annotated.append(raw)
        elif raw.startswith("@@"):
            m = re.search(r"\+(\d+)", raw)
            new_line = int(m.group(1)) if m else 0
            annotated.append(raw)
        elif raw.startswith("+"):
            text = raw[1:]
            for kind, value in find_secrets(text):
                secrets.append({"file": current_file, "line": new_line, "type": kind})
                text = text.replace(value, f"[REDACTED:{kind}]")
            annotated.append(f"L{new_line} +{text}")
            new_line += 1
        elif raw.startswith(" "):
            annotated.append(raw)
            new_line += 1
        else:
            annotated.append(raw)
    return "\n".join(annotated), secrets


def request_review(diff: str, secrets: list[dict]) -> dict:
    payload = {
        "diff": diff,
        "repository": repository_name(),
        "branch": git("rev-parse", "--abbrev-ref", "HEAD").strip() if has_commits() else "",
        "author": git("config", "user.name").strip() if git_config_exists("user.name") else "",
        "block_on": BLOCK_ON,
        "local_secrets": secrets,
    }
    req = urllib.request.Request(
        f"{BACKEND_URL}/api/review/precommit",
        data=json.dumps(payload).encode(),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read())


def has_commits() -> bool:
    return subprocess.run(["git", "rev-parse", "--verify", "HEAD"], capture_output=True).returncode == 0


def git_config_exists(key: str) -> bool:
    return subprocess.run(["git", "config", key], capture_output=True).returncode == 0


def repository_name() -> str:
    if git_config_exists("remote.origin.url"):
        url = git("config", "remote.origin.url").strip()
        m = re.search(r"[:/]([^/:]+/[^/]+?)(\.git)?$", url)
        if m:
            return m.group(1)
    return os.path.basename(git("rev-parse", "--show-toplevel").strip())


def print_findings(findings: list[dict], threshold: int) -> None:
    colors = {"critical": RED, "high": RED, "medium": YELLOW, "low": DIM}
    for f in sorted(findings, key=lambda f: -SEVERITY_RANK.get(f["severity"], 0)):
        blocking = SEVERITY_RANK.get(f["severity"], 0) >= threshold
        loc = f"{f['file']}:{f['line']}" if f.get("line") else f["file"]
        marker = "✖" if blocking else "•"
        out(f"  {colors.get(f['severity'], '')}{marker} [{f['severity'].upper()}] {f['title']}{RESET}  {DIM}{loc}{RESET}")
        out(f"      {f['detail']}")
        out(f"      {GREEN}Fix:{RESET} {f['suggestion']}")


def main() -> int:
    if BLOCK_ON not in SEVERITY_RANK:
        out(f"{RED}AI_PRECOMMIT_BLOCK_ON must be one of {', '.join(SEVERITY_RANK)}{RESET}")
        return 1
    threshold = SEVERITY_RANK[BLOCK_ON]

    staged = [p for p in git("diff", "--cached", "--name-only", "--diff-filter=ACMR").splitlines() if p]
    if not staged:
        return 0

    out(f"{BOLD}🤖 AI Bug Commander pre-commit review{RESET}")

    forbidden = [p for p in staged if FORBIDDEN_FILES.search(p) and not FORBIDDEN_ALLOWED.search(p)]
    reviewable = [p for p in staged if is_reviewable(p) and p not in forbidden]

    diff = git("diff", "--cached", "--no-color", "--no-ext-diff", "-U3", "--", *reviewable) if reviewable else ""
    annotated, secrets = parse_diff(diff)
    secrets += [{"file": p, "line": 1, "type": "Sensitive file staged"} for p in forbidden]

    blocked = False
    if secrets:
        blocked = True
        out(f"\n{RED}{BOLD}🔑 Possible credentials found (values are not shown or sent anywhere):{RESET}")
        for s in secrets:
            out(f"  {RED}✖ {s['type']}{RESET}  {DIM}{s['file']}:{s['line']}{RESET}")
        out(f"  {DIM}Move secrets to environment variables or a secrets manager. If this is a false positive,")
        out(f"  add a '{ALLOW_MARKER}' comment on the line.{RESET}")

    if SKIP_AI or not annotated.strip():
        if SKIP_AI:
            out(f"{DIM}AI review skipped (AI_PRECOMMIT_SKIP_AI=1).{RESET}")
    elif len(annotated) > MAX_DIFF_CHARS:
        out(f"{YELLOW}⚠ Staged diff is too large for AI review ({len(annotated):,} chars). "
            f"Consider smaller commits. Only the secret scan ran.{RESET}")
    else:
        out(f"{DIM}Reviewing {len(reviewable)} file(s) with AI…{RESET}")
        try:
            review = request_review(annotated, secrets)
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as e:
            reason = getattr(e, "reason", e)
            out(f"{YELLOW}⚠ AI review unavailable ({reason}). Is the backend running at {BACKEND_URL}?{RESET}")
            if STRICT:
                out(f"{RED}Blocking because AI_PRECOMMIT_STRICT=1.{RESET}")
                blocked = True
        else:
            findings = review.get("findings", [])
            if findings:
                out(f"\n{BOLD}AI review:{RESET} {review.get('summary', '')}")
                print_findings(findings, threshold)
            else:
                out(f"{DIM}AI review: {review.get('summary', 'No issues found.')}{RESET}")
            if review.get("verdict") == "FAIL":
                blocked = True
            if review.get("slack_notified"):
                out(f"{DIM}Team notified in Slack.{RESET}")

    out()
    if blocked:
        out(f"{RED}{BOLD}❌ Commit blocked.{RESET} Fix the issues above, or bypass with {BOLD}git commit --no-verify{RESET}.")
        return 1
    out(f"{GREEN}{BOLD}✅ AI review passed.{RESET}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except subprocess.CalledProcessError as e:
        out(f"{YELLOW}⚠ AI pre-commit hook could not read the staged changes: {e}. Allowing commit.{RESET}")
        sys.exit(0)
