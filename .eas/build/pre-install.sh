#!/usr/bin/env bash

set -euo pipefail

# Check if GOOGLE_SERVICES_JSON secret exists
if [ -n "${GOOGLE_SERVICES_JSON:-}" ]; then
  echo "📄 Injecting google-services.json from EAS secret..."
  echo "$GOOGLE_SERVICES_JSON" > "$EAS_BUILD_WORKINGDIR/google-services.json"
  echo "✅ google-services.json created successfully"
else
  echo "⚠️  Warning: GOOGLE_SERVICES_JSON secret not found"
  exit 1
fi
