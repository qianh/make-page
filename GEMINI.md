# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

This is an "AI Content Weaver" application - a sophisticated full-stack web application that allows users to input various content blocks (text, code, images), select Large Language Models (LLMs), and generate cohesive, well-structured articles. The application features comprehensive internationalization, advanced theming, content analysis capabilities, and export functionality.

This project is a web application with a React frontend and a Python backend.

When working on the project, please adhere to the following guidelines:

- **Commit Messages:** Follow the conventional commit format (e.g., `feat: add new feature`, `fix: fix bug`).
- **Testing:** Add unit tests for new features and bug fixes.
- **Code Style:** Follow the existing code style.

## Architecture

The project is a monorepo containing two main parts:

-   `frontend/`: A React SPA built with Vite, featuring Ant Design components, comprehensive i18n support (Chinese/English), advanced theming system, and modal-based content management
-   `backend/`: A Python FastAPI service with extensible LLM provider architecture, image processing pipeline, and content analysis capabilities

### Backend Key Concepts

-   **LLM Provider Abstraction**: The `backend/llm_providers/` directory is designed for extensibility. `base_llm.py` defines a `BaseLLMProvider` abstract class. New LLM providers (like for Anthropic or OpenAI) should inherit from this class and implement its methods. The factory in `main.py` (`get_llm_provider`) dynamically loads the correct provider based on user selection.
-   **Data Schemas**: `backend/schemas.py` contains all Pydantic models used for API request/response validation and typing. This is the source of truth for data structures passed between the frontend and backend.
-   **API Endpoints**: The core endpoints are defined in `main.py`:
    -   `GET /api/v1/llms`: Fetches the hardcoded list of available LLMs and their capabilities.
    -   `POST /api/v1/generate`: Takes user input blocks and an LLM selection, and returns a generated article.
    -   `POST /api/v1/obsidian/files`: Imports files from Obsidian vaults as content blocks.
    -   `POST /api/v1/upload_image`: Handles image uploads and stores them in the `pic/` directory.

### Frontend Key Concepts

-   **Vite Proxy**: `frontend/vite.config.js` proxies `/api` requests to `http://localhost:8000` for CORS-free development
-   **Internationalization**: `contexts/LanguageContext.jsx` provides comprehensive Chinese/English translations with context-aware text switching
-   **Theming System**: `utils/themes.js` defines multiple visual themes (default, deepSpace, etc.) with CSS variable-based styling
-   **Component Architecture**:
    -   `App.jsx`: Main application state management with tabbed interface (content generation vs analysis)
    -   `components/LLMSelector.jsx`: Dynamic LLM provider and model selection with capability validation
    -   `components/ContentBlockInput.jsx`: Modal-based content block management with UUID tracking
    -   `components/EditableOutput.jsx`: Rich text editing with React-Quill and export capabilities (PDF/image via html2canvas/jsPDF)
    -   `components/ContentAnalysisPanel.jsx`: Content analysis with keywords, mind maps, and summaries
    -   `components/ThemeModal.jsx`: Visual theme selection and customization

## Development

### Setup

Before running the services, you must have a Google API key with the Generative Language API (Gemini) enabled. This key must be set as an environment variable:

```bash
export GOOGLE_API_KEY="your_actual_api_key"
```

### Common Commands

The repository includes automated scripts for service management:

-   **Start both services** (recommended for development):
    ```bash
    ./start_services.sh
    ```
-   **Stop both services**:
    ```bash
    ./stop_services.sh
    ```

#### Backend Commands

The backend uses `uv` for ultra-fast dependency management. From `backend/` directory:

-   **Development server**:
    ```bash
    uv run uvicorn main:app --reload --port 8000
    ```
-   **Install dependencies** (managed via pyproject.toml):
    ```bash
    uv venv --allow-existing
    uv pip sync
    ```
-   **Add new dependencies**:
    ```bash
    uv add package_name
    ```

#### Frontend Commands

From `frontend/` directory:

-   **Development server**:
    ```bash
    npm run dev
    ```
-   **Lint code** (ESLint with React hooks plugin):
    ```bash
    npm run lint
    ```
-   **Build for production**:
    ```bash
    npm run build
    ```
-   **Preview production build**:
    ```bash
    npm run preview
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

### Advanced Content Features

The application supports sophisticated content processing:
- **Multi-language Support**: 10 languages supported (English, Chinese, Spanish, French, German, Japanese, Korean, Portuguese, Russian, Arabic)
- **Writing Styles**: 8 styles available (formal, casual, academic, conversational, professional, creative, technical, journalistic)
- **Content Fusion**: Three levels (low, medium, high) controlling how tightly content blocks are integrated
- **SVG-Enhanced Output**: Generated content can include SVG graphics and advanced HTML styling
- **Word Count Control**: Preset ranges (short, medium, long) and custom word count specifications

### Modal-Based Content Management

The UI uses a modal-based system for managing different content types:
- Each content type (text, code, image) has its own dedicated modal
- Badge counters show the number of blocks for each type
- Content blocks are managed with UUID-based identification for reliable state tracking

## Architecture Patterns

### Service Management
The application uses sophisticated bash scripts (`start_services.sh`/`stop_services.sh`) with:
- Process monitoring and graceful shutdown handling
- Port availability checking before starting services
- PID file management for reliable service control
- Comprehensive error handling and logging

### Image Processing Pipeline
- Async HTTP client for fetching remote images
- PIL-based processing with format normalization and transparency handling
- Local storage in `pic/` directory with timestamp-based organization
- Comprehensive error handling for invalid URLs or unsupported formats

### State Architecture
- Frontend uses React hooks for state management without external libraries
- UUID-based content block identification ensures reliable state tracking
- Modal-based UI architecture for different content types
- Real-time validation and user feedback throughout the UI

## Important Development Patterns

### Ant Design Component Migration
When working with Ant Design components, be aware of API changes:
- Use `variant` prop instead of deprecated `bordered` for Card components
- Use `styles.header` instead of deprecated `headStyle` for Card headers
- Always check component documentation for latest API patterns

### State Management Patterns
- Frontend uses React hooks exclusively (no external state libraries)
- UUID-based content block identification for reliable tracking
- Modal state managed at App level with dedicated boolean flags
- Real-time validation with immediate user feedback

### Internationalization Implementation
- Language switching updates both interface text and content preferences
- Theme variables support CSS custom properties for dynamic styling
- Content analysis and generation respect language selection

### Service Architecture
- Automated service management via bash scripts with PID tracking
- Process monitoring with port availability checking
- Graceful shutdown handling and comprehensive error logging

## Development Notes

- **No Testing Framework**: Currently no formal testing setup
- **Modern Tooling**: Uses `uv` for Python dependency management and Vite for frontend builds
- **Export Capabilities**: PDF/image export via html2canvas and jsPDF libraries
- **Image Processing**: Async HTTP client with PIL-based format normalization