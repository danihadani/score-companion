#!/bin/sh
# ============================================================
# Integration test (slide 9b): sends real HTTP requests to a
# running server and checks the answers.
#
#   docker compose up --build -d
#   ./tests/integration.sh
# ============================================================
BASE_URL="${BASE_URL:-http://localhost:3000}"
FAILED=0

# check <description> <path> <expected status> <text the body must contain>
check() {
  BODY=$(curl -s -w '\n%{http_code}' "$BASE_URL$2")
  STATUS=$(echo "$BODY" | tail -n 1)

  if [ "$STATUS" = "$3" ] && echo "$BODY" | grep -q "$4"; then
    echo "PASS  $1"
  else
    echo "FAIL  $1 (got $STATUS: $(echo "$BODY" | head -n 1))"
    FAILED=1
  fi
}

check "the server is up"            /api/health       200 '"status":"ok"'
check "unknown API address is 404"  /api/no-such-page 404 '"error"'
check "the client page is served"   /                 200 'Score Companion'

exit $FAILED
