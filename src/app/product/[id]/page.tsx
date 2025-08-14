'use client';

import { useState } from 'react';
import { products } from '@/lib/placeholder-data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const product = products.find((p) => p.id === params.id);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product?.variants[0]?.id || null
  );

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-2xl font-bold">Product not found</p>
      </div>
    );
  }

  const selectedVariant = product.variants.find(
    (v) => v.id === selectedVariantId
  );
  
  const uniqueColors = Array.from(new Set(product.variants.map(v => v.color).filter(Boolean)));
  const uniqueSizes = Array.from(new Set(product.variants.map(v => v.size).filter(Boolean)));
  
  const handleAddToCart = () => {
    if (selectedVariant) {
      toast({
        title: 'Added to Cart!',
        description: `${product.name} has been added to your cart.`,
      });
    } else {
      toast({
        title: 'Please select a variant',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="w-full">
          <Card className="overflow-hidden shadow-lg">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={800}
              height={800}
              className="w-full h-full object-cover"
              data-ai-hint="product lifestyle"
            />
          </Card>
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
            {product.name}
          </h1>
          <Badge variant="secondary" className="mt-2 text-sm">{product.category}</Badge>
          <p className="text-3xl font-bold text-foreground mt-4">${product.price.toFixed(2)}</p>
          <p className="text-muted-foreground mt-4 leading-relaxed">{product.description}</p>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Choose your options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {uniqueColors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Color</h3>
                  <RadioGroup defaultValue={product.variants.find(v => v.id === selectedVariantId)?.color} onValueChange={(color) => {
                      const variant = product.variants.find(v => v.color === color);
                      if(variant) setSelectedVariantId(variant.id);
                  }}>
                    <div className="flex flex-wrap gap-2">
                      {uniqueColors.map((color) => (
                        <RadioGroupItem key={color} value={color} id={`color-${color}`} className="sr-only"/>
                      ))}
                      {uniqueColors.map((color) => (
                          <Label key={color} htmlFor={`color-${color}`} className={cn("px-4 py-2 rounded-md border cursor-pointer", product.variants.find(v => v.id === selectedVariantId)?.color === color ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>
                            {color}
                          </Label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {uniqueSizes.length > 0 && (
                 <div>
                  <h3 className="font-semibold mb-2">Size</h3>
                  <RadioGroup defaultValue={product.variants.find(v => v.id === selectedVariantId)?.size} onValueChange={(size) => {
                      const variant = product.variants.find(v => v.size === size);
                      if(variant) setSelectedVariantId(variant.id);
                  }}>
                    <div className="flex flex-wrap gap-2">
                       {uniqueSizes.map((size) => (
                         <RadioGroupItem key={size} value={size} id={`size-${size}`} className="sr-only"/>
                      ))}
                      {uniqueSizes.map((size) => (
                          <Label key={size} htmlFor={`size-${size}`} className={cn("px-4 py-2 rounded-md border cursor-pointer", product.variants.find(v => v.id === selectedVariantId)?.size === size ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>
                            {size}
                          </Label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}
              
              <div className="mt-4">
                {selectedVariant && selectedVariant.inventory > 0 ? (
                  <Badge variant={selectedVariant.inventory < 10 ? "destructive" : "default"}>
                    {selectedVariant.inventory < 10 ? `Only ${selectedVariant.inventory} left!` : 'In Stock'}
                  </Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
              
              <Button size="lg" className="w-full mt-6 bg-accent hover:bg-accent/90" onClick={handleAddToCart} disabled={!selectedVariant || selectedVariant.inventory === 0}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
