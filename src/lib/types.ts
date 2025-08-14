
/**
 * @fileoverview This file defines the core data structures (TypeScript types) for the application.
 * These types represent the schema for the Firestore database collections.
 */

// Represents a single product variant (e.g., a specific color and size).
export type Variant = {
  id: string;
  color?: string;
  size?: string;
  inventory: number; // Inventory for this specific variant. Updated via atomic transactions.
};

// Represents regional pricing for a product.
export type RegionalPrice = {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY'; // Supported currencies
  price: number;
};

// Represents a product in the store.
export type Product = {
  id: string; // Document ID
  name: string;
  description: string;
  price: number; // Default price in USD
  regionalPrices?: RegionalPrice[]; // For multi-currency support
  imageUrl: string;
  category: string;
  variants: Variant[];
  supplierId?: string; // Foreign key to the 'suppliers' collection

  // AI-Generated Fields with schema validation required.
  aiGeneratedContent?: {
    description: string;
    trend_score?: number; // 0-100 score indicating trending potential
    predicted_sales?: number; // Estimated units to be sold in next 30 days
  };
};

// Represents a supplier or vendor.
export type Supplier = {
  id: string; // Document ID
  name: string;
  apiKey: string; // For API-based order forwarding. Managed securely.
  contactEmail: string;

  // Performance metrics tracked over time.
  performance_metrics: {
    reliability: number; // 0-1 scale, based on order fulfillment success
    speed: number; // Average time from order to shipment
    cost: number; // Average product cost rating
  };
};

// Represents an item within an order or shopping cart.
export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  priceAtPurchase: number;
  currency: string;
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

  // AI-Generated Fields with schema validation required.
  ai_risk_assessment?: {
    score: number; // 0-1 scale, fraud likelihood score
    decision: 'approve' | 'review' | 'reject';
    validated: boolean; // Indicates if the schema was validated.
  };
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
  version: string; // e.g., 'v2.1.0-staging', 'v2.1.0-prod'
  environment: 'staging' | 'production';
  description: string;
  endpoint: string; // URL for the model's API (e.g., a webhook)
};

// Represents feedback on AI-generated content to be used for retraining.
export type AITrainingFeedback = {
  id: string;
  modelId: string; // Foreign key to AI_models collection
  sourceId: string; // e.g., productId or orderId where AI was used
  userId: string; // User who provided feedback
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: Date;
};

// Represents a log entry for a decision made by an AI model.
export type AIDecisionLog = {
  id: string;
  modelId: string;
  sourceId: string;
  input: any; // The data the model received
  output: any; // The decision the model made
  timestamp: Date;
  decisionTree?: any; // A representation of the decision path
};
