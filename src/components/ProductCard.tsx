import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { Button } from './ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <CardHeader className="p-0">
        <div className="aspect-square w-full overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={600}
            height={600}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="product image"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-lg mb-2">{product.name}</CardTitle>
        <p className="text-primary font-semibold text-xl">
          ${product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-4 bg-secondary/50">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/product/${product.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
