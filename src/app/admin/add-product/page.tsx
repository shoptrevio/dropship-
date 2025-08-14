import { AddProductForm } from '@/components/forms/AddProductForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export default function AddProductPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-2xl">
                  AI-Powered Product Creation
                </CardTitle>
                <CardDescription>
                  Fill in the details below and let our AI generate a compelling product description for you.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AddProductForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
