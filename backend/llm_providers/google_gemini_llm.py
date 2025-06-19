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
                    api_key=api_key,
                    transport="rest",
                    client_options={"api_endpoint": "https://gateway.ai.cloudflare.com/v1/60bce5651af4949a5209ff4fc10a1cfd/hong-gemini/google-ai-studio"}
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
                suggestions=["Ensure GOOGLE_API_KEY is set."]
            )

        current_model_supports_images = model_supports_images_lookup(llm_selection.model_name)
        print(f"INFO: Model {llm_selection.model_name} selected. Determined image support: {current_model_supports_images}")

        api_call_parts: List[Union[str, Image.Image]] = []
        
        # Get language, style, and word count preferences
        language = "zh"  # Default to Chinese
        style = "professional"  # Default style
        min_word_count = None
        max_word_count = None
        
        if output_preferences:
            # Convert Pydantic model to dict if needed
            prefs_dict = output_preferences.model_dump() if hasattr(output_preferences, 'model_dump') else output_preferences
            language = prefs_dict.get("language", "zh")
            style = prefs_dict.get("style", "professional")
            min_word_count = prefs_dict.get("min_word_count")
            max_word_count = prefs_dict.get("max_word_count")
        
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

            print(f"INFO: Successfully generated content with title: {extracted_title}")
            return GeneratedContent(
                title=extracted_title,
                article_markdown=generated_markdown,
                preview_html=actual_preview_html, # Use actual HTML
                suggestions=["Content generated successfully by Google Gemini."]
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
                suggestions=[error_suggestion]
            )
