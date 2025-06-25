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

class OutputPreferences(BaseModel):
    desired_length: Optional[str] = "medium"
    language: Optional[str] = "en"  # Language code (e.g., 'en', 'zh', 'es')
    style: Optional[str] = "professional"  # Writing style
    min_word_count: Optional[int] = None  # Minimum word count
    max_word_count: Optional[int] = None  # Maximum word count
    fusion_degree: Optional[str] = "medium"  # Content fusion degree: low, medium, high
    enable_svg_output: Optional[bool] = False  # Enable SVG-based HTML output with illustrations

class GenerationRequest(BaseModel):
    user_input: UserInput
    llm_selection: LLMSelection
    output_preferences: Optional[OutputPreferences] = None

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

# --- Obsidian Vault Models ---

class ObsidianFile(BaseModel):
    path: str
    name: str
    content: str
    size: int
    modified_time: str
    is_directory: bool = False

class ObsidianVaultRequest(BaseModel):
    vault_path: str

class ObsidianVaultResponse(BaseModel):
    files: List[ObsidianFile]
    vault_name: str

class ObsidianSaveRequest(BaseModel):
    vault_path: str
    folder_name: str
    file_name: str
    content: str

# --- Content Analysis Models ---

class KeywordTag(BaseModel):
    keyword: str
    importance: float = Field(..., ge=0.0, le=1.0)  # 重要性评分 0-1
    category: Optional[str] = None  # 关键词分类

class MindMapNode(BaseModel):
    id: str
    text: str
    level: int = Field(..., ge=1)  # 节点层级，1为根节点
    parent_id: Optional[str] = None
    children: List[str] = []  # 子节点ID列表
    position: Optional[dict] = None  # 节点位置信息

class ContentReference(BaseModel):
    source_block_index: int
    source_text: str
    reference_type: Literal["quote", "paraphrase", "summary"] = "quote"
    start_position: Optional[int] = None
    end_position: Optional[int] = None

class ContentSummary(BaseModel):
    title: str
    summary: str
    key_points: List[str]
    references: List[ContentReference]

class ContentAnalysisRequest(BaseModel):
    user_input: UserInput
    analysis_types: List[Literal["keywords", "mindmap", "summary"]] = ["keywords", "mindmap", "summary"]
    language: Optional[str] = "zh"  # 分析语言

class ContentAnalysisResponse(BaseModel):
    keywords: Optional[List[KeywordTag]] = None
    mindmap: Optional[List[MindMapNode]] = None
    summary: Optional[ContentSummary] = None
    analysis_language: str = "zh"
