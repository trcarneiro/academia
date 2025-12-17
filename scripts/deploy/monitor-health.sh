#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"

# Usage: monitor-health.sh <url> <timeout_seconds> <stability_minutes> [log_file_scan] [restart_check_cmd] [output_log]
# Example: monitor-health.sh http://localhost:3000/ 300 30 /var/log/app.log "pm2 jlist" "$script_dir/monitor-health.log"

url="${1:-http://localhost:3000/}"
timeout_seconds="${2:-300}"
stability_minutes="${3:-30}"
log_file_scan="${4:-}"
restart_check_cmd="${5:-}"
output_log="${6:-$script_dir/monitor-health.log}"

# reset log file for this run
: > "$output_log"

info() {
  echo "[monitor-health] $*" | tee -a "$output_log"
}

start_ts=$(date +%s)
end_ts=$((start_ts + timeout_seconds))

info "Checking $url with timeout ${timeout_seconds}s and stability window ${stability_minutes}m"

# Step 1: wait for HTTP 200 within timeout
while true; do
  now=$(date +%s)
  if [[ $now -ge $end_ts ]]; then
    info "Timeout waiting for 200 from $url"
    exit 1
  fi
  status=$(curl -k -s -o /dev/null -w "%{http_code}" "$url" || true)
  latency=$(curl -k -s -o /dev/null -w "%{time_total}" "$url" || true)
  if [[ "$status" == "200" ]]; then
    info "Healthy response 200 (latency ${latency}s)"
    break
  fi
  info "Waiting for 200... current status $status"
  sleep 5
done

# Step 2: stability window check
window_end=$(( $(date +%s) + stability_minutes*60 ))
restart_events=0
alias_errors=0

check_logs() {
  if [[ -n "$log_file_scan" && -f "$log_file_scan" ]]; then
    alias_errors=$(grep -Ei "Cannot find module|Module not found|@/" "$log_file_scan" | wc -l || true)
  fi
}

check_restarts() {
  if [[ -n "$restart_check_cmd" ]]; then
    output=$(bash -lc "$restart_check_cmd" || true)
    if echo "$output" | grep -Ei "restart|restarted" >/dev/null; then
      restart_events=$((restart_events + 1))
    fi
  fi
}

while true; do
  now=$(date +%s)
  if [[ $now -ge $window_end ]]; then
    break
  fi
  check_logs
  check_restarts
  sleep 30
done

if [[ $alias_errors -gt 0 ]]; then
  info "Alias/import errors detected in logs"
  exit 1
fi

if [[ $restart_events -gt 0 ]]; then
  info "Process restarts detected during stability window"
  exit 1
fi

info "Health and stability checks passed"