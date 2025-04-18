'use server';
/**
 * @fileOverview Analyzes the visual style of Instagram images to guide image generation.
 *
 * - analyzeInstagramStyle - A function that analyzes the visual style of images from an Instagram account.
 * - AnalyzeInstagramStyleInput - The input type for the analyzeInstagramStyle function.
 * - AnalyzeInstagramStyleOutput - The return type for the analyzeInstagramStyle function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getLatestInstagramPosts} from '@/services/instagram';

const AnalyzeInstagramStyleInputSchema = z.object({
  accountName: z.string().describe('The Instagram account name to analyze.'),
});
export type AnalyzeInstagramStyleInput = z.infer<typeof AnalyzeInstagramStyleInputSchema>;

const AnalyzeInstagramStyleOutputSchema = z.object({
  visualStyleSummary: z.string().describe('A summary of the visual style, including colors, subjects, and composition.'),
});
export type AnalyzeInstagramStyleOutput = z.infer<typeof AnalyzeInstagramStyleOutputSchema>;

export async function analyzeInstagramStyle(input: AnalyzeInstagramStyleInput): Promise<AnalyzeInstagramStyleOutput> {
  return analyzeInstagramStyleFlow(input);
}

const analyzeInstagramStylePrompt = ai.definePrompt({
  name: 'analyzeInstagramStylePrompt',
  input: {
    schema: z.object({
      imageUrls: z.array(z.string()).describe('The URLs of the Instagram images to analyze.'),
      accountName: z.string().describe('The Instagram account name.'),
    }),
  },
  output: {
    schema: z.object({
      visualStyleSummary: z.string().describe('A summary of the visual style, including colors, subjects, and composition.'),
    }),
  },
  prompt: `You are an expert in visual style analysis. Analyze the following images from the Instagram account {{{accountName}}} and provide a summary of the visual style, including common colors, subjects, and composition techniques. Be concise.

Images:
{{#each imageUrls}}
  - {{this}}
{{/each}}`,
});

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
    const instagramPosts = await getLatestInstagramPosts(input.accountName);
    const imageUrls = instagramPosts.map(post => post.imageUrl);

    const {output} = await analyzeInstagramStylePrompt({
      imageUrls: imageUrls,
      accountName: input.accountName,
    });
    return output!;
  }
);
