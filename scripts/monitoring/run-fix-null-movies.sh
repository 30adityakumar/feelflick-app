#!/bin/bash
# Load environment variables from .env file
set -a
source .env 2>/dev/null || source ../.env 2>/dev/null
set +a

# Run the fix script
node scripts/monitoring/fix-null-movies.js
