'use server';

/**
 * @fileOverview AI-powered product description generator.
 *
 * - generateProductDescription - A function that generates a product description based on input.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productCategory: z.string().describe('The category of the product.'),
  keyFeatures: z.string().describe('Key features of the product.'),
  targetAudience: z.string().describe('The target audience for the product.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling product description.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are an expert copywriter specializing in e-commerce product descriptions. Generate a compelling and engaging product description based on the following information:

Product Name: {{{productName}}}
Product Category: {{{productCategory}}}
Key Features: {{{keyFeatures}}}
Target Audience: {{{targetAudience}}}

Incorporate relevant keywords, highlight benefits, and create a sense of desire for the product. The description should be concise, persuasive, and optimized for online sales. Consider including trending tags, emoji and other details to make the description more visually appealing and engaging. Decide based on the product category and target audience.
`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
