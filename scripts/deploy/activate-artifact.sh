#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 activate <artifact.tar.gz> <app_path> <backup_dir> [restart_cmd]" >&2
  echo "       $0 rollback <backup_dir> <app_path> [restart_cmd]" >&2
  exit 1
}

if [[ $# -lt 3 ]]; then
  usage
fi

action="$1"
restart_cmd=""

if [[ "$action" == "activate" ]]; then
  artifact="$2"
  app_path="$3"
  backup_dir="$4"
  restart_cmd="${5:-}" | true
  if [[ -z "$artifact" || -z "$app_path" || -z "$backup_dir" ]]; then
    usage
  fi
  if [[ ! -f "$artifact" ]]; then
    echo "Artifact not found: $artifact" >&2
    exit 1
  fi

  timestamp=$(date +%Y%m%d%H%M%S)
  mkdir -p "$backup_dir"

  if [[ -d "$app_path" ]]; then
    backup_path="$backup_dir/app-$timestamp"
    mv "$app_path" "$backup_path"
    echo "$backup_path" > "$backup_dir/last_backup.txt"
    echo "Backup created at $backup_path"
  fi

  mkdir -p "$app_path"
  tar -xzf "$artifact" -C "$app_path"
  echo "Artifact extracted to $app_path"

  if [[ -n "$restart_cmd" ]]; then
    echo "Restarting service with: $restart_cmd"
    bash -lc "$restart_cmd"
  fi

  echo "activate:ok"
  exit 0
fi

if [[ "$action" == "rollback" ]]; then
  backup_dir="$2"
  app_path="$3"
  restart_cmd="${4:-}" | true

  if [[ -z "$backup_dir" || -z "$app_path" ]]; then
    usage
  fi

  state_file="$backup_dir/last_backup.txt"
  if [[ ! -f "$state_file" ]]; then
    echo "No backup state found at $state_file" >&2
    exit 1
  fi

  backup_path=$(cat "$state_file")
  if [[ -z "$backup_path" || ! -d "$backup_path" ]]; then
    echo "Backup directory missing: $backup_path" >&2
    exit 1
  fi

  if [[ -d "$app_path" ]]; then
    rm -rf "$app_path"
  fi
  cp -a "$backup_path" "$app_path"
  echo "Rollback restored from $backup_path"

  if [[ -n "$restart_cmd" ]]; then
    echo "Restarting service with: $restart_cmd"
    bash -lc "$restart_cmd"
  fi

  echo "rollback:ok"
  exit 0
fi

usage
