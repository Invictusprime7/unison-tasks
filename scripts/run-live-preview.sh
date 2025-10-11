#!/bin/bash

# Script to run Vite live preview natively
# This ensures the development server runs with optimal settings for live preview

set -e

echo "🚀 Starting Vite Live Preview..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Run npm audit fix if requested
if [ "$1" = "--fix-audit" ]; then
    echo "🔒 Running npm audit fix..."
    npm audit fix
    echo ""
fi

# Start the development server
echo "🌐 Starting Vite development server..."
echo "📍 Server will be available at:"
echo "   - http://localhost:8080"
echo "   - http://[::1]:8080"
echo ""
echo "✨ Live preview components are ready!"
echo "   - LiveHTMLPreview: Real-time HTML/CSS/JS preview"
echo "   - LiveCodePreview: Code viewer with live updates"
echo "   - SecureIframePreview: Sandboxed preview environment"
echo ""

npm run dev
