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
  prompt: `You are a customer support agent for an e-commerce store.

  Your goal is to answer customer questions and resolve their issues efficiently.
  Use the provided information to provide helpful responses.

  Here's the customer's order history, if available: {{{orderHistory}}}
  Here are the details of the product in question, if available: {{{productDetails}}}

  Customer Query: {{{query}}}
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
