#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT="$SCRIPT_DIR"

BACKEND_PID_FILE="$PROJECT_ROOT/backend_pid.txt"
FRONTEND_PID_FILE="$PROJECT_ROOT/frontend_pid.txt"

echo "Attempting to stop services..."

# Stop Backend Service
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if [ -n "$BACKEND_PID" ]; then
        echo "Found backend PID $BACKEND_PID. Attempting to stop..."
        if kill "$BACKEND_PID" > /dev/null 2>&1; then
            echo "Backend service (PID $BACKEND_PID) stopped successfully."
        else
            echo "Failed to stop backend service (PID $BACKEND_PID), or it was not running."
        fi
        rm -f "$BACKEND_PID_FILE"
        echo "Removed backend PID file."
    else
        echo "Backend PID file is empty."
        rm -f "$BACKEND_PID_FILE" # Remove if empty
    fi
else
    echo "Backend PID file not found. Assuming backend service is not managed by start_services.sh or already stopped."
fi

echo ""

# Stop Frontend Service
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if [ -n "$FRONTEND_PID" ]; then
        echo "Found frontend PID $FRONTEND_PID. Attempting to stop..."
        if kill "$FRONTEND_PID" > /dev/null 2>&1; then
            echo "Frontend service (PID $FRONTEND_PID) stopped successfully."
        else
            echo "Failed to stop frontend service (PID $FRONTEND_PID), or it was not running."
        fi
        rm -f "$FRONTEND_PID_FILE"
        echo "Removed frontend PID file."
    else
        echo "Frontend PID file is empty."
        rm -f "$FRONTEND_PID_FILE" # Remove if empty
    fi
else
    echo "Frontend PID file not found. Assuming frontend service is not managed by start_services.sh or already stopped."
fi

echo ""
echo "Service stopping process complete."
echo "If you also want to remove log files, you can manually run:"
echo "rm -f $PROJECT_ROOT/backend_run.log $PROJECT_ROOT/frontend_run.log"
