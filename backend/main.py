from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.staticfiles import StaticFiles
import shutil
import os
import time
from pathlib import Path
from schemas import (
    GenerationRequest, GeneratedContent, UserInput, LLMSelection, # For /generate endpoint
    AvailableLLMsResponse, LLMProviderInfo, LLMModelInfo, ModelCapability, # For /llms endpoint
    ObsidianVaultRequest, ObsidianVaultResponse, ObsidianFile, ObsidianSaveRequest, # For /obsidian endpoint
    ObsidianDirectoryRequest, ObsidianDirectoryResponse, DirectoryItem, # For directory listing
    ContentAnalysisRequest, ContentAnalysisResponse, KeywordTag, MindMapNode, ContentSummary, ContentReference # For /content-analysis endpoint
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

# Mount static files for uploaded images
app.mount("/pic", StaticFiles(directory="pic"), name="pic")

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


def scan_directories(path: Path) -> List[DirectoryItem]:
    """Recursively scans a directory and returns a tree structure."""
    items = []
    for item in sorted(path.iterdir()):
        if item.is_dir() and not item.name.startswith('.'):
            children = scan_directories(item)
            items.append(DirectoryItem(
                title=item.name,
                key=str(item.relative_to(path.parent)),
                children=children if children else None
            ))
    return items

@app.post("/api/v1/obsidian/directories", response_model=ObsidianDirectoryResponse)
async def get_obsidian_directories(request: ObsidianDirectoryRequest):
    vault_path = Path(request.vault_path)
    if not vault_path.exists() or not vault_path.is_dir():
        raise HTTPException(status_code=404, detail="Obsidian vault path not found or is not a directory.")
    
    # Adjust the key to be relative to the vault path itself
    def scan_and_adjust_keys(path: Path, base_path: Path) -> List[DirectoryItem]:
        items = []
        for item in sorted(path.iterdir()):
            if item.is_dir() and not item.name.startswith('.'):
                relative_path = item.relative_to(base_path)
                children = scan_and_adjust_keys(item, base_path)
                items.append(DirectoryItem(
                    title=item.name,
                    key=str(relative_path),
                    children=children if children else None
                ))
        return items

    directories = scan_and_adjust_keys(vault_path, vault_path)
    return ObsidianDirectoryResponse(directories=directories)


@app.post("/api/v1/obsidian/save")
async def save_to_obsidian(request: ObsidianSaveRequest):
    vault_path = Path(request.vault_path)
    if not vault_path.exists() or not vault_path.is_dir():
        raise HTTPException(status_code=404, detail="Obsidian vault path not found or is not a directory.")

    folder_path = vault_path / request.folder_name
    folder_path.mkdir(parents=True, exist_ok=True)

    file_name = request.file_name if request.file_name.endswith(".md") else f"{request.file_name}.md"
    file_path = folder_path / file_name

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(request.content)
        return {"message": f"Successfully saved to {file_path}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")


@app.post("/api/v1/upload_image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Create a unique directory using a timestamp
        timestamp = str(int(time.time() * 1000))
        # Correctly join the path for the timestamped directory
        upload_dir = Path("pic") / timestamp
        os.makedirs(upload_dir, exist_ok=True)

        # Define the full file path
        file_path = upload_dir / file.filename
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the path relative to the static mount point
        # The frontend will use this to reference the image
        relative_path = os.path.join(timestamp, file.filename)
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


@app.post("/api/v1/content-analysis", response_model=ContentAnalysisResponse)
async def analyze_content_endpoint(request: ContentAnalysisRequest):
    """
    分析用户输入的内容，提取关键词、生成思维导图、总结核心概要
    """
    print(f"Received content analysis request for types: {request.analysis_types}")
    
    # 构建内容字符串用于分析
    content_blocks = []
    for i, block in enumerate(request.user_input.blocks):
        if block.type == 'text':
            content_blocks.append(f"文本块 {i+1}: {block.content}")
        elif block.type == 'code':
            content_blocks.append(f"代码块 {i+1} ({block.language}): {block.code}")
        elif block.type == 'image':
            content_blocks.append(f"图片块 {i+1}: {block.alt_text or block.caption or '图片内容'}")
    
    combined_content = "\n\n".join(content_blocks)
    
    if not combined_content.strip():
        raise HTTPException(status_code=400, detail="No content to analyze")
    
    try:
        # 获取LLM提供者（默认使用Google Gemini）
        llm_provider = get_llm_provider("google")
        
        response_data = ContentAnalysisResponse(analysis_language=request.language)
        
        # 关键词提取
        if "keywords" in request.analysis_types:
            keywords_prompt = f"""
请分析以下内容，提取10-15个最重要的关键词，并按重要性排序。对每个关键词给出0-1的重要性评分（1为最重要），并将其分类（如：核心概念、技术方法、工具平台、设计理念、实现细节等）。

分析内容：
{combined_content}

请严格按照以下JSON格式返回结果，不要添加任何其他文字：
[
  {{"keyword": "关键词1", "importance": 0.9, "category": "核心概念"}},
  {{"keyword": "关键词2", "importance": 0.8, "category": "技术方法"}},
  ...
]
            """
            
            try:
                keywords_result = await llm_provider.generate_simple_text(
                    prompt=keywords_prompt,
                    model_name="gemini-2.5-flash"
                )
                
                # 尝试解析JSON响应
                import json
                import re
                
                # 清理响应，提取JSON部分
                json_match = re.search(r'\[(.*?)\]', keywords_result, re.DOTALL)
                if json_match:
                    json_str = '[' + json_match.group(1) + ']'
                    try:
                        keywords_data = json.loads(json_str)
                        keywords_list = []
                        for item in keywords_data:
                            if isinstance(item, dict) and all(k in item for k in ['keyword', 'importance', 'category']):
                                keywords_list.append(KeywordTag(
                                    keyword=item['keyword'],
                                    importance=min(max(float(item['importance']), 0.0), 1.0),
                                    category=item['category']
                                ))
                        response_data.keywords = keywords_list[:15]  # 限制最多15个关键词
                    except (json.JSONDecodeError, ValueError, KeyError) as e:
                        print(f"Failed to parse keywords JSON: {e}")
                        # 如果解析失败，使用文本分析的备用方案
                        response_data.keywords = await _extract_keywords_fallback(keywords_result, combined_content)
                else:
                    response_data.keywords = await _extract_keywords_fallback(keywords_result, combined_content)
                    
            except Exception as e:
                print(f"Error extracting keywords: {e}")
                response_data.keywords = []
        
        # 思维导图生成
        if "mindmap" in request.analysis_types:
            mindmap_prompt = f"""
请为以下内容创建一个思维导图结构，包含主要概念和子概念的层级关系。要求：
1. 识别一个核心主题作为根节点
2. 创建2-4个主要分支（二级节点）
3. 每个主要分支下可以有1-3个子节点（三级节点）
4. 保持层级关系清晰

分析内容：
{combined_content}

请严格按照以下JSON格式返回思维导图结构，不要添加任何其他文字：
[
  {{"id": "root", "text": "根节点主题", "level": 1, "parent_id": null, "children": ["node1", "node2", "node3"]}},
  {{"id": "node1", "text": "主要概念1", "level": 2, "parent_id": "root", "children": ["node1_1", "node1_2"]}},
  {{"id": "node1_1", "text": "子概念1-1", "level": 3, "parent_id": "node1", "children": []}},
  ...
]
            """
            
            try:
                print(f"Sending mindmap prompt for content: {combined_content[:200]}...")
                mindmap_result = await llm_provider.generate_simple_text(
                    prompt=mindmap_prompt,
                    model_name="gemini-2.5-flash"
                )
                print(f"Received mindmap result length: {len(mindmap_result)}")
                print(f"First 500 chars of mindmap result: {mindmap_result[:500]}...")
                
                # 解析思维导图JSON响应
                import json
                import re
                
                print(f"Raw mindmap result: {mindmap_result}")
                
                # 尝试多种JSON提取方法
                json_str = None
                
                # 方法1: 提取完整的JSON数组 (贪婪匹配)
                json_match = re.search(r'\[.*\]', mindmap_result, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    # 方法2: 查找第一个[到最后一个]之间的内容
                    start_idx = mindmap_result.find('[')
                    end_idx = mindmap_result.rfind(']')
                    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                        json_str = mindmap_result[start_idx:end_idx+1]
                
                if json_str:
                    try:
                        # 清理可能的问题字符
                        json_str = json_str.strip()
                        print(f"Extracted JSON string: {json_str}")
                        
                        mindmap_data = json.loads(json_str)
                        mindmap_nodes = []
                        
                        for item in mindmap_data:
                            if isinstance(item, dict) and all(k in item for k in ['id', 'text', 'level']):
                                mindmap_nodes.append(MindMapNode(
                                    id=item['id'],
                                    text=item['text'],
                                    level=int(item['level']),
                                    parent_id=item.get('parent_id'),
                                    children=item.get('children', [])
                                ))
                        
                        if mindmap_nodes:
                            response_data.mindmap = mindmap_nodes
                            print(f"Successfully parsed {len(mindmap_nodes)} mindmap nodes")
                            for node in mindmap_nodes:
                                print(f"  Node: {node.id} - {node.text} (level {node.level})")
                        else:
                            print("No valid mindmap nodes found, using fallback")
                            response_data.mindmap = await _generate_mindmap_fallback(mindmap_result, combined_content)
                            
                    except (json.JSONDecodeError, ValueError, KeyError) as e:
                        print(f"Failed to parse mindmap JSON: {e}")
                        print(f"JSON string that failed: {json_str}")
                        response_data.mindmap = await _generate_mindmap_fallback(mindmap_result, combined_content)
                else:
                    print("No JSON array found in mindmap result")
                    response_data.mindmap = await _generate_mindmap_fallback(mindmap_result, combined_content)
                    
            except Exception as e:
                print(f"Error generating mindmap: {e}")
                import traceback
                print(f"Mindmap generation traceback: {traceback.format_exc()}")
                response_data.mindmap = await _generate_mindmap_fallback("", combined_content)
        
        # 内容概要
        if "summary" in request.analysis_types:
            summary_prompt = f"""
请为以下内容生成一个详细的概要总结。要求：
1. 提取一个简洁明确的标题（10字以内）
2. 生成核心摘要（150-200字）
3. 列出3-5个最重要的关键要点
4. 为每个要点标注来源内容的引用

分析内容：
{combined_content}

请严格按照以下JSON格式返回，不要添加任何其他文字：
{{
  "title": "内容标题",
  "summary": "核心摘要内容...",
  "key_points": ["要点1", "要点2", "要点3"],
  "references": [
    {{"source_block_index": 0, "source_text": "引用的具体文本", "reference_type": "quote", "start_position": 0, "end_position": 50}}
  ]
}}
            """
            
            try:
                summary_result = await llm_provider.generate_simple_text(
                    prompt=summary_prompt,
                    model_name="gemini-2.5-flash"
                )
                
                # 解析概要JSON响应
                import json
                import re
                
                json_match = re.search(r'\{.*\}', summary_result, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    try:
                        summary_data = json.loads(json_str)
                        
                        # 处理引用数据
                        references = []
                        for ref in summary_data.get('references', []):
                            if isinstance(ref, dict) and 'source_text' in ref:
                                references.append(ContentReference(
                                    source_block_index=ref.get('source_block_index', 0),
                                    source_text=ref['source_text'],
                                    reference_type=ref.get('reference_type', 'quote'),
                                    start_position=ref.get('start_position'),
                                    end_position=ref.get('end_position')
                                ))
                        
                        response_data.summary = ContentSummary(
                            title=summary_data.get('title', '内容概要'),
                            summary=summary_data.get('summary', ''),
                            key_points=summary_data.get('key_points', []),
                            references=references
                        )
                        
                    except (json.JSONDecodeError, ValueError, KeyError) as e:
                        print(f"Failed to parse summary JSON: {e}")
                        response_data.summary = await _generate_summary_fallback(summary_result, combined_content)
                else:
                    response_data.summary = await _generate_summary_fallback(summary_result, combined_content)
                    
            except Exception as e:
                print(f"Error generating summary: {e}")
                response_data.summary = None
        
        return response_data
        
    except Exception as e:
        print(f"Error during content analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing content: {str(e)}")


async def _extract_keywords_fallback(llm_result: str, content: str) -> List[KeywordTag]:
    """
    备用关键词提取方案，当LLM JSON解析失败时使用
    """
    try:
        # 简单的关键词提取逻辑
        words = content.lower().split()
        # 移除常见停用词
        stop_words = {'的', '是', '在', '有', '和', '与', '或', '但', '而', '了', '以', '及', '为', '由', '对', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        
        # 统计词频
        word_freq = {}
        for word in words:
            if len(word) > 2 and word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # 取前10个高频词作为关键词
        top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        
        keywords = []
        for i, (word, freq) in enumerate(top_words):
            importance = max(0.3, 1.0 - (i * 0.1))  # 递减的重要性评分
            category = "核心概念" if i < 3 else "相关术语"
            keywords.append(KeywordTag(keyword=word, importance=importance, category=category))
        
        return keywords
    except Exception:
        return []


async def _generate_mindmap_fallback(llm_result: str, content: str) -> List[MindMapNode]:
    """
    备用思维导图生成方案，当LLM JSON解析失败时使用
    基于内容生成简化的思维导图
    """
    try:
        print(f"Using fallback mindmap generation for content: {content[:100]}...")
        
        # 尝试从内容中提取关键信息生成动态思维导图
        content_lower = content.lower()
        
        # 根据内容类型判断主题
        if '代码' in content or 'code' in content_lower or 'function' in content_lower:
            root_text = "代码分析"
            nodes = [
                MindMapNode(id="root", text=root_text, level=1, children=["structure", "logic", "optimization"]),
                MindMapNode(id="structure", text="代码结构", level=2, parent_id="root", children=["modules"]),
                MindMapNode(id="logic", text="逻辑实现", level=2, parent_id="root", children=["algorithm"]),
                MindMapNode(id="optimization", text="优化建议", level=2, parent_id="root"),
                MindMapNode(id="modules", text="模块分解", level=3, parent_id="structure"),
                MindMapNode(id="algorithm", text="算法分析", level=3, parent_id="logic")
            ]
        elif '数据' in content or 'data' in content_lower or '分析' in content:
            root_text = "数据分析"
            nodes = [
                MindMapNode(id="root", text=root_text, level=1, children=["source", "process", "result"]),
                MindMapNode(id="source", text="数据来源", level=2, parent_id="root", children=["collection"]),
                MindMapNode(id="process", text="处理方法", level=2, parent_id="root", children=["analysis"]),
                MindMapNode(id="result", text="结果输出", level=2, parent_id="root"),
                MindMapNode(id="collection", text="数据收集", level=3, parent_id="source"),
                MindMapNode(id="analysis", text="分析算法", level=3, parent_id="process")
            ]
        elif '项目' in content or 'project' in content_lower or '开发' in content:
            root_text = "项目分析"
            nodes = [
                MindMapNode(id="root", text=root_text, level=1, children=["requirements", "design", "implementation"]),
                MindMapNode(id="requirements", text="需求分析", level=2, parent_id="root", children=["features"]),
                MindMapNode(id="design", text="设计方案", level=2, parent_id="root", children=["architecture"]),
                MindMapNode(id="implementation", text="实现计划", level=2, parent_id="root"),
                MindMapNode(id="features", text="功能特性", level=3, parent_id="requirements"),
                MindMapNode(id="architecture", text="架构设计", level=3, parent_id="design")
            ]
        else:
            # 默认通用结构
            # 尝试从内容中提取第一个有意义的词作为主题
            words = content.split()[:10]  # 取前10个词
            meaningful_words = [w for w in words if len(w) > 2 and w not in ['的', '是', '在', '了', '和']]
            root_text = meaningful_words[0] if meaningful_words else "内容分析"
            
            nodes = [
                MindMapNode(id="root", text=root_text, level=1, children=["overview", "details", "conclusion"]),
                MindMapNode(id="overview", text="概述", level=2, parent_id="root", children=["background"]),
                MindMapNode(id="details", text="详细内容", level=2, parent_id="root", children=["key_points"]),
                MindMapNode(id="conclusion", text="结论", level=2, parent_id="root"),
                MindMapNode(id="background", text="背景信息", level=3, parent_id="overview"),
                MindMapNode(id="key_points", text="关键要点", level=3, parent_id="details")
            ]
        
        print(f"Generated fallback mindmap with root: {root_text}")
        return nodes
        
    except Exception as e:
        print(f"Error in fallback mindmap generation: {e}")
        # 最后的备用方案
        return [
            MindMapNode(id="root", text="内容分析", level=1, children=["concept", "method"]),
            MindMapNode(id="concept", text="核心概念", level=2, parent_id="root"),
            MindMapNode(id="method", text="实现方法", level=2, parent_id="root")
        ]


async def _generate_summary_fallback(llm_result: str, content: str) -> ContentSummary:
    """
    备用概要生成方案，当LLM JSON解析失败时使用
    """
    try:
        # 简化的概要生成
        title = "内容概要"
        summary = content[:200] + "..." if len(content) > 200 else content
        key_points = ["主要内容分析", "核心概念提取", "关键信息整理"]
        references = [
            ContentReference(
                source_block_index=0,
                source_text=content[:100] if content else "内容摘要",
                reference_type="summary"
            )
        ]
        
        return ContentSummary(
            title=title,
            summary=summary,
            key_points=key_points,
            references=references
        )
    except Exception:
        return ContentSummary(
            title="分析错误",
            summary="无法生成内容概要",
            key_points=[],
            references=[]
        )


# To run the app (from the 'backend' directory):
# Ensure you are in the uv virtual environment.
# E.g., by navigating to backend/ and running: source .venv/bin/activate (or just use uv run)
# Then: uv run uvicorn main:app --reload --port 8000
