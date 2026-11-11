#!/usr/bin/env bash
# Run one command under a build lock that every author of one rig shares, so only one build, publish or capture runs
# at a time and a capture never loads a bundle another author is half-way through publishing.
#
#   LOCK_DIR=path/to/rig/.build.lock bash with_lock.sh <command> [args...]
#
# Wrap your whole build -> publish -> capture -> gate sequence in ONE call (a small script), not each step, or another
# author can publish between your build and your capture. Do not nest two calls on the same LOCK_DIR: the inner one
# waits for the outer one forever.
# The lock is a directory (mkdir is atomic). A lock older than LOCK_STALE_SECONDS (default 1200) was left by a killed
# run and is taken over. The command's exit code is returned.
set -u
LOCK="${LOCK_DIR:-.build.lock}"
STALE="${LOCK_STALE_SECONDS:-1200}"
[ $# -gt 0 ] || { echo "usage: LOCK_DIR=<dir> bash with_lock.sh <command> [args...]" >&2; exit 2; }
mtime() { stat -c %Y "$1" 2>/dev/null || stat -f %m "$1"; }   # GNU stat, then BSD/macOS stat
mkdir -p "$(dirname "$LOCK")"
until mkdir "$LOCK" 2>/dev/null; do
  if [ -d "$LOCK" ] && [ $(( $(date +%s) - $(mtime "$LOCK") )) -gt "$STALE" ]; then rm -rf "$LOCK"; continue; fi
  sleep 5
done
echo "pid $$ since $(date +%T): $*" > "$LOCK/owner"
trap 'rm -rf "$LOCK"' EXIT
"$@"
