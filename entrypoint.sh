#!/bin/bash
set -euo pipefail

# Start the Python agent in background
python /app/agent.py &

# Launch nginx to serve the UI
exec nginx -g "daemon off;"
