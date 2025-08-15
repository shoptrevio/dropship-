'use server';

/**
 * @fileOverview Provides a customer support chat powered by AI.
 *
 * - customerSupportChat - A function that handles customer inquiries and provides responses.
 * - CustomerSupportChatInput - The input type for the customerSupportChat function.
 * - CustomerSupportChatOutput - The return type for the customerSupportChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomerSupportChatInputSchema = z.object({
  query: z.string().describe('The customer query or message.'),
  orderHistory: z
    .string()
    .optional()
    .describe('Order history of the customer, if available.'),
  productDetails: z.string().optional().describe('Details of the product.'),
});
export type CustomerSupportChatInput = z.infer<typeof CustomerSupportChatInputSchema>;

const CustomerSupportChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the customer query.'),
});
export type CustomerSupportChatOutput = z.infer<typeof CustomerSupportChatOutputSchema>;

export async function customerSupportChat(input: CustomerSupportChatInput): Promise<CustomerSupportChatOutput> {
  return customerSupportChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customerSupportChatPrompt',
  input: {schema: CustomerSupportChatInputSchema},
  output: {schema: CustomerSupportChatOutputSchema},
  system: `You are a friendly and helpful customer support assistant for an e-commerce store.
  Your goal is to answer customer questions and resolve their issues efficiently.
  Use the provided information about order history and product details to give specific, accurate answers.
  If you don't have specific information, you can use your general knowledge, but always prioritize the context provided.
  `,
  prompt: `Customer Query: {{{query}}}
  
  {{#if orderHistory}}Order History: {{{orderHistory}}}{{/if}}
  {{#if productDetails}}Product Details: {{{productDetails}}}{{/if}}
  `,
});

const customerSupportChatFlow = ai.defineFlow(
  {
    name: 'customerSupportChatFlow',
    inputSchema: CustomerSupportChatInputSchema,
    outputSchema: CustomerSupportChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
