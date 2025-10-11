#!/bin/bash

# Build script for production deployment
# Usage: ./scripts/build.sh

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Building project for production...${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not found. Installing...${NC}\n"
    
    # Check if npm or bun is available
    if command -v bun &> /dev/null; then
        bun install
    elif command -v npm &> /dev/null; then
        npm install
    else
        echo -e "${RED}❌ No package manager found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Dependencies installed${NC}\n"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating default configuration...${NC}"
    cat > .env << 'EOF'
# Supabase Configuration (Lovable Cloud)
VITE_SUPABASE_URL=https://rwmbfwjsdwchqiqnqcjo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bWJmd2pzZHdjaHFpcW5xY2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzAzOTksImV4cCI6MjA3NDc0NjM5OX0.vYAPveA9NtvlwecrKRNUAsYPzyA4ywkYEIs2xeC57dE
VITE_SUPABASE_PROJECT_ID=rwmbfwjsdwchqiqnqcjo
EOF
    echo -e "${GREEN}✓ .env file created${NC}\n"
fi

# Run the build
echo -e "${YELLOW}📦 Building application...${NC}\n"

if command -v bun &> /dev/null; then
    bun run build
elif command -v npm &> /dev/null; then
    npm run build
fi

# Check if build was successful
if [ -d "dist" ]; then
    echo -e "\n${GREEN}✅ Build completed successfully!${NC}"
    echo -e "\n${BLUE}Build output:${NC}"
    ls -lh dist/
    
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo -e "  1. Test the build locally:"
    echo -e "     ${GREEN}npm run preview${NC} or ${GREEN}bun run preview${NC}"
    echo -e "  2. Deploy to production:"
    echo -e "     ${GREEN}./scripts/deploy.sh [vercel|netlify|docker]${NC}"
    echo -e "  3. Or manually upload the ${GREEN}dist/${NC} directory to your hosting provider\n"
else
    echo -e "\n${RED}❌ Build failed. Check the errors above.${NC}"
    exit 1
fi
