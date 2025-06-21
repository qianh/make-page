# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an "AI Content Weaver" application. It's a full-stack web app with a React frontend and a Python FastAPI backend. The application allows users to input various content blocks (text, code, images via URL), select a Large Language Model (LLM), and generate a cohesive, well-structured article from the inputs.

## Architecture

The project is a monorepo containing two main parts:

-   `frontend/`: A React single-page application built with Vite. It's responsible for the user interface, state management, and communicating with the backend. It uses Ant Design for UI components and Tailwind CSS for styling.
-   `backend/`: A Python API built with FastAPI. It handles business logic, interacts with external LLM APIs, and processes user content.

### Backend Key Concepts

-   **LLM Provider Abstraction**: The `backend/llm_providers/` directory is designed for extensibility. `base_llm.py` defines a `BaseLLMProvider` abstract class. New LLM providers (like for Anthropic or OpenAI) should inherit from this class and implement its methods. The factory in `main.py` (`get_llm_provider`) dynamically loads the correct provider based on user selection.
-   **Data Schemas**: `backend/schemas.py` contains all Pydantic models used for API request/response validation and typing. This is the source of truth for data structures passed between the frontend and backend.
-   **API Endpoints**: The core endpoints are defined in `main.py`:
    -   `GET /api/v1/llms`: Fetches the hardcoded list of available LLMs and their capabilities.
    -   `POST /api/v1/generate`: Takes user input blocks and an LLM selection, and returns a generated article.
    -   `POST /api/v1/obsidian/files`: Imports files from Obsidian vaults as content blocks.
    -   `POST /api/v1/upload_image`: Handles image uploads and stores them in the `pic/` directory.

### Frontend Key Concepts

-   **Vite Proxy**: `frontend/vite.config.js` is configured to proxy all requests from `/api` to the backend server running at `http://localhost:8000`. This is crucial for local development to avoid CORS issues. All frontend API calls should be made to relative paths like `/api/v1/generate`.
-   **Component Structure**:
    -   `App.jsx` is the main component, managing the overall application state (content blocks, selected LLM, generated article).
    -   `components/LLMSelector.jsx` fetches and displays available LLMs from the `/api/v1/llms` endpoint.
    -   `components/ContentBlockInput.jsx` is a dynamic component for adding/editing text, code, or image blocks.
    -   `components/EditableOutput.jsx` provides rich text editing of generated content using React-Quill.
    -   `components/ObsidianImporter.jsx` handles importing markdown files from Obsidian vaults.

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
    uv pip sync

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

## Project-Specific Patterns

### Adding New LLM Providers

1. Create new provider class in `backend/llm_providers/` inheriting from `BaseLLMProvider`
2. Implement required methods: `generate_content()`, `get_model_info()`
3. Add provider to the factory function in `main.py`
4. Update the hardcoded LLM list in `main.py` to include new provider options

### Content Block System

Content blocks use discriminated unions in Pydantic schemas:
- `TextContentBlock`: Plain text content
- `CodeContentBlock`: Code with language specification  
- `ImageContentBlock`: Image URL with optional description

### Multi-language Support

The application supports multiple languages and writing styles. Language/style configurations are defined in the frontend and passed to LLM providers through the generation API.

## Development Notes

- **No Testing Framework**: Currently no formal testing setup. Consider adding Jest/Vitest for frontend and pytest for backend.
- **State Management**: Frontend uses React hooks without external state management libraries.
- **Modern Tooling**: Uses `uv` for Python dependency management and Vite for frontend builds.
- **Obsidian Integration**: Special support for importing Obsidian vault files as content blocks.
