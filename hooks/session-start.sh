#!/bin/bash
# megg SessionStart hook for Claude Code
#
# This script loads megg context at session start.
# Output is JSON that gets injected as additionalContext.

# Check if megg context exists
if [ ! -d ".megg" ]; then
  # No .megg in current dir, try to find one up the tree
  current="$(pwd)"
  found=""

  while [ "$current" != "/" ]; do
    if [ -d "$current/.megg" ]; then
      found="$current"
      break
    fi
    current="$(dirname "$current")"
  done

  if [ -z "$found" ]; then
    # No megg anywhere, output empty
    echo '{}'
    exit 0
  fi
fi

# Run megg context and output JSON
npx megg context --json 2>/dev/null || echo '{}'
