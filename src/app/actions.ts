'use server';

import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { customerSupportChat } from '@/ai/flows/customer-support-chat';
import { z } from 'zod';

const generateDescriptionSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  productCategory: z.string().min(1, 'Product category is required'),
  keyFeatures: z.string().min(1, 'Key features are required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
});

export async function handleGenerateDescription(formData: FormData) {
  const rawFormData = {
    productName: formData.get('productName'),
    productCategory: formData.get('productCategory'),
    keyFeatures: formData.get('keyFeatures'),
    targetAudience: formData.get('targetAudience'),
  };

  const validatedFields = generateDescriptionSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await generateProductDescription(validatedFields.data);
    return { description: result.description };
  } catch (e) {
    return { error: 'Failed to generate description. Please try again.' };
  }
}

const chatMessageSchema = z.object({
  query: z.string().min(1, 'Message cannot be empty'),
});

export async function handleChatMessage(message: string) {
  const validatedMessage = chatMessageSchema.safeParse({ query: message });

  if (!validatedMessage.success) {
    return {
      error: 'Invalid message.',
    };
  }
  
  try {
    const result = await customerSupportChat({ query: validatedMessage.data.query });
    return { response: result.response };
  } catch (e) {
    return { error: 'Sorry, I am unable to respond right now. Please try again later.' };
  }
}
