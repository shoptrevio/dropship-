'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { handleGenerateDescription } from '@/app/actions';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  productName: z.string().min(3, 'Product name must be at least 3 characters'),
  productCategory: z.string().min(3, 'Category must be at least 3 characters'),
  keyFeatures: z.string().min(10, 'List at least one key feature'),
  targetAudience: z.string().min(3, 'Describe the target audience'),
});

type FormValues = z.infer<typeof formSchema>;

export function AddProductForm() {
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
      productCategory: '',
      keyFeatures: '',
      targetAudience: '',
    },
  });

  const handleGenerate = () => {
    const values = form.getValues();
    const result = formSchema.safeParse(values);
    if (!result.success) {
      form.trigger();
      toast({
        title: 'Please fill out all fields',
        description: 'We need all the details to generate a great description.',
        variant: 'destructive'
      });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const res = await handleGenerateDescription(formData);
      if (res.error) {
        toast({
          title: 'Generation Failed',
          description: typeof res.error === 'string' ? res.error : 'An unexpected error occurred.',
          variant: 'destructive'
        });
      } else if (res.description) {
        setDescription(res.description);
        toast({
          title: 'Description Generated!',
          description: 'The AI-generated description has been added below.',
        });
      }
    });
  };
  
  const onSubmit = (values: FormValues) => {
    // This would be the final form submission to save the product
    console.log({ ...values, description });
    toast({
        title: 'Product Saved!',
        description: `${values.productName} has been saved.`
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Astro-Tech Hoodie" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="productCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Apparel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="keyFeatures"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Features (comma-separated)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g. 100% recycled materials, sleek design, cosmic accents" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Audience</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Modern space enthusiasts" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <Button type="button" onClick={handleGenerate} disabled={isPending} variant="outline">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate Description
          </Button>
        </div>

        {description && (
          <div>
            <Label htmlFor="description">Generated Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="mt-2 bg-secondary/50"
            />
          </div>
        )}

        <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90" disabled={!description}>
          Save Product
        </Button>
      </form>
    </Form>
  );
}
