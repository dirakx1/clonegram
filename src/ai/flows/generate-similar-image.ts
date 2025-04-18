'use server';
/**
 * @fileOverview Flow for generating images similar to those from an Instagram account.
 *
 * - generateSimilarImage - A function that generates images similar to those from an Instagram account.
 * - GenerateSimilarImageInput - The input type for the generateSimilarImage function.
 * - GenerateSimilarImageOutput - The return type for the generateSimilarImage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getLatestInstagramPosts} from '@/services/instagram';
import {analyzeInstagramStyle} from '@/ai/flows/analyze-instagram-style';

const GenerateSimilarImageInputSchema = z.object({
  instagramAccount: z.string().describe('The Instagram account to mimic.'),
  numberOfImages: z.number().default(1).describe('The number of images to generate.'),
});
export type GenerateSimilarImageInput = z.infer<typeof GenerateSimilarImageInputSchema>;

const GenerateSimilarImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('URLs of the generated images.'),
});
export type GenerateSimilarImageOutput = z.infer<typeof GenerateSimilarImageOutputSchema>;

export async function generateSimilarImage(input: GenerateSimilarImageInput): Promise<GenerateSimilarImageOutput> {
  return generateSimilarImageFlow(input);
}

const generateImage = ai.defineTool({
  name: 'generateImage',
  description: 'Generates an image based on a style, subject, and color palette.',
  inputSchema: z.object({
    style: z.string().describe('The style of the image to generate.'),
    subjects: z.string().describe('The subjects of the image to generate.'),
    colorPalette: z.string().describe('The color palette of the image to generate.'),
  }),
  outputSchema: z.string().describe('The URL of the generated image.'),
},
async input => {
  const generateImagePrompt = ai.definePrompt({
    name: 'generateImagePrompt',
    input: {
      schema: z.object({
        style: z.string().describe('The style of the image to generate.'),
        subjects: z.string().describe('The subjects of the image to generate.'),
        colorPalette: z.string().describe('The color palette of the image to generate.'),
      }),
    },
    output: {
      schema: z.string().describe('The URL of the generated image.'),
    },
    prompt: `Create an image in the following style: {{{style}}}, with subjects including: {{{subjects}}}, and a color palette of: {{{colorPalette}}}.  Return ONLY the URL of the generated image.`,
  });
  const {output} = await generateImagePrompt(input);
  return output;
});

const generateSimilarImageFlow = ai.defineFlow<
  typeof GenerateSimilarImageInputSchema,
  typeof GenerateSimilarImageOutputSchema
>({
  name: 'generateSimilarImageFlow',
  inputSchema: GenerateSimilarImageInputSchema,
  outputSchema: GenerateSimilarImageOutputSchema,
},
async input => {
  const {visualStyleSummary} = await analyzeInstagramStyle({accountName: input.instagramAccount});

  const generatedImageUrls: string[] = [];
  for (let i = 0; i < input.numberOfImages; i++) {
    const imageUrl = await generateImage({
      style: visualStyleSummary,
      subjects: visualStyleSummary,
      colorPalette: visualStyleSummary,
    });
    generatedImageUrls.push(imageUrl);
  }

  return {
    imageUrls: generatedImageUrls,
  };
});
