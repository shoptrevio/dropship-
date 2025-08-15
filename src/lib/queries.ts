
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
 * Fetches a list of active products from the 'products' collection.
 * This query is intended for customer-facing views.
 * 
 * Note: This server-side function is where you would strip out sensitive
 * fields before sending the data to the client, as Firestore security rules
 * cannot hide fields on read operations.
 * 
 * @returns {Promise<Product[]>} A promise that resolves to an array of product documents.
 * @throws {Error} Throws an error if the query fails to execute.
 */
export async function fetchActiveProducts(): Promise<Product[]> {
  try {
    const db = getFirestore(app);
    const productsRef = collection(db, 'products');
    
    const q = query(
      productsRef,
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No active products found.');
      return [];
    }

    const products: Product[] = [];
    snapshot.forEach(doc => {
      const productData = doc.data();
      // This is where you would strip out sensitive data.
      // For example, delete productData.costPrice;
      products.push({ id: doc.id, ...productData } as Product);
    });
    
    console.log('Fetched active products:', products);
    return products;

  } catch (error) {
    console.error('Error fetching active products:', error);
    throw new Error('Failed to fetch active products.');
  }
}


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
