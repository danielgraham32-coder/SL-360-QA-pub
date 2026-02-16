#!/bin/bash
# ===========================================
# SL-360 QA - Start the Application
# ===========================================
# Run this with:  bash start.sh
# Press Ctrl+C to stop the server.
# ===========================================

echo ""
echo "======================================="
echo "  SL-360 QA is starting..."
echo "======================================="
echo ""
echo "  Open your browser and go to:"
echo ""
echo "    http://localhost:3001"
echo ""
echo "  Press Ctrl+C to stop the server."
echo "======================================="
echo ""

node src/server.js
