'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [user] = useAuthState(auth);
  const [productsSnapshot, loading] = useCollection(
    query(collection(db, 'products'), where('status', '==', 'active'))
  );

  const products = productsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline text-primary">
              The Future of Shopping is Here.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0">
              Discover unique products, personalized just for you with the power of AI. Your perfect item is just a click away.
            </p>
            <div className="mt-8 flex justify-center md:justify-start gap-4">
              <Button size="lg" asChild>
                <Link href="#products">
                  Explore Products <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/admin/add-product">
                  Create with AI
                </Link>
              </Button>
            </div>
          </div>
          <div className="w-full h-full">
            <Image
              src="https://placehold.co/700x500.png"
              alt="AI-powered shopping experience"
              width={700}
              height={500}
              className="rounded-lg shadow-2xl object-cover"
              data-ai-hint="futuristic shopping"
            />
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <div id="products" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-foreground bg-primary rounded-lg py-2 px-4 inline-block shadow-lg">
            Our Featured Products
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Hand-picked and ready to be discovered.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products?.map((product: Product) => (
              <ProductCard key={product.id} product={product} userId={user?.uid} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
