from fastapi import FastAPI, HTTPException, File, UploadFile
import shutil
import os
import time
from pathlib import Path
from schemas import (
    GenerationRequest, GeneratedContent, UserInput, LLMSelection, # For /generate endpoint
    AvailableLLMsResponse, LLMProviderInfo, LLMModelInfo, ModelCapability # For /llms endpoint
)
from typing import List # Ensure List is imported if not already
from typing import List

# LLM Provider imports
from llm_providers.base_llm import BaseLLMProvider
from llm_providers.google_gemini_llm import GoogleGeminiLLMProvider
# Add other provider imports here as they are implemented, e.g.:
# from llm_providers.anthropic_llm import AnthropicLLMProvider
# from llm_providers.openai_llm import OpenAILLMProvider

app = FastAPI()

# LLM Provider Factory
SUPPORTED_PROVIDERS = {
    "google": GoogleGeminiLLMProvider,
    "gemini": GoogleGeminiLLMProvider, # Alias for google
    # "anthropic": AnthropicLLMProvider,
    # "openai": OpenAILLMProvider,
}

# Hardcoded list of available LLMs for the /api/v1/llms endpoint
HARDCODED_AVAILABLE_LLMS = AvailableLLMsResponse(
    providers=[
        LLMProviderInfo(
            provider_id="google",
            display_name="Google AI",
            models=[
                LLMModelInfo(
                    model_id="gemini-2.5-flash-preview-05-20",
                    display_name="Gemini 2.5 Flash Preview (05-20)",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=2000000, max_output_tokens=8192, notes="Optimized for speed and high-volume tasks."),
                    description="Google\'s latest generation fast and versatile multimodal preview model.",
                    provider_id="google"
                ),
                LLMModelInfo(
                    model_id="gemini-2.5-pro-preview-05-06",
                    display_name="Gemini 2.5 Pro Preview (05-06)",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=2000000, max_output_tokens=8192, notes="Advanced reasoning for complex tasks."),
                    description="Google\'s latest generation capable multimodal preview model.",
                    provider_id="google"
                ),
                LLMModelInfo(
                    model_id="gemini-2.5-pro-preview-06-05",
                    display_name="Gemini 2.5 Pro Preview (06-05)",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=2000000, max_output_tokens=8192, notes="Advanced reasoning for complex tasks, potentially with latest updates."),
                    description="Google\'s latest generation capable multimodal preview model (newer revision).",
                    provider_id="google"
                ),
            ]
        ),
        LLMProviderInfo(
            provider_id="anthropic",
            display_name="Anthropic",
            models=[
                LLMModelInfo(
                    model_id="claude-3-opus-20240229",
                    display_name="Claude 3 Opus",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=200000, max_output_tokens=4096, notes="Top-tier reasoning, good for complex analysis."),
                    description="Anthropic's most powerful model.",
                    provider_id="anthropic"
                ),
                LLMModelInfo(
                    model_id="claude-3-sonnet-20240229",
                    display_name="Claude 3 Sonnet",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=200000, max_output_tokens=4096, notes="Balanced speed and intelligence."),
                    description="A balanced model from Anthropic, good for enterprise workloads.",
                    provider_id="anthropic"
                ),
                LLMModelInfo(
                    model_id="claude-3-haiku-20240307",
                    display_name="Claude 3 Haiku",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=200000, max_output_tokens=4096, notes="Fastest and most compact for near-instant responsiveness."),
                    description="Anthropic's fastest model, ideal for real-time interactions.",
                    provider_id="anthropic"
                ),
            ]
        ),
        LLMProviderInfo(
            provider_id="openai",
            display_name="OpenAI",
            models=[
                LLMModelInfo(
                    model_id="gpt-4o-mini",
                    display_name="GPT-4o mini",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=128000, max_output_tokens=16385, notes="OpenAI's latest, most affordable and intelligent small model."),
                    description="Successor to GPT-3.5 Turbo, highly intelligent small model.",
                    provider_id="openai"
                ),
                LLMModelInfo(
                    model_id="gpt-4o",
                    display_name="GPT-4o",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=128000, max_output_tokens=4096, notes="OpenAI's most advanced multimodal model."),
                    description="OpenAI's flagship model, combining text and vision capabilities.",
                    provider_id="openai"
                ),
                LLMModelInfo(
                    model_id="gpt-3.5-turbo",
                    display_name="GPT-3.5 Turbo",
                    capabilities=ModelCapability(supports_images=False, max_input_tokens=16385, max_output_tokens=4096),
                    description="A fast and capable model for text-based tasks.",
                    provider_id="openai"
                ),
            ]
        )
    ]
)

@app.get("/api/v1/llms", response_model=AvailableLLMsResponse)
async def get_available_llms():
    return HARDCODED_AVAILABLE_LLMS

def get_llm_provider(provider_name: str) -> BaseLLMProvider:
    provider_key = provider_name.lower()
    provider_class = SUPPORTED_PROVIDERS.get(provider_key)
    if not provider_class:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported LLM provider: {provider_name}. Supported: {list(SUPPORTED_PROVIDERS.keys())}"
        )
    return provider_class()

@app.get("/")
async def root():
    return {"message": "Hello Agent App Backend - Now with LLM Integration!"}



@app.post("/api/v1/upload_image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Create a unique directory using a timestamp
        timestamp = str(int(time.time() * 1000))
        # Correctly join the path for the timestamped directory
        upload_dir = Path("backend/pic") / timestamp
        os.makedirs(upload_dir, exist_ok=True)

        # Define the full file path
        file_path = upload_dir / file.filename
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the path relative to the backend directory
        # The frontend will use this to reference the image
        relative_path = os.path.join("pic", timestamp, file.filename)
        return {"file_path": relative_path}

    except Exception as e:
        print(f"Error during file upload: {e}")
        raise HTTPException(status_code=500, detail="Error uploading file.")


@app.post("/api/v1/generate", response_model=GeneratedContent)
async def generate_content_endpoint(request: GenerationRequest):
    print(f"Received request for provider: {request.llm_selection.provider}, model: {request.llm_selection.model_name}")
    
    # Pre-process image blocks to handle local paths
    for block in request.user_input.blocks:
        if block.type == 'image' and block.image_path:
            # Construct the full path to the image on the server
            full_image_path = Path("backend") / block.image_path
            if not full_image_path.is_file():
                raise HTTPException(
                    status_code=404, 
                    detail=f"Image file not found: {block.image_path}"
                )
            # Here you might want to convert the image to a different format
            # or handle it as needed by your LLM provider.
            # For now, we assume the provider can handle a local path.
            # (In a real scenario, you'd likely read the file bytes and encode to base64)
            print(f"Found local image at: {full_image_path}")

    try:
        llm_provider = get_llm_provider(request.llm_selection.provider)
    except HTTPException as e:
        # Forward the HTTPException from the factory
        raise e
    except Exception as e:
        # Catch any other unexpected errors during provider instantiation
        print(f"Error getting LLM provider: {e}")
        raise HTTPException(status_code=500, detail="Error initializing LLM provider.")

    try:
        generated_data = await llm_provider.generate_content_from_blocks(
            user_input=request.user_input,
            llm_selection=request.llm_selection,
            output_preferences=request.output_preferences
        )
        return generated_data
    except NotImplementedError: # If a provider method is not yet implemented
        raise HTTPException(status_code=501, detail="LLM provider method not implemented.")
    except Exception as e:
        # Catch errors during the LLM generation process
        print(f"Error during content generation with {request.llm_selection.provider}: {e}")
        # Consider more specific error handling/logging here
        raise HTTPException(status_code=500, detail=f"Error generating content with {request.llm_selection.provider}.")


# To run the app (from the 'backend' directory):
# Ensure you are in the uv virtual environment.
# E.g., by navigating to backend/ and running: source .venv/bin/activate (or just use uv run)
# Then: uv run uvicorn main:app --reload --port 8000
