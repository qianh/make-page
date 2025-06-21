# File: agent-app/backend/llm_providers/google_gemini_llm.py
import os
import asyncio # For concurrent image fetching
import httpx # For fetching images
from PIL import Image, UnidentifiedImageError # For image manipulation
import io # For byte streams
from typing import Optional, Dict, List, Union # Union for prompt parts

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold # For safety settings
from markdown_it import MarkdownIt # For Markdown to HTML conversion

from .base_llm import BaseLLMProvider
from schemas import UserInput, LLMSelection, GeneratedContent, OutputPreferences

# Helper to determine if a model (by its ID from our hardcoded list) supports images.
def model_supports_images_lookup(model_id: str) -> bool:
    image_supporting_models = [
        "gemini-2.5-flash", "gemini-2.5-pro"
    ]
    return model_id in image_supporting_models

class GoogleGeminiLLMProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key_configured = False
        self.md_parser = MarkdownIt() # Initialize Markdown parser instance
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("WARNING: GOOGLE_API_KEY environment variable not found. GoogleGeminiLLMProvider will not be functional.")
        else:
            try:
                genai.configure(
                    api_key=api_key
                )
                print("INFO: Google Generative AI SDK configured successfully.")
                self.api_key_configured = True
            except Exception as e:
                print(f"ERROR: Failed to configure Google Generative AI SDK: {e}")

    async def _fetch_image_from_url(self, url: str) -> Optional[Image.Image]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=15.0)
                response.raise_for_status()
                image_bytes = await response.aread()
                image = Image.open(io.BytesIO(image_bytes))
                if image.mode == 'RGBA' or image.mode == 'LA' or (image.mode == 'P' and 'transparency' in image.info):
                    background = Image.new("RGB", image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[-1])
                    image = background
                elif image.mode != 'RGB':
                    image = image.convert("RGB")
                print(f"INFO: Fetched and processed image from {url}. Format: {image.format}, Mode: {image.mode}, Size: {image.size}")
                return image
        except httpx.HTTPStatusError as e:
            print(f"ERROR: HTTP error fetching image from {url}: {e.response.status_code} - {e.request.url}")
        except httpx.RequestError as e:
            print(f"ERROR: Network error fetching image from {url}: {e}")
        except UnidentifiedImageError:
            print(f"ERROR: Content at {url} could not be identified as an image by Pillow.")
        except Exception as e:
            print(f"ERROR: Unexpected error fetching or processing image from {url}: {e}")
        return None

    async def generate_content_from_blocks(
        self,
        user_input: UserInput,
        llm_selection: LLMSelection,
        output_preferences: Optional[OutputPreferences] = None
    ) -> GeneratedContent:
        if not self.api_key_configured:
            error_message = "The Google Gemini LLM provider is not configured because the GOOGLE_API_KEY is missing or invalid."
            return GeneratedContent(
                title="Error: Gemini Provider Not Configured",
                article_markdown=f"# Error\n\n{error_message}",
                preview_html=f"<h1>Error</h1><p>{error_message}</p>",
                suggestions=["Ensure GOOGLE_API_KEY is set in your environment variables", "Restart the backend service after setting the API key", "Check Google Cloud Console for API key permissions"]
            )

        current_model_supports_images = model_supports_images_lookup(llm_selection.model_name)
        print(f"INFO: Model {llm_selection.model_name} selected. Determined image support: {current_model_supports_images}")

        api_call_parts: List[Union[str, Image.Image]] = []
        
        # Get language, style, word count, and fusion preferences
        language = "zh"  # Default to Chinese
        style = "professional"  # Default style
        min_word_count = None
        max_word_count = None
        fusion_degree = "medium"  # Default fusion degree
        enable_svg_output = False  # Default SVG output
        
        if output_preferences:
            # Convert Pydantic model to dict if needed
            prefs_dict = output_preferences.model_dump() if hasattr(output_preferences, 'model_dump') else output_preferences
            language = prefs_dict.get("language", "zh")
            style = prefs_dict.get("style", "professional")
            min_word_count = prefs_dict.get("min_word_count")
            max_word_count = prefs_dict.get("max_word_count")
            fusion_degree = prefs_dict.get("fusion_degree", "medium")
            enable_svg_output = prefs_dict.get("enable_svg_output", False)
        
        # Language-specific instructions
        language_instructions = {
            "en": "Write the entire article in English.",
            "zh": "请用中文写整篇文章。",
            "es": "Escribe todo el artículo en español.",
            "fr": "Rédigez tout l'article en français.",
            "de": "Schreiben Sie den gesamten Artikel auf Deutsch.",
            "ja": "記事全体を日本語で書いてください。",
            "ko": "전체 기사를 한국어로 작성하세요.",
            "pt": "Escreva todo o artigo em português.",
            "ru": "Напишите всю статью на русском языке.",
            "ar": "اكتب المقال بالكامل باللغة العربية."
        }
        
        # Style-specific instructions
        style_instructions = {
            "formal": "Maintain a formal and authoritative tone throughout.",
            "casual": "Use a casual, friendly, and conversational tone.",
            "academic": "Write in an academic style with proper citations and scholarly language.",
            "conversational": "Write as if you're having a conversation with the reader.",
            "professional": "Use a professional, business-appropriate tone.",
            "creative": "Use creative language and engaging storytelling techniques.",
            "technical": "Focus on technical accuracy and detailed explanations.",
            "journalistic": "Write in a journalistic style with facts and balanced reporting."
        }
        
        language_instruction = language_instructions.get(language, language_instructions["zh"])
        style_instruction = style_instructions.get(style, style_instructions["professional"])
        
        # Word count instruction
        word_count_instruction = ""
        if min_word_count and max_word_count:
            word_count_instruction = f"- **Word Count**: The article should be between {min_word_count} and {max_word_count} words.\n"
        elif min_word_count:
            word_count_instruction = f"- **Word Count**: The article should be at least {min_word_count} words.\n"
        elif max_word_count:
            word_count_instruction = f"- **Word Count**: The article should be no more than {max_word_count} words.\n"
        
        # Fusion degree-specific instructions
        fusion_instructions = {
            "low": (
                "- **Content Fusion - LOW**: Maintain the original structure and clear separation of content blocks. "
                "Keep each content block relatively distinct while creating smooth transitions between them. "
                "Preserve the original organization and flow as much as possible."
            ),
            "medium": (
                "- **Content Fusion - MEDIUM**: Moderately integrate the content while maintaining logical clarity. "
                "Blend related content naturally while preserving important structural elements. "
                "Balance readability with coherent narrative flow."
            ),
            "high": (
                "- **Content Fusion - HIGH**: Deeply understand and reconstruct all content into a highly coherent whole. "
                "Break down original content blocks completely and weave them into a seamless, unified narrative. "
                "Prioritize overall coherence and flow over preserving original structure. Think holistically about the content."
            )
        }
        
        fusion_instruction = fusion_instructions.get(fusion_degree, fusion_instructions["medium"])
        
        # SVG output instruction
        svg_instruction = ""
        if enable_svg_output:
            svg_instruction = (
                "- **SVG Enhanced Output**: In addition to the regular markdown content, create relevant SVG illustrations and diagrams. "
                "Integrate SVG code directly into the HTML output where appropriate to enhance visual understanding. "
                "Create custom charts, diagrams, flowcharts, or conceptual illustrations that complement the content. "
                "Use meaningful colors and clear labeling in SVG elements.\n"
            )
        
        system_prompt_text = (
             "You are an expert article writer and content strategist. "
             "Your primary task is to take the following user-provided content blocks (which may include text, code snippets, and actual image data) "
             "and weave them into a coherent, well-structured, and engaging article suitable for publication. "
             "The article should have a clear narrative flow and logical progression.\n\n"
             "Key instructions:\n"
             "- **Title Generation**: Generate a suitable and compelling title for the article. Present this title as the very first H1 header in your response (e.g., '# Article Title'). Do not add any text before the H1 title.\n"
             "- **Output Format**: The entire response, starting with the H1 title, must be in well-formatted Markdown.\n"
             "- **Content Integration**: Seamlessly integrate the provided text, expand on ideas, explain code snippets contextually, and incorporate images by referring to them or describing their relevance. Do not try to re-render images as Markdown image tags unless explicitly asked.\n"
             "- **Structure and Flow**: Ensure the article is well-organized with appropriate headings (H2, H3, etc.), paragraphs, lists, and other Markdown elements to enhance readability.\n"
             f"- **Language**: {language_instruction}\n"
             f"- **Writing Style**: {style_instruction}\n"
             f"{word_count_instruction}"
             f"{fusion_instruction}\n"
             f"{svg_instruction}"
             "The user's content blocks (text, code, and image data if provided) are given below. Process them to build the article:\n"
             "---"
        )
        api_call_parts.append(system_prompt_text)

        if not user_input.blocks:
            api_call_parts.append("\n\n(No specific content blocks were provided by the user. Please generate a general article based on any inferred topic or a generic welcome/placeholder article about AI content generation.)")

        image_blocks_to_fetch = []
        if current_model_supports_images:
            for i, block in enumerate(user_input.blocks):
                if block.type == "image":
                    image_blocks_to_fetch.append({"index": i, "url": str(block.image_path), "block_ref": block})
        
        fetched_image_objects: Dict[int, Optional[Image.Image]] = {}
        if image_blocks_to_fetch:
            print(f"INFO: Attempting to fetch {len(image_blocks_to_fetch)} image(s).")
            tasks = [self._fetch_image_from_url(img_block["url"]) for img_block in image_blocks_to_fetch]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for i, result in enumerate(results):
                original_block_index = image_blocks_to_fetch[i]["index"]
                if isinstance(result, Image.Image):
                    fetched_image_objects[original_block_index] = result
                else:
                    fetched_image_objects[original_block_index] = None
                    if isinstance(result, Exception):
                        print(f"ERROR: Failed to fetch image for block {original_block_index} from {image_blocks_to_fetch[i]['url']}: {result}")
                    else:
                        print(f"WARNING: Fetching image for block {original_block_index} from {image_blocks_to_fetch[i]['url']} returned None.")

        for i, block in enumerate(user_input.blocks):
            api_call_parts.append(f"\n\n--- User Content Block {i+1}: {block.type.upper()} ---")
            if block.type == "text":
                api_call_parts.append(f"Text Content:\n{block.content}")
            elif block.type == "code":
                lang = block.language or "plaintext"
                caption_text = f"\nCode Block Caption: {block.caption}" if block.caption else ""
                api_call_parts.append(f"Code Snippet (language: {lang}):\n```{lang}\n{block.code}\n```{caption_text}")
            elif block.type == "image":
                image_data = fetched_image_objects.get(i) if current_model_supports_images else None
                if image_data:
                    api_call_parts.append(f"Image Content (Caption: {block.caption or 'N/A'}, Alt: {block.alt_text or 'N/A'}):")
                    api_call_parts.append(image_data)
                else:
                    reason = "fetch failed or image is invalid" if current_model_supports_images else "model does not support image input"
                    api_call_parts.append(
                        f"Image Placeholder ({reason}):\n"
                        f"[URL: {block.image_path}, Alt Text: '{block.alt_text or 'N/A'}', Caption: '{block.caption or 'N/A'}]\n"
                        "(Task: Describe this image or integrate its theme/caption naturally into the article based on this textual information.)"
                    )
        
        if output_preferences:
            api_call_parts.append("\n\n--- Output Preferences from User ---")
            # Convert Pydantic model to dict if needed
            prefs_dict = output_preferences.model_dump() if hasattr(output_preferences, 'model_dump') else output_preferences
            for key, value in prefs_dict.items():
                api_call_parts.append(f"- {key.replace('_', ' ').capitalize()}: {value}")
            api_call_parts.append("Please try to adhere to these preferences when crafting the article.")

        api_call_parts.append(
            "\n\n---\nBased on all the above, please generate the complete article now, starting with the H1 title and following all instructions for Markdown formatting and content integration. Be comprehensive and aim for a high-quality, publishable piece."
        )
        
        print(f"INFO: Final prompt for Gemini API contains {len(api_call_parts)} parts.")

        try:
            print(f"INFO: Initializing Gemini model: {llm_selection.model_name}")
            model = genai.GenerativeModel(llm_selection.model_name)
            
            generation_config = genai.types.GenerationConfig(
                temperature=0.7, 
                candidate_count=1 
            )
            
            safety_settings = { 
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }

            print(f"INFO: Sending request to Gemini API model {llm_selection.model_name}...")
            import asyncio
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: model.generate_content(
                    api_call_parts,
                    generation_config=generation_config,
                    safety_settings=safety_settings
                )
            )
            print("INFO: Received response from Gemini API.")

            if not response.candidates or not response.candidates[0].content.parts:
                print("ERROR: Gemini API returned an empty or invalid response structure.")
                # print("DEBUG: Full Gemini Response:", response) # For detailed debugging if needed
                raise ValueError("Gemini API returned an empty or invalid response structure.")

            generated_markdown = ""
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'text'):
                    generated_markdown += part.text
            
            if not generated_markdown.strip():
                print("ERROR: Gemini API response did not contain any usable text content.")
                # print("DEBUG: Full Gemini Response:", response) # For detailed debugging if needed
                raise ValueError("Gemini API response did not contain any usable text content.")

            extracted_title = f"Generated by {llm_selection.model_name}" 
            lines = generated_markdown.splitlines()
            if lines and lines[0].strip().startswith("# "):
                extracted_title = lines[0].strip()[2:].strip()
            
            # Convert Markdown to HTML using markdown-it-py
            actual_preview_html = self.md_parser.render(generated_markdown)
            
            # Enhance HTML with custom styling for SVG output
            if enable_svg_output:
                actual_preview_html = self._enhance_html_with_svg_styling(actual_preview_html)

            # Generate meaningful suggestions based on the content
            suggestions = self._generate_content_suggestions(user_input, generated_markdown, language, style, output_preferences)
            
            print(f"INFO: Successfully generated content with title: {extracted_title}")
            return GeneratedContent(
                title=extracted_title,
                article_markdown=generated_markdown,
                preview_html=actual_preview_html, # Use actual HTML
                suggestions=suggestions
            )

        except Exception as e:
            import traceback
            print(f"ERROR: An error occurred during Gemini API call or response processing: {e}")
            traceback.print_exc() 
            error_suggestion = "An error occurred. Please check server logs. If images were used, ensure URLs are valid and publicly accessible."
            # Attempt to generate some HTML for the error message itself if possible
            error_html = self.md_parser.render(f"# Error During Generation\n\nAn error occurred while trying to generate content with the Gemini API: {str(e)}")
            return GeneratedContent(
                title="Error: Content Generation Failed",
                article_markdown=f"# Error During Generation\n\nAn error occurred while trying to generate content with the Gemini API: {str(e)}",
                preview_html=error_html,
                suggestions=[error_suggestion, "Check your API key configuration and network connection", "Verify that all image URLs are accessible"]
            )

    def _enhance_html_with_svg_styling(self, html_content: str) -> str:
        """Enhance HTML content with better styling for SVG elements and overall presentation."""
        # Add custom CSS for SVG-enhanced content
        enhanced_css = """
        <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 { 
            color: #2c3e50;
            margin-top: 2em;
            margin-bottom: 0.5em;
        }
        h1 { 
            border-bottom: 3px solid #3498db;
            padding-bottom: 0.5em;
        }
        svg { 
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
            border: 1px solid #eee;
            border-radius: 8px;
            background: #fafafa;
        }
        .svg-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        pre {
            background: #f8f8f8;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }
        blockquote {
            border-left: 4px solid #3498db;
            margin: 0;
            padding-left: 20px;
            font-style: italic;
            color: #666;
        }
        </style>
        """
        
        # Insert the CSS at the beginning of the HTML content
        if html_content.strip():
            return enhanced_css + html_content
        return html_content

    def _generate_content_suggestions(self, user_input: UserInput, generated_markdown: str, language: str, style: str, output_preferences: Optional[OutputPreferences] = None) -> List[str]:
        """Generate meaningful suggestions based on the content and user input."""
        suggestions = []
        
        # Content analysis
        word_count = len(generated_markdown.split())
        has_images = any(block.type == "image" for block in user_input.blocks)
        has_code = any(block.type == "code" for block in user_input.blocks)
        has_headings = "#" in generated_markdown
        
        # Content improvement suggestions
        if word_count < 300:
            suggestions.append("考虑添加更多细节和例子来丰富文章内容" if language == "zh" else "Consider adding more details and examples to enrich the article content")
        
        if not has_headings:
            suggestions.append("添加章节标题可以提高文章的可读性" if language == "zh" else "Adding section headings can improve article readability")
        
        if has_code and not has_images:
            suggestions.append("考虑添加图表或截图来可视化代码概念" if language == "zh" else "Consider adding diagrams or screenshots to visualize code concepts")
        
        if has_images and not has_code:
            suggestions.append("添加相关代码示例可以增强技术文章的实用性" if language == "zh" else "Adding relevant code examples can enhance the practicality of technical articles")
        
        # Style-specific suggestions
        if style == "academic":
            suggestions.append("考虑添加引用和参考文献来支持论点" if language == "zh" else "Consider adding citations and references to support your arguments")
        elif style == "conversational":
            suggestions.append("可以添加更多问答形式的内容来增强互动性" if language == "zh" else "You could add more Q&A style content to enhance interactivity")
        elif style == "technical":
            suggestions.append("考虑添加性能指标和最佳实践建议" if language == "zh" else "Consider adding performance metrics and best practice recommendations")
        
        # Fusion degree specific suggestions
        fusion_degree = output_preferences.model_dump().get("fusion_degree", "medium") if output_preferences else "medium"
        if fusion_degree == "low":
            suggestions.append("尝试提高融合度来获得更连贯的内容流" if language == "zh" else "Try increasing fusion degree for more coherent content flow")
        elif fusion_degree == "high":
            suggestions.append("如果需要保持原始结构，可以降低融合度" if language == "zh" else "Consider lowering fusion degree if you need to maintain original structure")
        
        # SVG output suggestions
        enable_svg = output_preferences.model_dump().get("enable_svg_output", False) if output_preferences else False
        if not enable_svg and (has_code or "数据" in generated_markdown or "data" in generated_markdown.lower()):
            suggestions.append("启用SVG输出可以添加图表和可视化元素" if language == "zh" else "Enable SVG output to add charts and visualization elements")
        elif enable_svg:
            suggestions.append("SVG图表已启用，可以进一步优化视觉元素" if language == "zh" else "SVG charts are enabled, consider further optimizing visual elements")
        
        # General improvement suggestions
        suggestions.append("审查内容确保逻辑流畅和信息准确" if language == "zh" else "Review content to ensure logical flow and information accuracy")
        
        if language != "en":
            suggestions.append("Check if technical terms are properly localized for your target audience")
        
        return suggestions[:6]  # Limit to 6 suggestions to avoid overwhelming the user
