#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
DEFAULT_DATABASE_URL="postgresql://link2pay:link2pay@localhost:5433/link2pay?schema=public"
EXAMPLE_DATABASE_URL="postgresql://user:password@localhost:5432/link2pay?schema=public"

log() {
  printf '[link2pay-setup] %s\n' "$1"
}

warn() {
  printf '[link2pay-setup] WARNING: %s\n' "$1" >&2
}

die() {
  printf '[link2pay-setup] ERROR: %s\n' "$1" >&2
  exit 1
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    die "Required command not found: ${command_name}"
  fi
}

assert_linux() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    die "This script is intended for Linux."
  fi
}

assert_node_version() {
  local node_major
  node_major="$(node -p "process.versions.node.split('.')[0]")"

  if (( node_major < 18 )); then
    die "Node.js 18+ is required. Current version: $(node -v)"
  fi
}

assert_docker_ready() {
  if ! docker compose version >/dev/null 2>&1; then
    die "Docker Compose plugin is required. Install Docker Engine + Compose plugin first."
  fi

  if ! docker info >/dev/null 2>&1; then
    die "Docker daemon is not running. Start Docker and retry."
  fi
}

copy_env_if_missing() {
  local source_file="$1"
  local target_file="$2"

  if [[ ! -f "$target_file" ]]; then
    cp "$source_file" "$target_file"
    log "Created $(basename "$target_file") from $(basename "$source_file")"
  fi
}

read_database_url() {
  local env_file="$1"
  local raw_database_url

  raw_database_url="$(awk -F= '/^DATABASE_URL=/{sub(/^DATABASE_URL=/,""); print; exit}' "$env_file")"
  raw_database_url="${raw_database_url#\"}"
  raw_database_url="${raw_database_url%\"}"

  printf '%s' "$raw_database_url"
}

set_database_url() {
  local env_file="$1"
  local new_database_url="$2"

  if grep -q '^DATABASE_URL=' "$env_file"; then
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${new_database_url}\"|" "$env_file"
  else
    printf '\nDATABASE_URL="%s"\n' "$new_database_url" >> "$env_file"
  fi
}

configure_default_database_url() {
  local env_file="${BACKEND_DIR}/.env"
  local current_database_url

  current_database_url="$(read_database_url "$env_file")"

  if [[ -z "$current_database_url" || "$current_database_url" == "$EXAMPLE_DATABASE_URL" ]]; then
    set_database_url "$env_file" "$DEFAULT_DATABASE_URL"
    log "Configured backend/.env DATABASE_URL for local Docker PostgreSQL."
  fi
}

install_dependencies() {
  local project_dir="$1"
  local project_name="$2"

  log "Installing ${project_name} dependencies"
  if [[ -f "${project_dir}/package-lock.json" ]]; then
    (cd "$project_dir" && npm ci)
  else
    (cd "$project_dir" && npm install)
  fi
}

ensure_postgres_container() {
  if [[ ! -f "$COMPOSE_FILE" ]]; then
    die "Missing docker-compose.yml at project root."
  fi

  log "Starting local PostgreSQL container"
  docker compose -f "$COMPOSE_FILE" up -d postgres >/dev/null
}

wait_for_postgres() {
  local attempts=40
  local i

  log "Waiting for PostgreSQL to be ready"
  for ((i = 1; i <= attempts; i++)); do
    if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U link2pay -d link2pay >/dev/null 2>&1; then
      log "PostgreSQL is ready"
      return 0
    fi
    sleep 1
  done

  die "PostgreSQL did not become ready in time."
}

has_migrations() {
  local migrations_dir="${BACKEND_DIR}/prisma/migrations"
  if [[ -d "$migrations_dir" ]] && find "$migrations_dir" -mindepth 1 -maxdepth 1 -type d | grep -q .; then
    return 0
  fi
  return 1
}

run_prisma_sync() {
  local database_url
  database_url="$(read_database_url "${BACKEND_DIR}/.env")"

  if [[ -z "$database_url" ]]; then
    warn "DATABASE_URL is missing in backend/.env. Skipping Prisma sync."
    return 0
  fi

  if has_migrations; then
    log "Applying Prisma migrations"
    (cd "$BACKEND_DIR" && npx prisma migrate deploy)
  else
    warn "No migrations found. Syncing schema with prisma db push."
    (cd "$BACKEND_DIR" && npx prisma db push)
  fi
}

build_projects() {
  log "Building backend"
  (cd "$BACKEND_DIR" && npm run build)

  log "Building frontend"
  (cd "$FRONTEND_DIR" && npm run build)
}

ensure_launchers_executable() {
  chmod +x "${ROOT_DIR}/setup.sh" "${ROOT_DIR}/link2pay"
}

assert_linux
require_command node
require_command npm
require_command docker
assert_node_version
assert_docker_ready

copy_env_if_missing "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
copy_env_if_missing "${FRONTEND_DIR}/.env.example" "${FRONTEND_DIR}/.env"
configure_default_database_url

install_dependencies "$BACKEND_DIR" "backend"
install_dependencies "$FRONTEND_DIR" "frontend"

ensure_postgres_container
wait_for_postgres

log "Generating Prisma client"
(cd "$BACKEND_DIR" && npx prisma generate)
run_prisma_sync

build_projects
ensure_launchers_executable

cat <<'EOF'
[link2pay-setup] Setup complete.

Local run command:
  ./link2pay

What ./link2pay does:
  - Starts backend on http://localhost:3001
  - Starts frontend preview on http://localhost:4173

PostgreSQL (Docker):
  docker compose ps
  docker compose down
EOF
