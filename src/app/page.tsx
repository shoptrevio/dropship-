import { ProductCard } from '@/components/ProductCard';
import { products } from '@/lib/placeholder-data';
import type { Product } from '@/lib/types';

export default function Home() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary-foreground bg-primary rounded-lg py-2 px-4 inline-block shadow-lg">
            Welcome to CommerceAI
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our curated collection of products. Built with the power of AI to enhance your shopping experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
