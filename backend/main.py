from fastapi import FastAPI, HTTPException, File, UploadFile
import shutil
import os
import time
from pathlib import Path
from schemas import (
    GenerationRequest, GeneratedContent, UserInput, LLMSelection, # For /generate endpoint
    AvailableLLMsResponse, LLMProviderInfo, LLMModelInfo, ModelCapability, # For /llms endpoint
    ObsidianVaultRequest, ObsidianVaultResponse, ObsidianFile # For /obsidian endpoint
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
            display_name="谷歌 AI",
            models=[
                LLMModelInfo(
                    model_id="gemini-2.5-flash",
                    display_name="Gemini 2.5 Flash",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=1000000, max_output_tokens=8192, notes="最佳性价比，具备思维能力，比之前版本效率提升20-30%。"),
                    description="谷歌最高效的多模态模型，具备先进的推理和思维能力，支持原生音频、视频理解和工具集成。",
                    provider_id="google"
                ),
                LLMModelInfo(
                    model_id="gemini-2.5-pro",
                    display_name="Gemini 2.5 Pro",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=1000000, max_output_tokens=8192, notes="高级推理模型，具备深度思考模式，在编程、数学和科学基准测试中表现领先。"),
                    description="谷歌最先进的推理模型，具备思维能力，在复杂问题解决、编程、数学和多模态理解方面表现出色。",
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
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=200000, max_output_tokens=4096, notes="顶级推理能力，适合复杂分析任务。"),
                    description="Anthropic 最强大的模型。",
                    provider_id="anthropic"
                ),
                LLMModelInfo(
                    model_id="claude-3-sonnet-20240229",
                    display_name="Claude 3 Sonnet",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=200000, max_output_tokens=4096, notes="平衡速度和智能。"),
                    description="Anthropic 的平衡型模型，适合企业工作负载。",
                    provider_id="anthropic"
                ),
                LLMModelInfo(
                    model_id="claude-3-haiku-20240307",
                    display_name="Claude 3 Haiku",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=200000, max_output_tokens=4096, notes="最快且最紧凑，近乎即时响应。"),
                    description="Anthropic 最快的模型，适合实时交互。",
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
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=128000, max_output_tokens=16385, notes="OpenAI 最新、最经济实惠且智能的小型模型。"),
                    description="GPT-3.5 Turbo 的继任者，高智能小型模型。",
                    provider_id="openai"
                ),
                LLMModelInfo(
                    model_id="gpt-4o",
                    display_name="GPT-4o",
                    capabilities=ModelCapability(supports_images=True, max_input_tokens=128000, max_output_tokens=4096, notes="OpenAI 最先进的多模态模型。"),
                    description="OpenAI 的旗舰模型，结合文本和视觉能力。",
                    provider_id="openai"
                ),
                LLMModelInfo(
                    model_id="gpt-3.5-turbo",
                    display_name="GPT-3.5 Turbo",
                    capabilities=ModelCapability(supports_images=False, max_input_tokens=16385, max_output_tokens=4096),
                    description="快速且能力强的文本任务模型。",
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

@app.post("/api/v1/obsidian/files", response_model=ObsidianVaultResponse)
async def get_obsidian_files(request: ObsidianVaultRequest):
    vault_path = Path(request.vault_path)
    
    if not vault_path.exists():
        raise HTTPException(status_code=404, detail="Vault path not found")
    
    if not vault_path.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")
    
    files = []
    
    def read_markdown_files(directory: Path, prefix: str = ""):
        for item in directory.iterdir():
            if item.name.startswith('.'):
                continue
                
            relative_path = f"{prefix}{item.name}" if prefix else item.name
            
            if item.is_dir():
                files.append(ObsidianFile(
                    path=relative_path,
                    name=item.name,
                    content="",
                    size=0,
                    modified_time=str(item.stat().st_mtime),
                    is_directory=True
                ))
                read_markdown_files(item, f"{relative_path}/")
            elif item.suffix == '.md':
                try:
                    content = item.read_text(encoding='utf-8')
                    files.append(ObsidianFile(
                        path=relative_path,
                        name=item.name,
                        content=content,
                        size=len(content),
                        modified_time=str(item.stat().st_mtime),
                        is_directory=False
                    ))
                except Exception as e:
                    print(f"Error reading file {item}: {e}")
    
    try:
        read_markdown_files(vault_path)
        return ObsidianVaultResponse(
            files=files,
            vault_name=vault_path.name
        )
    except Exception as e:
        print(f"Error reading vault: {e}")
        raise HTTPException(status_code=500, detail="Error reading vault files")



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
