#!/usr/bin/env bash
set -e

# Tracebug verification pipeline
# Runs typecheck, unit tests, and E2E tests in sequence

echo "🔍 Starting Tracebug verification pipeline..."
echo ""

# Track overall status
FAILED=false
FAILED_STEPS=()

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run a step and track failures
run_step() {
    local name="$1"
    local command="$2"

    echo -e "${BLUE}▶ $name${NC}"
    if eval "$command"; then
        echo -e "${GREEN}✓ $name passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ $name failed${NC}"
        echo ""
        FAILED=true
        FAILED_STEPS+=("$name")
        return 1
    fi
}

# Step 1: Type check all packages
run_step "Type check all packages" "pnpm run --filter '@tracebug/*' type-check && pnpm run --filter web type-check"

# Step 2: Run unit tests
run_step "Run unit tests" "pnpm test"

# Step 3: Run E2E tests (if e2e directory exists)
if [ -d "e2e" ] && [ -n "$(ls -A e2e 2>/dev/null)" ]; then
    run_step "Run E2E tests" "pnpm --filter e2e test || (cd e2e && pnpm test || npm test)"
else
    echo -e "${YELLOW}⚠ No E2E tests found (e2e/ directory missing or empty)${NC}"
    echo ""
fi

# Final report
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FAILED" = false ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Summary:"
    echo "  • Type check: ✓"
    echo "  • Unit tests: ✓"
    if [ -d "e2e" ] && [ -n "$(ls -A e2e 2>/dev/null)" ]; then
        echo "  • E2E tests: ✓"
    fi
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Failed steps:"
    for step in "${FAILED_STEPS[@]}"; do
        echo -e "  ${RED}• $step${NC}"
    done
    exit 1
fi
