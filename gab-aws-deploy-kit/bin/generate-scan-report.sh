#!/bin/bash
# Generate an OpenGov-styled HTML scan report from JSON scan outputs.
# Usage: ./generate-scan-report.sh <release-dir> <release-tag> <npm-status> <eslint-status> <trivy-status>

RELEASE_DIR="$1"
RELEASE_TAG="$2"
NPM_STATUS="${3:-SKIPPED}"
ESLINT_STATUS="${4:-SKIPPED}"
TRIVY_STATUS="${5:-SKIPPED}"

to_lower() { echo "$1" | tr '[:upper:]' '[:lower:]'; }
NPM_STATUS_LC=$(to_lower "$NPM_STATUS")
ESLINT_STATUS_LC=$(to_lower "$ESLINT_STATUS")
TRIVY_STATUS_LC=$(to_lower "$TRIVY_STATUS")

OUTPUT_FILE="$RELEASE_DIR/scan-report.html"

REPORT_DATE=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
SHORT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
FULL_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
PREPARER=$(whoami)

# ── Parse npm audit JSON ─────────────────────────────────────────────────────
NPM_ROWS=""
NPM_CRITICAL=0
NPM_HIGH=0
NPM_MODERATE=0
NPM_LOW=0
NPM_TOTAL=0

if [ -f "$RELEASE_DIR/audit-report.json" ]; then
    NPM_PARSE=$(python3 -c "
import json, sys
try:
    data = json.load(open('$RELEASE_DIR/audit-report.json'))
    vulns = data.get('vulnerabilities', {})
    rows = []
    counts = {'critical':0,'high':0,'moderate':0,'low':0}
    for name, v in vulns.items():
        sev = v.get('severity','unknown')
        via_list = v.get('via', [])
        title = ''
        url = ''
        for via in via_list:
            if isinstance(via, dict):
                title = via.get('title','')
                url = via.get('url','')
                break
        if not title:
            title = name
        counts[sev] = counts.get(sev, 0) + 1
        rows.append(f'{name}|{sev}|{title}|{url}')
    print(f\"COUNTS:{counts['critical']}:{counts['high']}:{counts['moderate']}:{counts['low']}\")
    for r in rows:
        print(f'ROW:{r}')
except Exception as e:
    print(f'ERROR:{e}', file=sys.stderr)
" 2>/dev/null || echo "")

    if [ -n "$NPM_PARSE" ]; then
        COUNTS_LINE=$(echo "$NPM_PARSE" | grep "^COUNTS:" | head -1)
        if [ -n "$COUNTS_LINE" ]; then
            NPM_CRITICAL=$(echo "$COUNTS_LINE" | cut -d: -f2)
            NPM_HIGH=$(echo "$COUNTS_LINE" | cut -d: -f3)
            NPM_MODERATE=$(echo "$COUNTS_LINE" | cut -d: -f4)
            NPM_LOW=$(echo "$COUNTS_LINE" | cut -d: -f5)
            NPM_TOTAL=$((NPM_CRITICAL + NPM_HIGH + NPM_MODERATE + NPM_LOW))
        fi

        while IFS= read -r line; do
            PKG=$(echo "$line" | cut -d'|' -f1 | sed 's/^ROW://')
            SEV=$(echo "$line" | cut -d'|' -f2)
            TITLE=$(echo "$line" | cut -d'|' -f3)
            URL=$(echo "$line" | cut -d'|' -f4)

            case "$SEV" in
                critical) BADGE_CLASS="badge-critical" ;;
                high)     BADGE_CLASS="badge-high" ;;
                moderate) BADGE_CLASS="badge-moderate" ;;
                *)        BADGE_CLASS="badge-low" ;;
            esac

            if [ -n "$URL" ]; then
                LINK="<a href=\"${URL}\" target=\"_blank\">${TITLE}</a>"
            else
                LINK="$TITLE"
            fi

            NPM_ROWS="${NPM_ROWS}<tr><td><code>${PKG}</code></td><td><span class=\"badge ${BADGE_CLASS}\">${SEV}</span></td><td>${LINK}</td></tr>"
        done <<< "$(echo "$NPM_PARSE" | grep "^ROW:")"
    fi
fi

# ── Parse Trivy JSON ─────────────────────────────────────────────────────────
TRIVY_ROWS=""
TRIVY_CRITICAL=0
TRIVY_HIGH=0
TRIVY_MODERATE=0
TRIVY_LOW=0
TRIVY_TOTAL=0

if [ -f "$RELEASE_DIR/trivy-report.json" ]; then
    TRIVY_PARSE=$(python3 -c "
import json, sys
try:
    data = json.load(open('$RELEASE_DIR/trivy-report.json'))
    results = data.get('Results', [])
    counts = {'CRITICAL':0,'HIGH':0,'MEDIUM':0,'LOW':0}
    rows = []
    for r in results:
        for v in r.get('Vulnerabilities', []):
            sev = v.get('Severity','UNKNOWN')
            counts[sev] = counts.get(sev, 0) + 1
            vid = v.get('VulnerabilityID','')
            pkg = v.get('PkgName','')
            installed = v.get('InstalledVersion','')
            fixed = v.get('FixedVersion','')
            title = v.get('Title','')[:80]
            url = v.get('PrimaryURL','')
            rows.append(f'{vid}|{pkg}|{sev}|{installed}|{fixed}|{title}|{url}')
    print(f\"COUNTS:{counts.get('CRITICAL',0)}:{counts.get('HIGH',0)}:{counts.get('MEDIUM',0)}:{counts.get('LOW',0)}\")
    for r in rows[:50]:
        print(f'ROW:{r}')
except Exception as e:
    print(f'ERROR:{e}', file=sys.stderr)
" 2>/dev/null || echo "")

    if [ -n "$TRIVY_PARSE" ]; then
        COUNTS_LINE=$(echo "$TRIVY_PARSE" | grep "^COUNTS:" | head -1)
        if [ -n "$COUNTS_LINE" ]; then
            TRIVY_CRITICAL=$(echo "$COUNTS_LINE" | cut -d: -f2)
            TRIVY_HIGH=$(echo "$COUNTS_LINE" | cut -d: -f3)
            TRIVY_MODERATE=$(echo "$COUNTS_LINE" | cut -d: -f4)
            TRIVY_LOW=$(echo "$COUNTS_LINE" | cut -d: -f5)
            TRIVY_TOTAL=$((TRIVY_CRITICAL + TRIVY_HIGH + TRIVY_MODERATE + TRIVY_LOW))
        fi

        while IFS= read -r line; do
            VID=$(echo "$line" | cut -d'|' -f1 | sed 's/^ROW://')
            PKG=$(echo "$line" | cut -d'|' -f2)
            SEV=$(echo "$line" | cut -d'|' -f3)
            INSTALLED=$(echo "$line" | cut -d'|' -f4)
            FIXED=$(echo "$line" | cut -d'|' -f5)
            TITLE=$(echo "$line" | cut -d'|' -f6)
            URL=$(echo "$line" | cut -d'|' -f7)

            case "$SEV" in
                CRITICAL) BADGE_CLASS="badge-critical" ;;
                HIGH)     BADGE_CLASS="badge-high" ;;
                MEDIUM)   BADGE_CLASS="badge-moderate" ;;
                *)        BADGE_CLASS="badge-low" ;;
            esac

            if [ -n "$URL" ]; then
                VID_LINK="<a href=\"${URL}\" target=\"_blank\">${VID}</a>"
            else
                VID_LINK="$VID"
            fi

            TRIVY_ROWS="${TRIVY_ROWS}<tr><td>${VID_LINK}</td><td><code>${PKG}</code></td><td><span class=\"badge ${BADGE_CLASS}\">${SEV}</span></td><td>${INSTALLED}</td><td>${FIXED:-—}</td><td class=\"title-col\">${TITLE}</td></tr>"
        done <<< "$(echo "$TRIVY_PARSE" | grep "^ROW:")"
    fi
fi

# ── Parse ESLint JSON ────────────────────────────────────────────────────────
ESLINT_ERRORS=0
ESLINT_WARNINGS=0

if [ -f "$RELEASE_DIR/eslint-report.json" ]; then
    ESLINT_COUNTS=$(python3 -c "
import json, sys
try:
    data = json.load(open('$RELEASE_DIR/eslint-report.json'))
    errors = sum(f.get('errorCount',0) for f in data)
    warnings = sum(f.get('warningCount',0) for f in data)
    print(f'{errors}:{warnings}')
except:
    print('0:0')
" 2>/dev/null || echo "0:0")
    ESLINT_ERRORS=$(echo "$ESLINT_COUNTS" | cut -d: -f1)
    ESLINT_WARNINGS=$(echo "$ESLINT_COUNTS" | cut -d: -f2)
fi

# ── Determine overall status ─────────────────────────────────────────────────
OVERALL="PASS"
OVERALL_CLASS="status-pass"
OVERALL_ICON="ti ti-circle-check"
if [ "$NPM_STATUS" = "WARN" ] || [ "$TRIVY_STATUS" = "WARN" ]; then
    OVERALL="WARNINGS"
    OVERALL_CLASS="status-warn"
    OVERALL_ICON="ti ti-alert-triangle"
fi
if [ "$NPM_CRITICAL" -gt 0 ] || [ "$TRIVY_CRITICAL" -gt 0 ]; then
    OVERALL="CRITICAL ISSUES"
    OVERALL_CLASS="status-fail"
    OVERALL_ICON="ti ti-alert-octagon"
fi

# ── Generate HTML ────────────────────────────────────────────────────────────
cat > "$OUTPUT_FILE" <<'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
HTMLEOF

echo "  <title>Security Scan Report - ${RELEASE_TAG}</title>" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" <<'HTMLEOF'
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
  <style>
    :root {
      --og-primary: #4b3fff;
      --og-primary-dark: #19009b;
      --og-primary-light: #7c6fff;
      --og-text-primary: rgba(0, 0, 0, 0.87);
      --og-text-secondary: rgba(0, 0, 0, 0.6);
      --og-bg-default: #ffffff;
      --og-bg-subtle: #f8f8f8;
      --og-bg-muted: #f2f2f2;
      --og-border-default: rgba(84, 101, 116, 0.5);
      --og-border-light: #dddede;
      --og-success: #07963f;
      --og-error: #d33423;
      --og-warning: #e69e04;
      --og-info: #a627ff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--og-bg-subtle);
      color: var(--og-text-primary);
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1600px; margin: 0 auto; width: 100%; }
    .report-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--og-border-light);
    }
    .logo { height: 28px; width: auto; }
    .report-type {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: white;
      background: var(--og-primary);
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
    }
    header {
      background: var(--og-bg-default);
      border-radius: 8px;
      padding: 1.5rem 2rem;
      margin-bottom: 2rem;
      border: 1px solid var(--og-border-light);
      box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.12);
    }
    h1 { color: var(--og-text-primary); margin-bottom: 0.75rem; font-weight: 600; font-size: 1.5rem; }
    .meta { color: var(--og-text-secondary); font-size: 0.9rem; }
    .meta code { background: var(--og-bg-muted); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85rem; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .stat {
      background: var(--og-bg-muted);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      border: 1px solid var(--og-border-light);
    }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { color: var(--og-text-secondary); font-size: 0.85rem; font-weight: 500; }
    .stat-critical .stat-value { color: var(--og-error); }
    .stat-high .stat-value { color: #fd7e14; }
    .stat-moderate .stat-value { color: var(--og-warning); }
    .stat-low .stat-value { color: #546574; }
    .stat-pass .stat-value { color: var(--og-success); }
    .stat-skip .stat-value { color: var(--og-text-secondary); }

    .overall-status {
      padding: 1rem 1.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }
    .overall-status i { font-size: 1.5rem; }
    .status-pass { background: rgba(7, 150, 63, 0.1); color: var(--og-success); border: 1px solid rgba(7, 150, 63, 0.3); }
    .status-warn { background: rgba(230, 158, 4, 0.1); color: #b37b00; border: 1px solid rgba(230, 158, 4, 0.3); }
    .status-fail { background: rgba(211, 52, 35, 0.1); color: var(--og-error); border: 1px solid rgba(211, 52, 35, 0.3); }

    .section {
      background: var(--og-bg-default);
      border-radius: 8px;
      margin-bottom: 2rem;
      border: 1px solid var(--og-border-light);
      overflow: hidden;
      box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
    }
    .section-header {
      background: var(--og-bg-muted);
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid var(--og-border-light);
      font-weight: 600;
    }
    .section-header i { font-size: 1.2rem; color: var(--og-primary); }
    .section-body { padding: 1.5rem; }

    .badge {
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
      white-space: nowrap;
    }
    .badge-critical { background: var(--og-error); }
    .badge-high { background: #fd7e14; }
    .badge-moderate { background: var(--og-warning); }
    .badge-low { background: #546574; }
    .badge-pass { background: var(--og-success); }
    .badge-skip { background: var(--og-text-secondary); }

    .section-body { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 600px; }
    th {
      text-align: left;
      padding: 0.75rem;
      background: var(--og-bg-muted);
      border-bottom: 2px solid var(--og-border-light);
      font-weight: 600;
      color: var(--og-text-secondary);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--og-border-light);
      vertical-align: top;
    }
    tr:last-child td { border-bottom: none; }
    td code {
      background: var(--og-bg-muted);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    td a { color: var(--og-primary); text-decoration: none; }
    td a:hover { text-decoration: underline; }
    .title-col { max-width: 300px; }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--og-text-secondary);
    }
    .empty-state i { font-size: 2rem; display: block; margin-bottom: 0.5rem; }

    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--og-border-light);
      color: var(--og-text-secondary);
      font-size: 0.85rem;
    }
    footer strong { color: var(--og-text-primary); }
  </style>
</head>
<body>
  <div class="container">
    <div class="report-header">
      <svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1187.1 227.9">
        <defs><style>.og-logo{fill:#4b3fff}</style></defs>
        <path class="og-logo" d="M1177.7,0h-207.2c-9.5,0-12.8,12.5-4.6,17.3l99,57.1v114.3c0,9.5,12.5,12.8,17.3,4.6l103.6-179.5c3.6-6.2-.9-13.9-8-13.9h0q0,0,0,0Z"/>
        <g><path d="M178.8,74.1h24.2v153.8h-24.2V74.1ZM196.3,100c4.3-8.8,10.4-15.7,18.1-20.6,7.8-5,16.7-7.5,26.8-7.5s19.3,2.5,27.5,7.6c8.3,5,14.8,11.9,19.6,20.7,4.7,8.8,7.1,18.5,7.1,29.2s-2.4,20.4-7.1,29.2c-4.7,8.8-11.3,15.7-19.6,20.7-8.3,5-17.5,7.6-27.5,7.6s-19-2.5-26.8-7.5-13.8-11.8-18.1-20.6c-4.3-8.8-6.5-18.6-6.5-29.4s2.2-20.6,6.5-29.4h0ZM207.5,147.4c3,5.4,7,9.7,12.2,12.7,5.2,3.1,10.9,4.6,17.3,4.6s12.1-1.5,17.2-4.6,9.1-7.3,12.1-12.7,4.4-11.4,4.4-18-1.5-12.6-4.4-18c-3-5.4-7-9.6-12.2-12.7-5.2-3.1-10.9-4.6-17.3-4.6s-12.1,1.5-17.2,4.6-9.1,7.3-12.1,12.7-4.4,11.4-4.4,18,1.5,12.6,4.4,18h0Z"/><path d="M332.4,118.8h75.8l-5.6,7.8c-.4-6.3-2.1-12.1-5-17.3s-6.8-9.3-11.9-12.2c-5-3-10.7-4.4-17.1-4.4s-12.1,1.6-17.3,4.9c-5.2,3.2-9.3,7.7-12.3,13.3s-4.5,11.8-4.5,18.6,1.5,13.1,4.6,18.7c3.1,5.5,7.3,9.9,12.7,13.2,5.4,3.2,11.6,4.9,18.5,4.9s13.1-1.7,18.7-5.1c5.5-3.4,9.8-8,12.9-13.7l20.1,8.9c-4.9,9.4-11.9,16.8-21.1,22.4-9.1,5.5-19.6,8.3-31.2,8.3s-20.9-2.5-29.8-7.6c-8.9-5-16-11.9-21.2-20.7-5.2-8.8-7.8-18.5-7.8-29.2s2.5-20.4,7.6-29.2,11.9-15.7,20.7-20.7c8.8-5,18.6-7.6,29.4-7.6s22.3,3,31.5,8.9,16.1,13.9,20.7,23.9,6.1,21,4.5,32.9h-93.1v-18.8h0l.2-.2h0Z"/><path d="M447.1,74.1h24.2v26.3l-3.9-5c3.7-7.2,9.1-12.9,16-17.2,6.9-4.2,14.8-6.4,23.5-6.4s16.9,2,23.9,6.1c7,4,12.4,9.6,16.2,16.6s5.7,15,5.7,23.8v66.3h-24v-62.4c0-5.3-1.2-10.2-3.7-14.5s-5.9-7.7-10.3-10.2c-4.4-2.4-9.3-3.7-14.8-3.7s-10.4,1.2-14.8,3.7c-4.4,2.5-7.8,5.8-10.3,10.2-2.5,4.3-3.7,9.1-3.7,14.5v62.4h-24.2v-110.6h.2q0,.1,0,0Z"/><path d="M749,100.2c5.2-8.8,12.2-15.7,21.2-20.7s18.9-7.6,29.8-7.6,20.9,2.5,29.8,7.6c8.9,5,16,11.9,21.2,20.7s7.8,18.5,7.8,29.2-2.6,20.4-7.8,29.2c-5.2,8.8-12.2,15.7-21.2,20.7-8.9,5-18.9,7.6-29.8,7.6s-20.9-2.5-29.8-7.6c-8.9-5-16-11.9-21.2-20.7-5.2-8.8-7.8-18.5-7.8-29.2s2.6-20.4,7.8-29.2ZM770.5,147.4c3,5.4,7,9.7,12.2,12.7,5.2,3.1,10.9,4.6,17.3,4.6s12.1-1.5,17.3-4.6,9.3-7.3,12.2-12.7,4.4-11.4,4.4-18-1.5-12.6-4.4-18c-3-5.4-7-9.6-12.2-12.7-5.2-3.1-10.9-4.6-17.3-4.6s-12.1,1.5-17.3,4.6-9.3,7.3-12.2,12.7-4.4,11.4-4.4,18,1.5,12.6,4.4,18h0Z"/><path d="M860,74.1h25.9l42.1,109.9h-17.7l42.1-109.9h24.4l-44.7,110.6h-27.2l-44.9-110.6h0Z"/><path d="M729.5,109.1c0,4-.3,7.8-.9,11.6-5.6,38.1-38.5,67.4-78.2,67.4s-79.1-35.4-79.1-79,35.4-79.1,79.1-79.1,54.8,15.9,68.4,39.5l-22.6,13.1c-9.1-15.8-26.2-26.5-45.8-26.5-29.2,0-52.9,23.7-52.9,52.9s23.7,52.9,52.9,52.9,46.3-17.7,51.6-41.3h-58.4l13.5-23.3h71.5c.6,3.8.9,7.7.9,11.7h0Z"/><path d="M79.1,30C35.4,30,0,65.4,0,109.1s35.4,79,79.1,79,79-35.4,79-79S122.7,30,79.1,30h0ZM79.1,162c-29.2,0-52.9-23.7-52.9-52.9s23.7-52.9,52.9-52.9,52.9,23.7,52.9,52.9-23.7,52.9-52.9,52.9h0Z"/></g>
      </svg>
      <span class="report-type">Security Scan Report</span>
    </div>
HTMLEOF

# ── Header with release info ─────────────────────────────────────────────────
cat >> "$OUTPUT_FILE" <<HTMLEOF
    <header>
      <h1>Release: ${RELEASE_TAG}</h1>
      <div class="meta">
        <p><strong>Date:</strong> ${REPORT_DATE}</p>
        <p><strong>Prepared by:</strong> ${PREPARER}</p>
        <p><strong>Commit:</strong> <code>${FULL_SHA}</code> (${SHORT_SHA})</p>
      </div>
      <div class="summary-grid">
        <div class="stat stat-critical"><div class="stat-value">${NPM_CRITICAL}</div><div class="stat-label">Critical (npm)</div></div>
        <div class="stat stat-high"><div class="stat-value">${NPM_HIGH}</div><div class="stat-label">High (npm)</div></div>
        <div class="stat stat-critical"><div class="stat-value">${TRIVY_CRITICAL}</div><div class="stat-label">Critical (Trivy)</div></div>
        <div class="stat stat-high"><div class="stat-value">${TRIVY_HIGH}</div><div class="stat-label">High (Trivy)</div></div>
        <div class="stat stat-moderate"><div class="stat-value">${ESLINT_ERRORS}</div><div class="stat-label">ESLint Errors</div></div>
      </div>
    </header>

    <div class="overall-status ${OVERALL_CLASS}">
      <i class="${OVERALL_ICON}"></i>
      Overall: ${OVERALL}
    </div>
HTMLEOF

# ── npm audit section ────────────────────────────────────────────────────────
cat >> "$OUTPUT_FILE" <<HTMLEOF
    <div class="section">
      <div class="section-header">
        <i class="ti ti-package"></i>
        npm audit — Dependency Vulnerabilities
        <span class="badge badge-${NPM_STATUS_LC}" style="margin-left:auto">${NPM_STATUS}</span>
      </div>
      <div class="section-body">
HTMLEOF

if [ -n "$NPM_ROWS" ]; then
    cat >> "$OUTPUT_FILE" <<HTMLEOF
        <table>
          <thead><tr><th>Package</th><th>Severity</th><th>Advisory</th></tr></thead>
          <tbody>${NPM_ROWS}</tbody>
        </table>
HTMLEOF
else
    cat >> "$OUTPUT_FILE" <<HTMLEOF
        <div class="empty-state">
          <i class="ti ti-circle-check"></i>
          No vulnerabilities found
        </div>
HTMLEOF
fi

echo "      </div></div>" >> "$OUTPUT_FILE"

# ── Trivy section ────────────────────────────────────────────────────────────
cat >> "$OUTPUT_FILE" <<HTMLEOF
    <div class="section">
      <div class="section-header">
        <i class="ti ti-shield-check"></i>
        Trivy — Container Image Scan
        <span class="badge badge-${TRIVY_STATUS_LC}" style="margin-left:auto">${TRIVY_STATUS}</span>
      </div>
      <div class="section-body">
HTMLEOF

if [ "$TRIVY_STATUS" = "SKIPPED" ]; then
    cat >> "$OUTPUT_FILE" <<HTMLEOF
        <div class="empty-state">
          <i class="ti ti-info-circle"></i>
          Trivy not installed locally. Container scan will run in CodeBuild.
        </div>
HTMLEOF
elif [ -n "$TRIVY_ROWS" ]; then
    cat >> "$OUTPUT_FILE" <<HTMLEOF
        <table>
          <thead><tr><th>CVE</th><th>Package</th><th>Severity</th><th>Installed</th><th>Fixed</th><th>Description</th></tr></thead>
          <tbody>${TRIVY_ROWS}</tbody>
        </table>
HTMLEOF
else
    cat >> "$OUTPUT_FILE" <<HTMLEOF
        <div class="empty-state">
          <i class="ti ti-circle-check"></i>
          No vulnerabilities found in container image
        </div>
HTMLEOF
fi

echo "      </div></div>" >> "$OUTPUT_FILE"

# ── ESLint section ───────────────────────────────────────────────────────────
cat >> "$OUTPUT_FILE" <<HTMLEOF
    <div class="section">
      <div class="section-header">
        <i class="ti ti-code"></i>
        ESLint — Code Quality
        <span class="badge badge-${ESLINT_STATUS_LC}" style="margin-left:auto">${ESLINT_STATUS}</span>
      </div>
      <div class="section-body">
        <div class="summary-grid" style="max-width:400px">
          <div class="stat stat-critical"><div class="stat-value">${ESLINT_ERRORS}</div><div class="stat-label">Errors</div></div>
          <div class="stat stat-moderate"><div class="stat-value">${ESLINT_WARNINGS}</div><div class="stat-label">Warnings</div></div>
        </div>
      </div>
    </div>
HTMLEOF

# ── Footer ───────────────────────────────────────────────────────────────────
cat >> "$OUTPUT_FILE" <<HTMLEOF
    <footer>
      <p>Generated by <strong>GAB 311 CRM Ops</strong> on ${REPORT_DATE}</p>
      <p>This is a local scan report. Trusted results come from AWS CodeBuild.</p>
    </footer>
  </div>
</body>
</html>
HTMLEOF
