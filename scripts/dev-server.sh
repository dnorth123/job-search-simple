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

# Default ports
FRONTEND_PORT=5173
EMAIL_PORT=3001
BACKEND_PORT=3000

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
    pkill -f "vite\|next-server\|webpack\|parcel\|react-scripts" 2>/dev/null || true
    
    # Additional cleanup for frontend ports
    for port in 5173 5174 5175 5176 5177 3000 3001 3002 3003; do
        if check_port $port; then
            echo -e "${YELLOW}Cleaning up port $port...${NC}"
            kill_port $port
        fi
    done
    
    # Wait for processes to fully terminate
    sleep 2
    
    # Find available port
    local port=$(find_available_port $FRONTEND_PORT)
    
    echo -e "${GREEN}Starting frontend on port $port${NC}"
    
    # Start the dev server (customize command for your project)
    PORT=$port npm run dev &
    
    # Wait a moment for server to start
    sleep 5
    
    if check_port $port; then
        echo -e "${GREEN}✅ Frontend dev server started on http://localhost:$port${NC}"
    else
        echo -e "${RED}❌ Failed to start frontend dev server${NC}"
        exit 1
    fi
}

# Function to start email server
start_email() {
    echo -e "${GREEN}Starting email server...${NC}"
    
    # Kill any existing email server processes
    pkill -f "email-api" 2>/dev/null || true
    
    # Check if email server port is available
    if check_port $EMAIL_PORT; then
        echo -e "${YELLOW}Port $EMAIL_PORT is in use, killing existing process...${NC}"
        kill_port $EMAIL_PORT
        sleep 2
    fi
    
    echo -e "${GREEN}Starting email server on port $EMAIL_PORT${NC}"
    
    # Start the email server
    node server/email-api.js &
    
    # Wait a moment for server to start
    sleep 3
    
    if check_port $EMAIL_PORT; then
        echo -e "${GREEN}✅ Email server started on http://localhost:$EMAIL_PORT${NC}"
    else
        echo -e "${RED}❌ Failed to start email server${NC}"
        exit 1
    fi
}

# Function to start backend server
start_backend() {
    echo -e "${GREEN}Starting backend server...${NC}"
    
    # Kill any existing backend processes
    pkill -f "node.*server\|express\|fastify\|email-api" 2>/dev/null || true
    
    # Check if backend port is available
    if check_port $BACKEND_PORT; then
        echo -e "${YELLOW}Port $BACKEND_PORT is in use, killing existing process...${NC}"
        kill_port $BACKEND_PORT
        sleep 2
    fi
    
    # Additional cleanup for backend ports
    for port in 3000 3001 3002 3003 8080 4000 5000; do
        if check_port $port; then
            echo -e "${YELLOW}Cleaning up backend port $port...${NC}"
            kill_port $port
        fi
    done
    
    # Wait for processes to fully terminate
    sleep 2
    
    echo -e "${GREEN}Starting backend server on port $BACKEND_PORT${NC}"
    
    # Start the backend server (customize command for your project)
    node server/index.js &
    
    # Wait a moment for server to start
    sleep 5
    
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
    
    # Start email server first
    start_email
    
    # Start frontend server
    start_frontend
    
    # Start backend server
    start_backend
    
    echo -e "${GREEN}🎉 Development environment ready!${NC}"
    echo -e "${BLUE}Frontend: http://localhost:$(find_available_port $FRONTEND_PORT)${NC}"
    echo -e "${BLUE}Email API: http://localhost:$EMAIL_PORT${NC}"
    echo -e "${BLUE}Backend: http://localhost:$BACKEND_PORT${NC}"
    echo -e "${BLUE}Health Check: http://localhost:$BACKEND_PORT/api/health${NC}"
}

# Function to stop all dev servers
stop_all() {
    echo -e "${YELLOW}🛑 Stopping all development servers...${NC}"
    
    # Kill common frontend dev server processes
    pkill -f "vite" 2>/dev/null || echo -e "${BLUE}No vite processes found${NC}"
    pkill -f "next-server\|next dev" 2>/dev/null || echo -e "${BLUE}No next-server processes found${NC}"
    pkill -f "webpack" 2>/dev/null || echo -e "${BLUE}No webpack processes found${NC}"
    pkill -f "parcel" 2>/dev/null || echo -e "${BLUE}No parcel processes found${NC}"
    pkill -f "react-scripts" 2>/dev/null || echo -e "${BLUE}No react-scripts processes found${NC}"
    
    # Kill common backend server processes
    pkill -f "email-api" 2>/dev/null || echo -e "${BLUE}No email server processes found${NC}"
    pkill -f "node.*server\|express\|fastify" 2>/dev/null || echo -e "${BLUE}No backend server processes found${NC}"
    
    # Kill npm dev processes
    pkill -f "npm run dev" 2>/dev/null || echo -e "${BLUE}No npm dev processes found${NC}"
    
    # Additional cleanup for common dev ports
    echo -e "${YELLOW}Cleaning up common dev ports...${NC}"
    for port in 3000 3001 3002 3003 5173 5174 5175 5176 5177 8080 4000 5000; do
        if check_port $port; then
            echo -e "${YELLOW}Killing process on port $port...${NC}"
            kill_port $port
        fi
    done
    
    # Wait a moment for processes to fully terminate
    sleep 2
    
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
    
    if check_port $EMAIL_PORT; then
        echo -e "${GREEN}✅ Email server running on port $EMAIL_PORT${NC}"
    else
        echo -e "${RED}❌ Email server not running${NC}"
    fi

    if check_port $BACKEND_PORT; then
        echo -e "${GREEN}✅ Backend server running on port $BACKEND_PORT${NC}"
    else
        echo -e "${RED}❌ Backend server not running${NC}"
    fi
    
    echo -e "${BLUE}Active processes:${NC}"
    ps aux | grep -E "(vite|email-api|node.*server)" | grep -v grep || echo "No active dev processes found"
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
    echo "  email     - Start only email server"
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
    for port in 5173 5174 5175 5176 5177 3000 3001 8080; do
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
    "email")
        start_email
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