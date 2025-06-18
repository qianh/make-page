# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an "AI Content Weaver" application. It's a full-stack web app with a React frontend and a Python FastAPI backend. The application allows users to input various content blocks (text, code, images via URL), select a Large Language Model (LLM), and generate a cohesive, well-structured article from the inputs.

## Architecture

The project is a monorepo containing two main parts:

-   `frontend/`: A React single-page application built with Vite. It's responsible for the user interface, state management, and communicating with the backend. It uses Tailwind CSS for styling.
-   `backend/`: A Python API built with FastAPI. It handles business logic, interacts with external LLM APIs, and processes user content.

### Backend Key Concepts

-   **LLM Provider Abstraction**: The `backend/llm_providers/` directory is designed for extensibility. `base_llm.py` defines a `BaseLLMProvider` abstract class. New LLM providers (like for Anthropic or OpenAI) should inherit from this class and implement its methods. The factory in `main.py` (`get_llm_provider`) dynamically loads the correct provider based on user selection.
-   **Data Schemas**: `backend/schemas.py` contains all Pydantic models used for API request/response validation and typing. This is the source of truth for data structures passed between the frontend and backend.
-   **API Endpoints**: The core endpoints are defined in `main.py`:
    -   `GET /api/v1/llms`: Fetches the hardcoded list of available LLMs and their capabilities.
    -   `POST /api/v1/generate`: Takes user input blocks and an LLM selection, and returns a generated article.

### Frontend Key Concepts

-   **Vite Proxy**: `frontend/vite.config.js` is configured to proxy all requests from `/api` to the backend server running at `http://localhost:8000`. This is crucial for local development to avoid CORS issues. All frontend API calls should be made to relative paths like `/api/v1/generate`.
-   **Component Structure**:
    -   `App.jsx` is the main component, managing the overall application state (content blocks, selected LLM, generated article).
    -   `components/LLMSelector.jsx` fetches and displays available LLMs from the `/api/v1/llms` endpoint.
    -   `components/ContentBlockInput.jsx` is a dynamic component for adding/editing text, code, or image blocks.

## Development

### Setup

Before running the services, you must have a Google API key with the Generative Language API (Gemini) enabled. This key must be set as an environment variable:

```bash
export GOOGLE_API_KEY="your_actual_api_key"
```

### Common Commands

The repository includes scripts to manage starting and stopping both services simultaneously.

-   **Start both services**:
    ```bash
    ./start_services.sh
    ```
-   **Stop both services**:
    ```bash
    ./stop_services.sh
    ```

#### Backend

The backend uses `uv` for environment and package management.

-   **Run the backend server (from `backend/` directory)**:
    ```bash
    # Set up virtual env and install dependencies (if not done)
    uv venv
    uv pip install -r requirements.txt # Assuming a requirements.txt exists or is created

    # Run the server
    uv run uvicorn main:app --reload --port 8000
    ```

#### Frontend

The frontend uses `npm` for package management.

-   **Run the frontend dev server (from `frontend/` directory)**:
    ```bash
    # Install dependencies (if not done)
    npm install

    # Run the server
    npm run dev
    ```

-   **Lint frontend code**:
    ```bash
    npm run lint
    ```

-   **Build for production**:
    ```bash
    npm run build
    ```
