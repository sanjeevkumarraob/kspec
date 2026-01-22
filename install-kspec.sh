#!/usr/bin/env bash
set -euo pipefail

# install-kspec.sh
#
# Installs the `kspec` CLI script and prepares per-project kspec layout.
# - Installs kspec into $PREFIX/bin (default: ~/.local/bin)
# - Does NOT touch ~/.kiro by default
#
# Usage:
#   ./install-kspec.sh           # local install (recommended)
#   PREFIX=/usr/local ./install-kspec.sh

echo "[install-kspec] Starting kspec installation..."

# ---------- Config ----------

PREFIX="${PREFIX:-$HOME/.local}"
BIN_DIR="${PREFIX}/bin"
QOS_SCRIPT_NAME="kspec"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------- Helpers ----------

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

info() {
  printf '[install-kspec] %s\n' "$*"
}

# ---------- Detect CLI Binary ----------

detect_cli_bin() {
  if command -v kiro-cli >/dev/null 2>&1; then
    echo "kiro-cli"
  elif command -v q >/dev/null 2>&1; then
    echo "q"
  else
    die "Neither 'kiro-cli' nor 'q' (Amazon Q CLI) found on PATH. Install one of them first."
  fi
}

CLI_BIN="${CLI_BIN:-$(detect_cli_bin)}"
info "Using CLI binary: ${CLI_BIN}"

# ---------- Install kspec script ----------

install_kspec_script() {
  info "Installing kspec script..."

  mkdir -p "${BIN_DIR}"

  if [[ ! -f "${REPO_ROOT}/${QOS_SCRIPT_NAME}" ]]; then
    die "Could not find '${QOS_SCRIPT_NAME}' script in repo root: ${REPO_ROOT}"
  fi

  cp "${REPO_ROOT}/${QOS_SCRIPT_NAME}" "${BIN_DIR}/${QOS_SCRIPT_NAME}"
  chmod +x "${BIN_DIR}/${QOS_SCRIPT_NAME}"

  info "Installed '${QOS_SCRIPT_NAME}' to ${BIN_DIR}/${QOS_SCRIPT_NAME}"
  info "Ensure '${BIN_DIR}' is on your PATH. Example:"
  info "  export PATH=\"${BIN_DIR}:\$PATH\""
}

# ---------- Optional: Project bootstrap helper ----------

bootstrap_project() {
  info "Bootstrapping kspec for current project (optional)..."

  if [[ ! -f "${REPO_ROOT}/${QOS_SCRIPT_NAME}" ]]; then
    die "kspec script not found in repo root; cannot bootstrap."
  fi

  # We *do not* run kspec /init automatically, but we can give a hint.
  cat <<EOF

[install-kspec] kspec script is installed.

Next steps (per project):

  1. From inside your project root:
       kspec /init

  2. Then use:
       kspec /analyse
       kspec /apply-standards
       kspec /create-spec "Feature Name"
       kspec /create-tasks "Feature Name"
       kspec /execute-tasks "Feature Name"
       kspec /harvest-memory

EOF
}

# ---------- Main ----------

install_kspec_script
bootstrap_project

info "Done."
