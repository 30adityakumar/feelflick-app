#!/bin/bash
cd "$(dirname "$0")/.."
set -a
source .env
set +a
node scripts/monitoring/check-pipeline-health.js
