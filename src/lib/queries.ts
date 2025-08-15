'use server';

import { app } from '@/lib/firebase';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import type { Product } from './types';

/**
 * Fetches a list of featured products from the 'products' collection.
 * 
 * This query retrieves products where:
 * - The price is greater than 100.
 * - The category is either 'electronics' or 'gadgets'.
 * - The results are ordered by creation date in descending order.
 * - The query is limited to a maximum of 10 documents.
 * 
 * @returns {Promise<Product[]>} A promise that resolves to an array of product documents.
 * @throws {Error} Throws an error if the query fails to execute.
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const db = getFirestore(app);
    const productsRef = collection(db, 'products');

    // Note: To use the 'in' operator in a compound query, you will need to create a
    // composite index in your Firestore console. The index would be for:
    // `products`: `price` (Ascending), `category` (Ascending), `createdAt` (Descending)
    const q = query(
      productsRef,
      where('price', '>', 100),
      where('category', 'in', ['electronics', 'gadgets']),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No matching products found.');
      return [];
    }

    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      // It's a good practice to cast the document data to your defined type.
      products.push({ id: doc.id, ...doc.data() } as Product);
    });

    return products;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    // Re-throw the error or handle it as needed for your application.
    throw new Error('Failed to fetch featured products.');
  }
}
