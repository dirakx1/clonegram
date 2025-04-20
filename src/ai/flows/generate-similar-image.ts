'use server';
/**
 * @fileOverview Flow for generating images similar to those from an Instagram account.
 *
 * - generateSimilarImage - A function that generates images similar to those from an Instagram account.
 * - GenerateSimilarImageInput - The input type for the generateSimilarImage function.
 * - GenerateSimilarImageOutput - The return type for the generateSimilarImage function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { analyzeInstagramStyle } from '@/ai/flows/analyze-instagram-style';

// Updated Input Schema: Requires accessToken and userId
const GenerateSimilarImageInputSchema = z.object({
  // instagramAccount: z.string().optional().describe('The specific Instagram account to mimic (optional if using authenticated user).'),
  numberOfImages: z.number().default(1).describe('The number of images to generate.'),
  accessToken: z.string().describe('The Instagram access token for the authenticated user.'),
  userId: z.string().describe('The Instagram user ID for the authenticated user.'),
});
export type GenerateSimilarImageInput = z.infer<typeof GenerateSimilarImageInputSchema>;

const GenerateSimilarImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('URLs of the generated images.'),
});
export type GenerateSimilarImageOutput = z.infer<typeof GenerateSimilarImageOutputSchema>;

// Updated exported function to match flow input
export async function generateSimilarImage(input: GenerateSimilarImageInput): Promise<GenerateSimilarImageOutput> {
  // Input validation happens within the flow definition now
  return generateSimilarImageFlow(input);
}

// This tool's prompt is slightly simplified - it takes the overall style summary.
// For better results, analyzeInstagramStyle could return structured data (style, subjects, colors)
// and this tool's input schema could match that structure.
const generateImage = ai.defineTool({
  name: 'generateImage',
  description: 'Generates an image based on a style summary.',
  inputSchema: z.object({
    styleSummary: z.string().describe('A summary of the visual style, subjects, and color palette.'),
  }),
  outputSchema: z.string().describe('The URL of the generated image.'),
},
async (input) => {
  // Generate an image based on the provided style summary
  // Use a model capable of image generation (ensure Gemini Pro is configured appropriately or switch model)
  const llmResponse = await ai.generate({
      prompt: `Generate a high-resolution, photorealistic image based on the following style summary: ${input.styleSummary}. Focus on capturing the essence described. Return ONLY the URL of the generated image. If you cannot generate an image, return an empty string.`,
      model: 'gemini-pro', // Or your configured image generation model
      output: {
          format: 'text', // Expecting a URL string back
      }
  });

  const imageUrl = llmResponse.text();

  // Basic validation if the model returns a plausible URL (might need refinement)
  if (!imageUrl || !imageUrl.startsWith('http')) {
      console.error("Image generation failed or returned invalid URL:", imageUrl);
      // Consider throwing or returning a placeholder/error indicator
      return "https://via.placeholder.com/150/FF0000/FFFFFF?text=Generation+Failed"; // Placeholder
  }

  return imageUrl;
});

// Updated Flow Definition
const generateSimilarImageFlow = ai.defineFlow<
  typeof GenerateSimilarImageInputSchema,
  typeof GenerateSimilarImageOutputSchema
>({
  name: 'generateSimilarImageFlow',
  inputSchema: GenerateSimilarImageInputSchema,
  outputSchema: GenerateSimilarImageOutputSchema,
},
async (input) => {
    console.log(`Starting image generation flow for user: ${input.userId}`);

    // 1. Analyze Style using token and user ID
    const { visualStyleSummary } = await analyzeInstagramStyle({
        accessToken: input.accessToken,
        userId: input.userId,
        // accountName is optional in analyzeInstagramStyle, not passing it here
    });

    console.log("Visual style summary received:", visualStyleSummary);

    // Handle case where analysis fails or returns no summary
    if (!visualStyleSummary || visualStyleSummary.includes("Could not analyze")) {
        console.warn("Cannot generate images due to missing style summary.");
        // Return empty array or throw error based on desired behavior
        return { imageUrls: [] }; 
    }

    // 2. Generate Images in Parallel
    const imagePromises: Promise<string>[] = [];
    console.log(`Generating ${input.numberOfImages} image(s)...`);

    for (let i = 0; i < input.numberOfImages; i++) {
        imagePromises.push(
            generateImage({
                styleSummary: visualStyleSummary,
            })
        );
    }

    // Wait for all image generation promises to resolve
    try {
        const results = await Promise.all(imagePromises);
        const validUrls = results.filter(url => url && !url.includes("Generation+Failed")); // Filter out failures
        console.log(`Successfully generated ${validUrls.length} image(s).`);
        
        if (validUrls.length < input.numberOfImages) {
            console.warn(`Failed to generate ${input.numberOfImages - validUrls.length} image(s).`);
            // Optionally inform the user via toast or error message about partial success
        }

        return {
            imageUrls: validUrls,
        };
    } catch (error) {
        console.error("Error during parallel image generation:", error);
        throw new Error('Failed to generate images.'); // Re-throw or handle as needed
    }
});
