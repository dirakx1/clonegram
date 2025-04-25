import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';
import { vertexAI, imagen3Fast } from '@genkit-ai/vertexai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
    vertexAI({
      location: 'us-central1',
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    }),
  ],
  model: gemini20Flash,
});

// Export the Imagen model for image generation
export const imageGenerationModel = imagen3Fast;
