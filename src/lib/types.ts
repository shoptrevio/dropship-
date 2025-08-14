
/**
 * @fileoverview This file defines the core data structures (TypeScript types) for the application.
 * These types represent the schema for the Firestore database collections.
 */

// Represents a single product variant (e.g., a specific color and size).
export type Variant = {
  id: string;
  color?: string;
  size?: string;
  inventory: number;
};

// Represents a product in the store.
export type Product = {
  id: string; // Document ID
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  variants: Variant[];
  supplierId: string; // Foreign key to the 'suppliers' collection

  // AI-Generated Fields
  trend_score?: number; // 0-100 score indicating trending potential
  predicted_sales?: number; // Estimated units to be sold in next 30 days
};

// Represents a supplier or vendor.
export type Supplier = {
  id: string; // Document ID
  name: string;
  apiKey: string; // For API-based order forwarding
  contactEmail: string;

  // Performance metrics tracked over time.
  performance_metrics: {
    reliability: number; // 0-1 scale, based on order fulfillment success
    speed: number; // Average time from order to shipment
    cost: number; // Average product cost rating
  };
};

// Represents a customer's order.
export type Order = {
  id: string; // Document ID
  userId: string; // Foreign key to the 'users' collection
  items: CartItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  tracking?: {
    carrier: string;
    trackingNumber: string;
  };
  createdAt: Date;

  // AI-Generated Fields
  ai_risk_assessment?: number; // 0-1 scale, fraud likelihood score
};

// Represents an item within an order or shopping cart.
export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  priceAtPurchase: number;
};

// Represents a user of the application.
export type User = {
  id: string; // Document ID (matches Firebase Auth UID)
  email: string;
  role: 'admin' | 'staff' | 'customer';
};

// Represents a versioned AI model used in the platform.
export type AIModel = {
  id: string; // Document ID
  name: string; // e.g., 'product-description-generator'
  version: string; // e.g., 'v2.1.0'
  description: string;
  endpoint: string; // URL for the model's API (e.g., a webhook)
};
