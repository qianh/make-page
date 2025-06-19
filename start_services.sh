#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT="$SCRIPT_DIR"

BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

BACKEND_LOG="$PROJECT_ROOT/backend_run.log"
FRONTEND_LOG="$PROJECT_ROOT/frontend_run.log"
BACKEND_PID_FILE="$PROJECT_ROOT/backend_pid.txt"
FRONTEND_PID_FILE="$PROJECT_ROOT/frontend_pid.txt"

echo "Attempting to start backend service..."
echo "Navigating to $BACKEND_DIR"
cd "$BACKEND_DIR" || { echo "Failed to navigate to backend directory"; exit 1; }

# Install backend dependencies
echo "Installing backend dependencies with uv..."
uv venv --allow-existing || { echo "Failed to create virtual environment"; exit 1; }
uv pip install fastapi uvicorn[standard] pydantic python-multipart google-generativeai httpx pillow markdown-it-py || { echo "Failed to install backend dependencies"; exit 1; }

# Assuming GOOGLE_API_KEY is already set globally by the user, as per user instruction.
# If not, it should be exported here or before running the script.
# Example: export GOOGLE_API_KEY="YOUR_ACTUAL_KEY_HERE"

echo "Starting Uvicorn for backend..."
uv run uvicorn main:app --reload --port 8000 > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

if [ -z "$BACKEND_PID" ]; then
  echo "Failed to start backend service. Check $BACKEND_LOG for errors."
  exit 1
fi
echo $BACKEND_PID > "$BACKEND_PID_FILE"
echo "Backend service potentially started with PID $BACKEND_PID. Log: $BACKEND_LOG"

# Wait a moment for the backend to initialize
echo "Waiting a few seconds for backend to initialize..."
sleep 8 # Increased sleep to allow server to fully start or log error

# Check if backend is actually running by looking for listen on port 8000
if ! lsof -i :8000 > /dev/null 2>&1; then
    echo "ERROR: Backend service (PID $BACKEND_PID) does not seem to be listening on port 8000."
    echo "Please check the log: $BACKEND_LOG"
    # Clean up PID file if service failed
    # kill $BACKEND_PID 2>/dev/null
    # rm "$BACKEND_PID_FILE" 2>/dev/null
    # exit 1 # Optionally exit if backend fails
else
    echo "Backend service appears to be running and listening on port 8000."
fi

echo ""
echo "Attempting to start frontend service..."
echo "Navigating to $FRONTEND_DIR"
cd "$FRONTEND_DIR" || { echo "Failed to navigate to frontend directory"; exit 1; }

# Install frontend dependencies
echo "Installing frontend dependencies with npm..."
npm install || { echo "Failed to install frontend dependencies"; exit 1; }

echo "Starting Vite dev server for frontend..."
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

if [ -z "$FRONTEND_PID" ]; then
  echo "Failed to start frontend service. Check $FRONTEND_LOG for errors."
  # Optionally kill backend if frontend fails
  # kill $BACKEND_PID 2>/dev/null
  # rm "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE" 2>/dev/null
  exit 1
fi
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
echo "Frontend service potentially started with PID $FRONTEND_PID. Log: $FRONTEND_LOG"

echo "Waiting a few seconds for frontend to initialize..."
sleep 8 # Increased sleep for Vite to start

# Check if frontend is actually running by looking for listen on port 5173 (default Vite port)
# Note: Vite might pick another port if 5173 is busy. This check is basic.
if ! lsof -i :5173 > /dev/null 2>&1; then
    echo "WARNING: Frontend service (PID $FRONTEND_PID) does not seem to be listening on port 5173."
    echo "It might be on another port or failed to start. Please check the log: $FRONTEND_LOG"
else
    echo "Frontend service appears to be running and listening on port 5173."
fi

echo ""
echo "Services startup initiated."
echo "Backend is expected on http://localhost:8000"
echo "Frontend is expected on http://localhost:5173 (or as indicated in $FRONTEND_LOG if 5173 was busy)"
echo ""
echo "To check status or view logs:"
echo "Backend Log: tail -f $BACKEND_LOG"
echo "Frontend Log: tail -f $FRONTEND_LOG"
echo ""
echo "To stop the services, run:"
echo "if [ -f \"$BACKEND_PID_FILE\" ]; then kill \$(cat \"$BACKEND_PID_FILE\"); rm \"$BACKEND_PID_FILE\"; fi"
echo "if [ -f \"$FRONTEND_PID_FILE\" ]; then kill \$(cat \"$FRONTEND_PID_FILE\"); rm \"$FRONTEND_PID_FILE\"; fi"
echo "(This attempts to kill processes by PID and remove PID files)"
