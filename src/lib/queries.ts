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
 * Fetches a list of premium products from the 'products' collection.
 * 
 * This query retrieves products where:
 * - 'price' is greater than 100
 * - 'category' is either 'electronics' or 'gadgets'
 * - Results are ordered by 'createdAt' in descending order
 * - Limit the results to 10 documents
 * 
 * @returns {Promise<Product[]>} A promise that resolves to an array of product documents.
 * @throws {Error} Throws an error if the query fails to execute.
 */
export async function fetchPremiumProducts(): Promise<Product[]> {
  try {
    const db = getFirestore(app);
    const productsRef = collection(db, 'products');
    
    const q = query(
      productsRef,
      where('price', '>', 100),
      where('category', 'in', ['electronics', 'gadgets']),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No matching products found.');
      return [];
    }

    const products: Product[] = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    
    console.log('Fetched products:', products);
    return products;

  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch premium products.');
  }
}
