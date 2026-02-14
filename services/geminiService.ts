
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";
import { GeneratedImage, ImageModel } from "../types";

// The default template for generating a letter image.
// Exported so it can be displayed and edited in the UI.
export const DEFAULT_LETTER_PROMPT_TEMPLATE = `The letter'\${LETTER}' made out of \${STYLE_PROMPT}.`;

// Helper function to create the detailed prompt by replacing placeholders in a template.
const createLetterPrompt = (
  letter: string,
  stylePrompt: string,
  template: string
): string => {
  return template
    .replace(/\${LETTER}/g, letter.toUpperCase())
    .replace(/\${STYLE_PROMPT}/g, stylePrompt);
};

// New function to enhance the style prompt using a more advanced model.
const enhanceStylePrompt = async (
  stylePrompt: string,
  letters: string[]
): Promise<string> => {
  // Create a new instance to ensure we use the latest API Key (if selected via dialog)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const enhancementPrompt = `You are a creative prompt engineer for an image generation
  model. Your task is to enhance a style description that will be used in the template: "The
  letter '[LETTER]' made out of [STYLE]."

  Your enhanced description should:
  1. Be grammatically correct when inserted after "made out of"
  2. Be descriptive and visually rich
  3. Describe how the object showing the letter. 
  4. Limit the output to 450 tokens. 

  Original style: "${stylePrompt}"
  Letters to generate: ${letters.join(", ")}

  Enhanced style description (respond with ONLY the enhanced description, no other text):`;

  try {
    // Correct Fix: Use gemini-3-flash-preview for text tasks as per guidelines (avoid prohibited gemini-flash-latest/1.5-flash)
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: enhancementPrompt,
    });
    // result.text is a property, accessing it directly is correct.
    const enhancedPrompt = result.text?.trim() ?? stylePrompt;
    return enhancedPrompt;
  } catch (error) {
    console.error("Error enhancing style prompt:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    // Propagate a user-friendly error but include details for 429 detection
    throw new Error(
      `Failed to enhance style prompt. Using original prompt instead. ${errorMsg}`
    );
  }
};

// Helper to check if the model is a Gemini image generation model (uses generateContent)
const isGeminiImageModel = (model: ImageModel) => {
  return model === "gemini-3-pro-image-preview" || model === "gemini-2.5-flash-image";
};

// Function for generating a single letter, now using the prompt Rewriter.
export const generateSingleLetterImage = async (
  originalStylePrompt: string,
  letter: string,
  imageModel: ImageModel,
  useRewriter: boolean,
  activeStylePrompt?: string
): Promise<GeneratedImage> => {
  let finalStylePrompt: string;
  if (useRewriter) {
    // If the rewriter is on, check if an already-enhanced prompt was provided.
    // If so, use it for consistency. This handles cases where the input was
    // already updated to the enhanced prompt or if we are regenerating within the same session.
    if (activeStylePrompt) {
      finalStylePrompt = activeStylePrompt;
    } else {
      // Otherwise, enhance the original prompt for this specific letter.
      finalStylePrompt = await enhanceStylePrompt(originalStylePrompt, [
        letter,
      ]);
    }
  } else {
    // If rewriter is off, always use the original prompt.
    finalStylePrompt = originalStylePrompt;
  }

  // Create a new instance to ensure we use the latest API Key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = createLetterPrompt(
    letter,
    finalStylePrompt,
    DEFAULT_LETTER_PROMPT_TEMPLATE
  );

  try {
    if (isGeminiImageModel(imageModel)) {
      const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [{ text: prompt }] },
        config: {
          // Correct Fix: Removed responseModalities: [Modality.IMAGE] as it is not supported/required for generateContent image generation.
          imageConfig: {
              aspectRatio: "1:1",
              ...(imageModel === "gemini-3-pro-image-preview" ? { imageSize: "2K" } : {}),
          },  
        },
      });
      let base64ImageBytes: string | undefined;
      // Search for image data in candidates
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64ImageBytes = part.inlineData.data;
            break;
          }
        }
      }
      if (!base64ImageBytes) {
        throw new Error(
          `No image was generated for letter '${letter}' from ${imageModel}.`
        );
      }
      return {
        letter: letter,
        image: `data:image/png;base64,${base64ImageBytes}`,
      };
    } else {
      // For Imagen models, use generateImages method
      const response = await ai.models.generateImages({
        model: imageModel,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/png",
          aspectRatio: "1:1",
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return {
          letter: letter,
          image: `data:image/png;base64,${base64ImageBytes}`,
        };
      }
    }
    throw new Error(`No image was generated for letter '${letter}'.`);
  } catch (error) {
    console.error(`Error generating image for letter '${letter}':`, error);
    // Propagate error to let the caller handle it.
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate image for letter '${letter}'. ${errorMsg}`);
  }
};

// Updated to use the new single letter generation function and return enhanced prompt.
export const generateLetterImages = async (
  stylePrompt: string,
  textPrompt: string,
  imageModel: ImageModel,
  useRewriter: boolean,
  customPromptTemplate?: string
): Promise<{ images: GeneratedImage[]; enhancedStylePrompt: string }> => {
  // 1. Filter for English letters only.
  // 2. Use a Set to get unique letters.
  // 3. Convert Set back to an array to map over.
  const uniqueLetters = Array.from(
    new Set(textPrompt.split("").filter((char) => /[a-zA-Z]/.test(char)))
  );

  // Enhance the style prompt once for all letters, if enabled.
  const finalStylePrompt = useRewriter
    ? await enhanceStylePrompt(stylePrompt, uniqueLetters)
    : stylePrompt;

  // Use custom template if provided, otherwise use default
  const templateToUse = customPromptTemplate || DEFAULT_LETTER_PROMPT_TEMPLATE;
  
  // Create a new instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePromises = uniqueLetters.map(async (letter) => {
    try {
      // Create the prompt using the custom template and final style prompt
      const prompt = createLetterPrompt(
        letter,
        finalStylePrompt,
        templateToUse
      );

      if (isGeminiImageModel(imageModel)) {
        const response = await ai.models.generateContent({
          model: imageModel,
          contents: { parts: [{ text: prompt }] },
          config: {
            // Correct Fix: Removed unsupported responseModalities
            imageConfig: {
                aspectRatio: "1:1",
                ...(imageModel === "gemini-3-pro-image-preview" ? { imageSize: "2K" } : {}),
            },  
          },
        });
        let base64ImageBytes: string | undefined;
        if (response.candidates && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              base64ImageBytes = part.inlineData.data;
              break;
            }
          }
        }
        if (!base64ImageBytes) {
          throw new Error(`No image was generated for letter '${letter}'.`);
        }
        return {
          letter: letter,
          image: `data:image/png;base64,${base64ImageBytes}`,
        };
      } else {
        const response = await ai.models.generateImages({
          model: imageModel,
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/png",
            aspectRatio: "1:1",
          },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          const base64ImageBytes = response.generatedImages[0].image.imageBytes;
          return {
            letter: letter,
            image: `data:image/png;base64,${base64ImageBytes}`,
          };
        }
      }
      throw new Error(`No image was generated for letter '${letter}'.`);
    } catch (error) {
      console.error(
        `Failed to generate image for letter '${letter}'.`,
        error
      );
      // Return a specific error object for this letter
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        letter,
        error: `Image generation failed for letter '${letter}'. ${errorMsg}`,
      };
    }
  });

  const results = await Promise.all(imagePromises);

  // Separate successful images from errors
  const images: GeneratedImage[] = [];
  const errors: { letter: string; message: string }[] = [];

  results.forEach((result) => {
    if (result && "image" in result && result.image) {
      images.push({ letter: result.letter, image: result.image });
    } else if (result && "error" in result) {
      errors.push({ letter: result.letter, message: result.error });
    }
  });

  // If there were any errors, throw a composite error message
  if (errors.length > 0) {
    const successfulCount = images.length;
    const failedCount = errors.length;
    const failedLetters = errors.map((e) => e.letter).join(", ");
    const errorDetails = errors.map((e) => e.message).join(" | ");
    throw new Error(
      `Generated ${successfulCount} image(s) successfully, but failed to generate for ${failedCount} letter(s): ${failedLetters}. Details: ${errorDetails}`
    );
  }

  return { images, enhancedStylePrompt: finalStylePrompt };
};
