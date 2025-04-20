'use server';
/**
 * @fileOverview Analyzes the visual style of Instagram images to guide image generation.
 *
 * - analyzeInstagramStyle - A function that analyzes the visual style of images from the authenticated user's Instagram account.
 * - AnalyzeInstagramStyleInput - The input type for the analyzeInstagramStyle function.
 * - AnalyzeInstagramStyleOutput - The return type for the analyzeInstagramStyle function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { getLatestInstagramPosts } from '@/services/instagram';

// Updated Input Schema: Requires accessToken and userId, accountName is optional
const AnalyzeInstagramStyleInputSchema = z.object({
  accessToken: z.string().describe('The Instagram user access token.'),
  userId: z.string().describe('The Instagram user ID.'),
  accountName: z.string().optional().describe('Optional: The Instagram account name (used for context in the prompt).'),
});
export type AnalyzeInstagramStyleInput = z.infer<typeof AnalyzeInstagramStyleInputSchema>;

const AnalyzeInstagramStyleOutputSchema = z.object({
  visualStyleSummary: z.string().describe('A summary of the visual style, including colors, subjects, and composition.'),
});
export type AnalyzeInstagramStyleOutput = z.infer<typeof AnalyzeInstagramStyleOutputSchema>;

// The exported function remains the same, just calling the flow
export async function analyzeInstagramStyle(input: AnalyzeInstagramStyleInput): Promise<AnalyzeInstagramStyleOutput> {
  return analyzeInstagramStyleFlow(input);
}

// Updated Prompt Input Schema: Only needs imageUrls and optional accountName
const analyzeInstagramStylePrompt = ai.definePrompt({
  name: 'analyzeInstagramStylePrompt',
  input: {
    schema: z.object({
      imageUrls: z.array(z.string()).describe('The URLs of the Instagram images to analyze.'),
      accountName: z.string().optional().describe('Optional: The Instagram account name for context.'),
    }),
  },
  output: {
    schema: AnalyzeInstagramStyleOutputSchema, // Use the existing output schema
  },
  // Updated prompt to handle optional account name
  prompt: `You are an expert in visual style analysis. Analyze the following images {{#if accountName}}from the Instagram account {{{accountName}}}{{else}}provided{{/if}} and provide a summary of the visual style, including common colors, subjects, and composition techniques. Be concise.

Images:
{{#each imageUrls}}
  - {{this}}
{{/each}}`,
});

// Updated Flow: Uses accessToken and userId to fetch posts
const analyzeInstagramStyleFlow = ai.defineFlow<
  typeof AnalyzeInstagramStyleInputSchema,
  typeof AnalyzeInstagramStyleOutputSchema
>(
  {
    name: 'analyzeInstagramStyleFlow',
    inputSchema: AnalyzeInstagramStyleInputSchema,
    outputSchema: AnalyzeInstagramStyleOutputSchema,
  },
  async input => {
    // Fetch posts using token and user ID
    const instagramPosts = await getLatestInstagramPosts(input.accessToken, input.userId);

    if (!instagramPosts || instagramPosts.length === 0) {
      // Handle case where no posts are fetched or user has no media
      // You might want to return a default summary or throw a specific error
      console.warn(`No Instagram posts found for user ID: ${input.userId}. Cannot analyze style.`);
      return {
        visualStyleSummary: "Could not analyze visual style as no Instagram posts were found or accessible."
      };
    }

    const imageUrls = instagramPosts.map(post => post.imageUrl);

    // Call the prompt with the fetched image URLs and optional account name
    const { output } = await analyzeInstagramStylePrompt({
      imageUrls: imageUrls,
      accountName: input.accountName, // Pass optional name for context
    });

    if (!output) {
        throw new Error("Failed to get a response from the analysis prompt.")
    }
    
    return output;
  }
);
