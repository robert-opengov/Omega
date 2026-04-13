#!/bin/bash
# List all deploy/rollback events from S3 deploy log.

source "$(dirname "$0")/../lib/_common.sh"

ensure_aws_auth

print_header "Audit History: Deploy & Rollback Events"

EVENTS=$(aws s3 ls "s3://${S3_BUCKET}/deploy-log/" --recursive 2>/dev/null | sort -r | head -30)

if [ -z "$EVENTS" ]; then
    echo "  No deploy events found."
    exit 0
fi

echo ""
printf "  %-10s %-28s %-20s %s\n" "TYPE" "RELEASE" "WHEN" "BY"
printf "  %-10s %-28s %-20s %s\n" "----" "-------" "----" "--"

echo "$EVENTS" | while IFS= read -r line; do
    FILE_KEY=$(echo "$line" | awk '{print $4}')
    if [ -z "$FILE_KEY" ]; then continue; fi

    EVENT_JSON=$(aws s3 cp "s3://${S3_BUCKET}/${FILE_KEY}" - 2>/dev/null)
    if [ -z "$EVENT_JSON" ]; then continue; fi

    echo "$EVENT_JSON" | python3 -c "
import sys, json
try:
    e = json.load(sys.stdin)
    event_type = e.get('event', 'unknown').upper()
    release = e.get('release_tag', e.get('to_release', ''))
    when = e.get('deployed_at', e.get('rolled_back_at', ''))[:19]
    by = e.get('deployed_by', e.get('rolled_back_by', '')).split('/')[-1]
    print(f'  {event_type:<10} {release:<28} {when:<20} {by}')
except:
    pass
" 2>/dev/null
done

echo ""
