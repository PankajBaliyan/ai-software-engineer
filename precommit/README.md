# AI pre-commit review

Reviews staged changes before every `git commit`:

1. **Secret scan (local):** finds API keys, tokens, private keys, passwords and staged `.env`/key files.
   Values are redacted before anything leaves your machine. Any hit blocks the commit.
2. **AI review (backend):** sends the redacted diff to `POST /api/review/precommit`, which looks for
   vulnerabilities (injection, unsafe deserialization, disabled TLS, …) and serious bugs.
   Findings at or above `AI_PRECOMMIT_BLOCK_ON` block the commit.
3. **Notify:** results print in the terminal; blocked commits also post an alert to the agent's
   Slack channel (secret values are never included). Disable with `PRECOMMIT_SLACK_NOTIFY=false`
   in the backend environment.

## Install

```bash
./precommit/install.sh /path/to/your/repo      # or run inside the repo with no argument
./precommit/install.sh --uninstall /path/to/your/repo
```

An existing pre-commit hook is kept as `pre-commit.pre-ai-backup` and still runs first.
The hook calls `precommit/ai-precommit.py` in this project, so keep this folder where it is.

## Daily use

| Need | Command |
|---|---|
| Bypass once | `git commit --no-verify` |
| Secret scan only | `AI_PRECOMMIT_SKIP_AI=1 git commit …` |
| Allow a flagged line | add a `pragma: allowlist secret` comment on it |

## Configuration (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `AI_PRECOMMIT_URL` | `http://127.0.0.1:8000` | Backend address |
| `AI_PRECOMMIT_BLOCK_ON` | `high` | Lowest severity that blocks: `critical`, `high`, `medium`, `low` |
| `AI_PRECOMMIT_TIMEOUT` | `90` | Seconds to wait for the AI review |
| `AI_PRECOMMIT_STRICT` | `0` | `1` blocks commits when the backend is unreachable |

If the backend is down, the secret scan still runs and the commit is allowed (unless strict mode is on).
