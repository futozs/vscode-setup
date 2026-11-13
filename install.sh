#!/usr/bin/env bash
# Install this VS Code setup on macOS.
#   ./install.sh                     link settings/keybindings, sync extensions, shell helpers
#   ./install.sh --fresh             back up everything, uninstall VS Code + all data, reinstall clean, then install
#   ./install.sh --profiles php,android
#                                    also create extra profiles (they share settings and keybindings)
# Safe to re-run. Anything it replaces goes to ~/vscode-backups/<timestamp>/ first.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="/Applications/Visual Studio Code.app"
USER_DIR="$HOME/Library/Application Support/Code/User"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$HOME/vscode-backups/$STAMP"
FRESH=0
PROFILES=""

while [ $# -gt 0 ]; do
  case "$1" in
    --fresh) FRESH=1 ;;
    --profiles) PROFILES="${2:-}"; shift ;;
    *) echo "unknown option: $1"; exit 1 ;;
  esac
  shift
done

say() { printf '\033[1m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!!\033[0m %s\n' "$*"; }

[ "$(uname)" = Darwin ] || { echo "macOS only"; exit 1; }
command -v brew >/dev/null || { echo "Install Homebrew first: https://brew.sh"; exit 1; }

vscode_running() { pgrep -f "$APP/Contents/MacOS/" >/dev/null 2>&1; }

if [ "$FRESH" = 1 ]; then
  if vscode_running; then echo "Quit VS Code first (Cmd+Q), then re-run."; exit 1; fi
  say "Backing up current VS Code to $BACKUP"
  mkdir -p "$BACKUP"
  if [ -x "$APP/Contents/Resources/app/bin/code" ]; then
    "$APP/Contents/Resources/app/bin/code" --list-extensions --show-versions > "$BACKUP/extensions.txt" 2>/dev/null || true
  fi
  # User settings, keybindings, snippets, profiles, MCP config. Skips the large caches.
  if [ -d "$USER_DIR" ]; then
    tar -czf "$BACKUP/user.tar.gz" -C "$USER_DIR/.." \
      --exclude 'User/workspaceStorage' --exclude 'User/History' --exclude 'User/globalStorage/*/*cache*' User
  fi
  echo "   $(du -sh "$BACKUP" | cut -f1) saved"

  say "Removing VS Code and all its data"
  if brew list --cask visual-studio-code >/dev/null 2>&1; then
    brew uninstall --cask --zap visual-studio-code
  elif [ -d "$APP" ]; then
    mv "$APP" "$HOME/.Trash/Visual Studio Code $STAMP.app"
  fi
  rm -rf "$HOME/.vscode" \
         "$HOME/Library/Application Support/Code" \
         "$HOME/Library/Caches/com.microsoft.VSCode" \
         "$HOME/Library/Caches/com.microsoft.VSCode.ShipIt" \
         "$HOME/Library/Preferences/com.microsoft.VSCode.plist" \
         "$HOME/Library/Saved Application State/com.microsoft.VSCode.savedState"
fi

if [ ! -d "$APP" ]; then
  say "Installing VS Code"
  brew install --cask visual-studio-code
fi

# The `code-cli` formula ships a different `code` binary (tunnels only) that shadows the editor's CLI.
if brew list --formula code-cli >/dev/null 2>&1; then
  say "Removing the code-cli formula that shadows the real 'code' command"
  brew uninstall code-cli
fi
CODE="$APP/Contents/Resources/app/bin/code"
if [ ! -e /opt/homebrew/bin/code ] && [ -d /opt/homebrew/bin ]; then
  ln -s "$CODE" /opt/homebrew/bin/code
fi

if ! ls "$HOME/Library/Fonts" /Library/Fonts 2>/dev/null | grep -q "^JetBrainsMonoNerdFont-"; then
  say "Installing JetBrains Mono Nerd Font"
  brew install --cask font-jetbrains-mono-nerd-font
fi

link() { # link <repo-file> <target>
  local src="$REPO/$1" dst="$2"
  if [ -L "$dst" ]; then rm "$dst"
  elif [ -e "$dst" ]; then mkdir -p "$BACKUP"; mv "$dst" "$BACKUP/"; warn "backed up $(basename "$dst") -> $BACKUP/"
  fi
  ln -s "$src" "$dst"
  echo "   linked $dst"
}

say "Linking settings"
mkdir -p "$USER_DIR"
link settings.json "$USER_DIR/settings.json"
link keybindings.json "$USER_DIR/keybindings.json"

read_list() { grep -v '^\s*#' "$REPO/extensions/$1.txt" | grep -v '^\s*$' | tr '[:upper:]' '[:lower:]'; }

sync_extensions() { # sync_extensions <profile-or-empty> <list...>
  local profile="$1"; shift
  local want; want="$(for l in "$@"; do read_list "$l"; done | sort -u)"
  local args=(); [ -n "$profile" ] && args=(--profile "$profile")
  local have; have="$("$CODE" "${args[@]}" --list-extensions 2>/dev/null | tr '[:upper:]' '[:lower:]' | sort -u)"
  for ext in $(comm -13 <(echo "$have") <(echo "$want")); do
    "$CODE" "${args[@]}" --install-extension "$ext" --force >/dev/null && echo "   + $ext" || warn "failed: $ext"
  done
  for ext in $(comm -23 <(echo "$have") <(echo "$want")); do
    "$CODE" "${args[@]}" --uninstall-extension "$ext" >/dev/null && echo "   - $ext" || warn "could not remove: $ext"
  done
}

say "Extensions (Default profile)"
sync_extensions "" core

if [ -n "$PROFILES" ]; then
  for p in ${PROFILES//,/ }; do
    [ -f "$REPO/extensions/$p.txt" ] || { warn "no extensions/$p.txt, skipping"; continue; }
    name="$(echo "${p:0:1}" | tr '[:lower:]' '[:upper:]')${p:1}"
    say "Extensions (profile: $name)"
    sync_extensions "$name" core "$p"
  done
  # Make the extra profiles reuse the Default profile's settings, keybindings, snippets and tasks.
  STORAGE="$USER_DIR/globalStorage/storage.json"
  if [ -f "$STORAGE" ] && ! vscode_running; then
    python3 - "$STORAGE" <<'PY'
import json, sys
path = sys.argv[1]
data = json.load(open(path))
for prof in data.get("userDataProfiles", []):
    if not prof.get("location", "").startswith("builtin"):
        prof["useDefaultFlags"] = {"settings": True, "keybindings": True, "snippets": True, "tasks": True, "mcp": True}
json.dump(data, open(path, "w"), indent=2)
PY
    echo "   profiles share Default settings"
  else
    warn "VS Code is running: set the extra profiles to use Default settings in Profiles editor, or re-run with it closed"
  fi
fi

say "Shell helpers"
ZSHRC="$HOME/.zshrc"
LINE="source \"$REPO/shell/dev.zsh\""
if ! grep -qF "$REPO/shell/dev.zsh" "$ZSHRC" 2>/dev/null; then
  printf '\n# vscode-setup: p / pc project picker, zoxide\n%s\n' "$LINE" >> "$ZSHRC"
  echo "   added to $ZSHRC"
fi
for tool in fzf fd zoxide; do command -v "$tool" >/dev/null || brew install "$tool"; done

if [ -z "$(git config --global core.editor || true)" ]; then
  git config --global core.editor "code --wait"
  echo "   git core.editor = code --wait"
fi

say "Done. Open a new terminal, then: pc <project>"
