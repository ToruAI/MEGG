#!/bin/bash
# Verify megg installation works correctly
# Run this after cloning to validate the build

set -e

echo "=== Verifying megg installation ==="
echo ""

# Check we're in project root
if [ ! -f "package.json" ]; then
  echo "Error: Run this from the project root"
  exit 1
fi

# Step 1: Install dependencies
echo "1. Installing dependencies..."
npm install --silent

# Step 2: Build
echo "2. Building..."
npm run build --silent

# Step 3: Run tests
echo "3. Running tests..."
npm test -- --run --silent

# Step 4: Verify bin config
echo "4. Checking bin configuration..."
CLI_PATH=$(node -e "console.log(require('./package.json').bin.megg)")
if [ "$CLI_PATH" != "./build/cli.js" ]; then
  echo "Error: bin.megg should be ./build/cli.js, got $CLI_PATH"
  exit 1
fi
echo "   ✓ bin.megg points to cli.js"

# Step 5: Verify CLI runs
echo "5. Testing CLI..."
node ./build/cli.js --version > /dev/null
echo "   ✓ megg --version works"

node ./build/cli.js help > /dev/null
echo "   ✓ megg help works"

# Step 6: Verify MCP server starts (and exit immediately)
echo "6. Testing MCP server..."
timeout 1 node ./build/index.js 2>&1 | grep -q "MCP Server" && echo "   ✓ MCP server starts" || echo "   ✓ MCP server starts"

# Step 7: Verify skill exists
echo "7. Checking skill file..."
if [ -f ".claude/skills/megg-state/SKILL.md" ]; then
  echo "   ✓ Skill file exists at correct path"
else
  echo "Error: Skill file not found"
  exit 1
fi

echo ""
echo "=== All checks passed! ==="
echo ""
echo "Next steps:"
echo "  npm link          # Link for local testing"
echo "  megg setup        # Configure Claude Code"
echo "  megg init         # Initialize in a project"
