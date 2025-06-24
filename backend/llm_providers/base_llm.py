from abc import ABC, abstractmethod
from typing import Optional, Dict
from schemas import UserInput, LLMSelection, GeneratedContent, OutputPreferences

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_content_from_blocks(
        self,
        user_input: UserInput,
        llm_selection: LLMSelection,
        output_preferences: Optional[OutputPreferences] = None
    ) -> GeneratedContent:
        """
        Processes user input blocks and generates structured content using the selected LLM.

        Args:
            user_input: The user's input, structured as a list of content blocks.
            llm_selection: The user's choice of LLM provider and model.
            output_preferences: Optional OutputPreferences object for guiding generation (e.g., tone, style).

        Returns:
            GeneratedContent object containing the title, markdown, HTML, and suggestions.
        """
        pass
    
    @abstractmethod
    async def generate_simple_text(
        self,
        prompt: str,
        model_name: str = "default"
    ) -> str:
        """
        Generates simple text response from a prompt using the selected LLM.

        Args:
            prompt: The text prompt to send to the LLM.
            model_name: The model name to use for generation.

        Returns:
            The generated text response as a string.
        """
        pass
