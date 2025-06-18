from typing import Literal, Union, Optional, List, Annotated
from pydantic import BaseModel, Field, HttpUrl

# --- Content Block Models ---

class TextBlock(BaseModel):
    type: Literal["text"] = "text"
    content: str

class CodeBlock(BaseModel):
    type: Literal["code"] = "code"
    language: str
    code: str
    caption: Optional[str] = None

class ImageBlock(BaseModel):
    type: Literal["image"] = "image"
    image_path: Optional[str] = None
    alt_text: Optional[str] = None
    caption: Optional[str] = None

ContentBlockItem = Annotated[
    Union[TextBlock, CodeBlock, ImageBlock],
    Field(discriminator="type")
]

# --- User Input and LLM Selection Models ---

class UserInput(BaseModel):
    blocks: List[ContentBlockItem]

class LLMSelection(BaseModel):
    provider: str # E.g., "OpenAI", "Anthropic", "GoogleCloud"
    model_name: str # E.g., "gpt-4o-mini", "claude-3-haiku-20240307"

# --- Request and Response Models for the API ---

class GenerationRequest(BaseModel):
    user_input: UserInput
    llm_selection: LLMSelection
    output_preferences: Optional[dict] = None

class GeneratedContent(BaseModel):
    title: str
    article_markdown: str
    preview_html: str
    suggestions: Optional[List[str]] = None

# --- Models for /api/v1/llms endpoint ---

class ModelCapability(BaseModel):
    supports_images: bool = False
    supports_video: bool = False # For future consideration
    max_input_tokens: Optional[int] = None
    max_output_tokens: Optional[int] = None
    notes: Optional[str] = None

class LLMModelInfo(BaseModel):
    model_id: str # Internal ID, e.g., "gemini-1.5-flash-latest"
    display_name: str # User-friendly name, e.g., "Gemini 1.5 Flash"
    capabilities: ModelCapability
    description: Optional[str] = None
    provider_id: str # To help frontend group or identify, e.g., "google"

class LLMProviderInfo(BaseModel):
    provider_id: str # e.g., "google", "anthropic"
    display_name: str # e.g., "Google AI", "Anthropic"
    models: List[LLMModelInfo]

class AvailableLLMsResponse(BaseModel):
    providers: List[LLMProviderInfo]
