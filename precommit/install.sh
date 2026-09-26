#!/usr/bin/env bash
# Install the AI Bug Commander pre-commit hook into a git repository.
#   ./install.sh [path/to/repo]   (defaults to the current directory)
#   ./install.sh --uninstall [path/to/repo]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_SOURCE="$SCRIPT_DIR/ai-precommit.py"
MARKER="AI Bug Commander pre-commit hook"

uninstall=false
if [[ "${1:-}" == "--uninstall" ]]; then uninstall=true; shift; fi
REPO="${1:-.}"

if ! git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1; then
  echo "error: $REPO is not a git repository" >&2
  exit 1
fi

# Respect core.hooksPath (e.g. husky) when it is set
HOOKS_DIR="$(git -C "$REPO" rev-parse --git-path hooks)"
[[ "$HOOKS_DIR" = /* ]] || HOOKS_DIR="$(cd "$REPO" && pwd)/$HOOKS_DIR"
HOOK="$HOOKS_DIR/pre-commit"

if $uninstall; then
  if [[ -f "$HOOK" ]] && grep -q "$MARKER" "$HOOK"; then
    rm "$HOOK"
    [[ -f "$HOOK.pre-ai-backup" ]] && mv "$HOOK.pre-ai-backup" "$HOOK" && echo "Restored previous pre-commit hook."
    echo "Removed AI pre-commit hook from $HOOK"
  else
    echo "No AI pre-commit hook installed at $HOOK"
  fi
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "error: python3 is required" >&2
  exit 1
fi

mkdir -p "$HOOKS_DIR"
if [[ -f "$HOOK" ]] && ! grep -q "$MARKER" "$HOOK"; then
  mv "$HOOK" "$HOOK.pre-ai-backup"
  echo "Existing pre-commit hook moved to $HOOK.pre-ai-backup; it will still run first."
fi

cat > "$HOOK" <<HOOK_EOF
#!/usr/bin/env bash
# $MARKER (installed by $SCRIPT_DIR/install.sh)
set -e
if [[ -x "\$0.pre-ai-backup" ]]; then "\$0.pre-ai-backup" "\$@"; fi
exec python3 "$HOOK_SOURCE" "\$@"
HOOK_EOF
chmod +x "$HOOK" "$HOOK_SOURCE"

echo "Installed AI pre-commit hook at $HOOK"
echo "Backend: ${AI_PRECOMMIT_URL:-http://127.0.0.1:8000}  (set AI_PRECOMMIT_URL to change)"
echo "Bypass once with: git commit --no-verify"
