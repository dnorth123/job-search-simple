#!/bin/bash

# Dev Server Management Script
# This script ensures only one dev server is running at a time

echo "🔍 Checking for running dev servers..."

# Kill any existing vite processes
echo "🛑 Stopping existing dev servers..."
pkill -f "vite" 2>/dev/null
pkill -f "node.*dev" 2>/dev/null

# Wait a moment for processes to stop
sleep 2

# Check if any processes are still running
RUNNING_PROCESSES=$(ps aux | grep -E "(vite|node.*dev)" | grep -v grep | wc -l)

if [ $RUNNING_PROCESSES -gt 0 ]; then
    echo "⚠️  Found $RUNNING_PROCESSES dev server(s) still running"
    ps aux | grep -E "(vite|node.*dev)" | grep -v grep
    echo "🛑 Force killing remaining processes..."
    pkill -9 -f "vite" 2>/dev/null
    pkill -9 -f "node.*dev" 2>/dev/null
    sleep 1
else
    echo "✅ No dev servers currently running"
fi

# Check ports
echo "🔍 Checking common dev server ports..."
for port in 5173 5174 5175 5176 5177 5178 5179 5180; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "⚠️  Port $port is in use:"
        lsof -i :$port
    fi
done

echo ""
echo "🚀 Starting fresh dev server..."
npm run dev 