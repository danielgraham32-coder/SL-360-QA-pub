#!/bin/bash
# ===========================================
# SL-360 QA - One-Click Setup Script
# ===========================================
# Run this with:  bash setup.sh
# ===========================================

echo ""
echo "======================================="
echo "  SL-360 QA - eLearning Review Platform"
echo "======================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo ""
    echo "Please install Node.js first:"
    echo "  1. Go to https://nodejs.org"
    echo "  2. Download the LTS version (the green button)"
    echo "  3. Run the installer"
    echo "  4. Restart your terminal"
    echo "  5. Run this script again: bash setup.sh"
    echo ""
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Found Node.js $NODE_VERSION"
echo ""

# Install backend dependencies
echo "Step 1/3: Installing backend..."
npm install
echo ""

# Install frontend dependencies
echo "Step 2/3: Installing frontend..."
cd client && npm install && cd ..
echo ""

# Build the frontend
echo "Step 3/3: Building frontend..."
cd client && npm run build && cd ..
echo ""

echo "======================================="
echo "  Setup complete!"
echo "======================================="
echo ""
echo "  To start the app, run:"
echo ""
echo "    bash start.sh"
echo ""
echo "  Then open your browser to:"
echo ""
echo "    http://localhost:3001"
echo ""
echo "======================================="
