# Sourced from ~/.zshrc by install.sh.
#   p [query]   fuzzy-pick a repo under ~/Developer and cd into it
#   pc [query]  same, then open it in VS Code
#   z <part>    zoxide: jump to a frecent directory
#   c           open the current directory in VS Code

export DEV="$HOME/Developer"

_dev_projects() {
  fd --hidden --no-ignore --type d --max-depth 4 --prune '^\.git$' "$DEV" \
    --exclude node_modules --exclude .claude --exclude archive \
    | sed -e 's#/\.git/*$##' -e "s#^$DEV/##" | sort
}

p() {
  local pick
  pick="$(_dev_projects | fzf --height 40% --reverse --select-1 --query "${1:-}" \
    --preview "git -C '$DEV/{}' log --oneline -8 --color=always 2>/dev/null")" || return
  cd "$DEV/$pick"
}

pc() { p "$@" && code .; }

alias c='code .'

command -v zoxide >/dev/null && eval "$(zoxide init zsh)"
