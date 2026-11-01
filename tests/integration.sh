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

# send <description> <method> <path> <JSON body> <expected status> <text the body must contain>
send() {
  BODY=$(curl -s -w '\n%{http_code}' -X "$2" -H "Content-Type: application/json" -d "$4" "$BASE_URL$3")
  STATUS=$(echo "$BODY" | tail -n 1)

  if [ "$STATUS" = "$5" ] && echo "$BODY" | grep -q "$6"; then
    echo "PASS  $1"
  else
    echo "FAIL  $1 (got $STATUS: $(echo "$BODY" | head -n 1))"
    FAILED=1
  fi
}

check "the server is up"            /api/health       200 '"status":"ok"'
check "unknown API address is 404"  /api/no-such-page 404 '"error"'
check "the client page is served"   /                 200 'Score Companion'

send "creates a project" POST /api/projects '{"title": "Integration Test", "fps": 24}' 201 '"title":"Integration Test"'
send "refuses a project without a title" POST /api/projects '{"fps": 24}' 400 'TITLE_REQUIRED'
send "refuses an unknown frame rate" POST /api/projects '{"title": "Movie", "fps": 999}' 400 'INVALID_FPS'
check "lists the new project" /api/projects 200 'Integration Test'
send "an unknown project can't be updated" PUT /api/projects/999999 '{"title": "Old Movie", "fps": 24}' 404 'PROJECT_NOT_FOUND'

exit $FAILED
