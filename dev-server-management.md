# Dev Server Management System

This guide provides a complete dev server management system that can be implemented in any Cursor project to prevent port conflicts and streamline development workflows.

## 🚀 Quick Implementation

### 1. Create the Dev Server Script

Create `scripts/dev-server.sh` in your project:

```bash
#!/bin/bash

# Dev Server Management Script
# This script helps manage development servers and prevents port conflicts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default ports (customize for your project)
FRONTEND_PORT=5173
BACKEND_PORT=3001
API_PORT=3000

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing processes on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || echo -e "${BLUE}No processes found on port $port${NC}"
}

# Function to find next available port
find_available_port() {
    local start_port=$1
    local port=$start_port
    while check_port $port; do
        echo -e "${YELLOW}Port $port is in use, trying next...${NC}"
        ((port++))
    done
    echo $port
}

# Function to start frontend dev server
start_frontend() {
    echo -e "${GREEN}Starting frontend dev server...${NC}"
    
    # Kill any existing frontend processes
    pkill -f "vite\|webpack\|parcel" 2>/dev/null || true
    
    # Find available port
    local port=$(find_available_port $FRONTEND_PORT)
    
    echo -e "${GREEN}Starting frontend on port $port${NC}"
    
    # Start the dev server (customize command for your project)
    PORT=$port npm run dev &
    
    # Wait a moment for server to start
    sleep 3
    
    if check_port $port; then
        echo -e "${GREEN}✅ Frontend dev server started on http://localhost:$port${NC}"
    else
        echo -e "${RED}❌ Failed to start frontend dev server${NC}"
        exit 1
    fi
}

# Function to start backend server
start_backend() {
    echo -e "${GREEN}Starting backend server...${NC}"
    
    # Kill any existing backend processes
    pkill -f "node.*server\|express\|fastify" 2>/dev/null || true
    
    # Check if backend port is available
    if check_port $BACKEND_PORT; then
        echo -e "${YELLOW}Port $BACKEND_PORT is in use, killing existing process...${NC}"
        kill_port $BACKEND_PORT
        sleep 2
    fi
    
    echo -e "${GREEN}Starting backend server on port $BACKEND_PORT${NC}"
    
    # Start the backend server (customize command for your project)
    node server/index.js &
    
    # Wait a moment for server to start
    sleep 3
    
    if check_port $BACKEND_PORT; then
        echo -e "${GREEN}✅ Backend server started on http://localhost:$BACKEND_PORT${NC}"
    else
        echo -e "${RED}❌ Failed to start backend server${NC}"
        exit 1
    fi
}

# Function to start both servers
start_all() {
    echo -e "${BLUE}🚀 Starting development environment...${NC}"
    
    # Start backend server first
    start_backend
    
    # Start frontend server
    start_frontend
    
    echo -e "${GREEN}🎉 Development environment ready!${NC}"
    echo -e "${BLUE}Frontend: http://localhost:$(find_available_port $FRONTEND_PORT)${NC}"
    echo -e "${BLUE}Backend: http://localhost:$BACKEND_PORT${NC}"
}

# Function to stop all dev servers
stop_all() {
    echo -e "${YELLOW}🛑 Stopping all development servers...${NC}"
    
    # Kill common dev server processes
    pkill -f "vite\|webpack\|parcel" 2>/dev/null || echo -e "${BLUE}No frontend processes found${NC}"
    pkill -f "node.*server\|express\|fastify" 2>/dev/null || echo -e "${BLUE}No backend processes found${NC}"
    pkill -f "npm run dev" 2>/dev/null || echo -e "${BLUE}No npm dev processes found${NC}"
    
    echo -e "${GREEN}✅ All development servers stopped${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Development Server Status:${NC}"
    
    if check_port $FRONTEND_PORT; then
        echo -e "${GREEN}✅ Frontend server running on port $FRONTEND_PORT${NC}"
    else
        echo -e "${RED}❌ Frontend server not running${NC}"
    fi
    
    if check_port $BACKEND_PORT; then
        echo -e "${GREEN}✅ Backend server running on port $BACKEND_PORT${NC}"
    else
        echo -e "${RED}❌ Backend server not running${NC}"
    fi
    
    echo -e "${BLUE}Active processes:${NC}"
    ps aux | grep -E "(vite|webpack|parcel|node.*server)" | grep -v grep || echo "No active dev processes found"
}

# Function to show help
show_help() {
    echo -e "${BLUE}Dev Server Management Script${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start both frontend and backend servers"
    echo "  frontend  - Start only frontend dev server"
    echo "  backend   - Start only backend server"
    echo "  stop      - Stop all development servers"
    echo "  status    - Show status of all servers"
    echo "  clean     - Kill processes on common dev ports"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start     # Start both servers"
    echo "  $0 stop      # Stop all servers"
    echo "  $0 status    # Check server status"
}

# Function to clean up ports
clean_ports() {
    echo -e "${YELLOW}🧹 Cleaning up common dev ports...${NC}"
    
    # Kill processes on common dev ports
    for port in 5173 5174 5175 5176 5177 3000 3001 8080 4000 5000; do
        if check_port $port; then
            echo -e "${YELLOW}Killing process on port $port...${NC}"
            kill_port $port
        fi
    done
    
    echo -e "${GREEN}✅ Port cleanup complete${NC}"
}

# Main script logic
case "${1:-help}" in
    "start")
        start_all
        ;;
    "frontend")
        start_frontend
        ;;
    "backend")
        start_backend
        ;;
    "stop")
        stop_all
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_ports
        ;;
    "help"|*)
        show_help
        ;;
esac
```

### 2. Make the Script Executable

```bash
chmod +x scripts/dev-server.sh
```

### 3. Add npm Scripts to package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "dev:start": "./scripts/dev-server.sh start",
    "dev:stop": "./scripts/dev-server.sh stop",
    "dev:status": "./scripts/dev-server.sh status",
    "dev:clean": "./scripts/dev-server.sh clean"
  }
}
```

### 4. Create Documentation

Create `scripts/README.md`:

```markdown
# Development Server Management

This directory contains scripts to help manage development servers and prevent port conflicts.

## Quick Start

### Using npm scripts (recommended)
```bash
# Start both frontend and backend servers
npm run dev:start

# Stop all development servers
npm run dev:stop

# Check server status
npm run dev:status

# Clean up ports
npm run dev:clean
```

### Using the script directly
```bash
# Start both servers
./scripts/dev-server.sh start

# Stop all servers
./scripts/dev-server.sh stop

# Check status
./scripts/dev-server.sh status

# Clean ports
./scripts/dev-server.sh clean
```

## Available Commands

| Command | Description |
|---------|-------------|
| `start` | Start both frontend and backend servers |
| `frontend` | Start only frontend dev server |
| `backend` | Start only backend server |
| `stop` | Stop all development servers |
| `status` | Show status of all servers |
| `clean` | Kill processes on common dev ports |
| `help` | Show help message |

## Customization

### For Different Project Types

#### React/Vite Project
```bash
# In start_frontend function
PORT=$port npm run dev &
```

#### Next.js Project
```bash
# In start_frontend function
PORT=$port npm run dev &
```

#### Express Backend
```bash
# In start_backend function
node server/index.js &
```

#### Fastify Backend
```bash
# In start_backend function
node server/index.js &
```

#### Python Flask/Django
```bash
# In start_backend function
python app.py &
# or
python manage.py runserver $BACKEND_PORT &
```

### Custom Ports

Modify the port variables at the top of the script:

```bash
# Default ports (customize for your project)
FRONTEND_PORT=5173
BACKEND_PORT=3001
API_PORT=3000
```

### Custom Process Names

Update the process killing commands for your specific dev tools:

```bash
# For Vite
pkill -f "vite"

# For Webpack
pkill -f "webpack"

# For Parcel
pkill -f "parcel"

# For Create React App
pkill -f "react-scripts"
```

## Troubleshooting

### Port conflicts
```bash
# Clean up all common dev ports
npm run dev:clean

# Then start servers
npm run dev:start
```

### Servers not starting
```bash
# Check what's running
npm run dev:status

# Stop everything and restart
npm run dev:stop
npm run dev:start
```

### Manual cleanup
```bash
# Kill all vite processes
pkill -f "vite"

# Kill all node server processes
pkill -f "node.*server"

# Kill npm dev processes
pkill -f "npm run dev"
```

## Benefits

- ✅ **No more port conflicts** - Automatically finds available ports
- ✅ **Clean startup** - Kills existing processes before starting
- ✅ **Easy management** - Simple commands to start/stop/status
- ✅ **Clear feedback** - Colored output shows what's happening
- ✅ **Consistent environment** - Same setup every time
- ✅ **Cross-platform** - Works on macOS, Linux, and Windows (with Git Bash)

## Usage Examples

### Basic Workflow
```bash
# Start development environment
npm run dev:start

# Check status anytime
npm run dev:status

# Stop when done
npm run dev:stop
```

### Advanced Usage
```bash
# Start only frontend
./scripts/dev-server.sh frontend

# Start only backend
./scripts/dev-server.sh backend

# Clean ports and restart
npm run dev:clean && npm run dev:start
```

## Integration with IDEs

### VS Code
Add to `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Environment",
      "type": "shell",
      "command": "npm run dev:start",
      "group": "build"
    },
    {
      "label": "Stop Dev Environment",
      "type": "shell",
      "command": "npm run dev:stop",
      "group": "build"
    }
  ]
}
```

### Cursor
The same VS Code integration works in Cursor.

## Migration Guide

### From Manual Management
1. **Before**: Running `npm run dev` manually
2. **After**: Using `npm run dev:start`

### From Concurrently
1. **Before**: `concurrently "npm run dev" "npm run server"`
2. **After**: `npm run dev:start`

### From PM2
1. **Before**: `pm2 start ecosystem.config.js`
2. **After**: `npm run dev:start` (for development)

## Best Practices

1. **Always use the scripts** instead of manual commands
2. **Check status** before starting new servers
3. **Clean up** when switching between projects
4. **Document customizations** for your specific project
5. **Version control** the script with your project

## Troubleshooting Common Issues

### Script not executable
```bash
chmod +x scripts/dev-server.sh
```

### Port still in use after cleanup
```bash
# Force kill all node processes (be careful!)
pkill -9 node
```

### Script not found
```bash
# Make sure you're in the project root
pwd
ls scripts/dev-server.sh
```

### Different OS compatibility
The script uses standard Unix commands. For Windows, use Git Bash or WSL.

## Advanced Customization

### Multiple Backend Services
```bash
# Add more backend services
start_api() {
    echo -e "${GREEN}Starting API server...${NC}"
    node server/api.js &
}

start_worker() {
    echo -e "${GREEN}Starting worker...${NC}"
    node server/worker.js &
}
```

### Environment-Specific Ports
```bash
# Use environment variables
FRONTEND_PORT=${FRONTEND_PORT:-5173}
BACKEND_PORT=${BACKEND_PORT:-3001}
```

### Health Checks
```bash
# Add health check function
check_health() {
    local url=$1
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null; then
            return 0
        fi
        sleep 1
        ((attempt++))
    done
    return 1
}
```

This system provides a robust foundation for managing development servers in any project, preventing port conflicts and streamlining the development workflow. 