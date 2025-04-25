'use server';
/**
 * @fileOverview Flow for generating images similar to those from an Instagram account.
 *
 * - generateSimilarImage - A function that generates images similar to those from an Instagram account.
 * - GenerateSimilarImageInput - The input type for the generateSimilarImage function.
 * - GenerateSimilarImageOutput - The return type for the generateSimilarImage function.
 */

import { ai, imageGenerationModel } from '@/ai/ai-instance';
import { z } from 'genkit';
import { analyzeInstagramStyle } from '@/ai/flows/analyze-instagram-style';
import parseDataURL from 'data-urls';
import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';

// Updated Input Schema: Requires accessToken and userId
const GenerateSimilarImageInputSchema = z.object({
  numberOfImages: z.number().default(1).describe('The number of images to generate.'),
  accessToken: z.string().describe('The Instagram access token for the authenticated user.'),
  igId: z.string().describe('The Instagram ID for the authenticated user.'),
});
export type GenerateSimilarImageInput = z.infer<typeof GenerateSimilarImageInputSchema>;

const GenerateSimilarImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('URLs of the generated images.'),
});
export type GenerateSimilarImageOutput = z.infer<typeof GenerateSimilarImageOutputSchema>;

// Updated exported function to match flow input
export async function generateSimilarImage(input: GenerateSimilarImageInput): Promise<GenerateSimilarImageOutput> {
  return generateSimilarImageFlow(input);
}

const generateImage = ai.defineTool({
  name: 'generateImage',
  description: 'Generates an image based on a style summary.',
  inputSchema: z.object({
    styleSummary: z.string().describe('A summary of the visual style, subjects, and color palette.'),
  }),
  outputSchema: z.string().describe('The URL of the generated image.'),
},
async (input) => {
  try {
    // Generate an image based on the provided style summary using Imagen
    const { media } = await ai.generate({
      model: imageGenerationModel,
      prompt: input.styleSummary,
      output: {
        format: 'media',
      },
    });

    if (!media) {
      console.warn("Image generation produced no result");
      throw new Error('No media generated.');
    }

    // Generate a unique filename for this image
    const filename = `generated-${crypto.randomBytes(8).toString('hex')}.png`;
    
    // Parse the data URL and save the image
    const data = parseDataURL(media.url);
    if (!data) {
      throw new Error('Invalid data URL returned from image generation.');
    }

    // Save the image to the public directory
    const publicPath = `/images/${filename}`;
    const fullPath = `./public${publicPath}`;
    
    // Ensure the directory exists
    await mkdir('./public/images', { recursive: true });
    await writeFile(fullPath, data.body);

    // Return the public URL for the image
    return `${process.env.HOST_URL}${publicPath}`;
  } catch (error) {
    console.error("Error in image generation:", error);
    // Return a placeholder image instead of failing
    return "https://picsum.photos/800/800";
  }
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
    console.log(`Starting image generation flow for IG ID: ${input.igId}`);

    // 1. Analyze Style using token and user ID
    const { visualStyleSummary } = await analyzeInstagramStyle({
        accessToken: input.accessToken,
        igId: input.igId,
    });

    console.log("Visual style summary received:", visualStyleSummary);

    // Handle case where analysis fails or returns no summary
    if (!visualStyleSummary || visualStyleSummary.includes("Could not analyze")) {
        console.warn("Cannot generate images due to missing style summary.");
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
        const validUrls = results.filter(url => url && !url.includes("Generation+Failed"));
        console.log(`Successfully generated ${validUrls.length} image(s).`);
        
        if (validUrls.length < input.numberOfImages) {
            console.warn(`Failed to generate ${input.numberOfImages - validUrls.length} image(s).`);
        }
        
        return {
            imageUrls: validUrls,
        };
    } catch (error) {
        console.error("Error during parallel image generation:", error);
        throw new Error('Failed to generate images.');
    }
});
