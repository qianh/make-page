#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT="$SCRIPT_DIR"

BACKEND_PID_FILE="$PROJECT_ROOT/backend_pid.txt"
FRONTEND_PID_FILE="$PROJECT_ROOT/frontend_pid.txt"

echo "Attempting to stop services..."

# Function to kill processes by PID with escalation
kill_process_by_pid() {
    local pid=$1
    local service_name=$2
    
    if [ -z "$pid" ]; then
        return 1
    fi
    
    # Check if process exists
    if ! kill -0 "$pid" > /dev/null 2>&1; then
        echo "$service_name process (PID $pid) is not running."
        return 0
    fi
    
    echo "Stopping $service_name process (PID $pid)..."
    
    # Try SIGTERM first
    if kill "$pid" > /dev/null 2>&1; then
        # Wait up to 10 seconds for graceful shutdown
        for i in {1..10}; do
            if ! kill -0 "$pid" > /dev/null 2>&1; then
                echo "$service_name process (PID $pid) stopped gracefully."
                return 0
            fi
            sleep 1
        done
        
        # If still running, try SIGKILL
        echo "$service_name process (PID $pid) did not stop gracefully. Forcing termination..."
        if kill -9 "$pid" > /dev/null 2>&1; then
            echo "$service_name process (PID $pid) forcefully terminated."
            return 0
        else
            echo "Failed to forcefully terminate $service_name process (PID $pid)."
            return 1
        fi
    else
        echo "Failed to send SIGTERM to $service_name process (PID $pid)."
        return 1
    fi
}

# Function to kill processes by port
kill_processes_by_port() {
    local port=$1
    local service_name=$2
    
    echo "Checking for processes listening on port $port..."
    
    # Find PIDs listening on the port
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -z "$pids" ]; then
        echo "No processes found listening on port $port."
        return 0
    fi
    
    echo "Found processes listening on port $port: $pids"
    
    # Kill each process
    for pid in $pids; do
        kill_process_by_pid "$pid" "$service_name (port $port)"
    done
}

# Stop Backend Service by PID file
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if [ -n "$BACKEND_PID" ]; then
        kill_process_by_pid "$BACKEND_PID" "Backend"
    else
        echo "Backend PID file is empty."
    fi
    rm -f "$BACKEND_PID_FILE"
    echo "Removed backend PID file."
else
    echo "Backend PID file not found."
fi

# Stop Frontend Service by PID file
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if [ -n "$FRONTEND_PID" ]; then
        kill_process_by_pid "$FRONTEND_PID" "Frontend"
    else
        echo "Frontend PID file is empty."
    fi
    rm -f "$FRONTEND_PID_FILE"
    echo "Removed frontend PID file."
else
    echo "Frontend PID file not found."
fi

echo ""
echo "Ensuring all processes on target ports are stopped..."

# Kill any remaining processes on port 8000 (backend)
kill_processes_by_port 8000 "Backend"

# Kill any remaining processes on port 5173 (frontend)
kill_processes_by_port 5173 "Frontend"

echo ""
echo "Service stopping process complete."

# Final verification
echo "Final verification:"
backend_check=$(lsof -ti:8000 2>/dev/null)
frontend_check=$(lsof -ti:5173 2>/dev/null)

if [ -z "$backend_check" ]; then
    echo "✓ Port 8000 is now free"
else
    echo "⚠ Warning: Port 8000 still has processes: $backend_check"
fi

if [ -z "$frontend_check" ]; then
    echo "✓ Port 5173 is now free"
else
    echo "⚠ Warning: Port 5173 still has processes: $frontend_check"
fi

echo ""
echo "To remove log files, run:"
echo "rm -f $PROJECT_ROOT/backend_run.log $PROJECT_ROOT/frontend_run.log"
