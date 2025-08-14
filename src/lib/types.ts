import type { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview This file defines the core data structures (TypeScript types) for the application.
 * These types represent the schema for the Firestore database collections and are designed to
 * support a high-performance, scalable, and AI-driven user experience.
 */

// Represents a single product variant (e.g., a specific color and size).
export type Variant = {
  id: string;
  color?: string;
  size?: string;
  inventory: number; // Inventory for this specific variant. Updated via atomic transactions.
};

// Represents regional pricing for a product, supporting multi-currency.
export type RegionalPrice = {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY'; // Supported currencies
  price: number;
};

// Represents a product in the store.
// Firestore Collection: /products
export type Product = {
  id: string; // Document ID
  name: string;
  description: string;
  price: number; // Default price in USD
  regionalPrices?: RegionalPrice[];
  imageUrl: string;
  category: string;
  variants: Variant[];
  supplierId?: string; // Foreign key to the 'suppliers' collection

  // AI-Generated Fields with schema validation required.
  // These fields are optimized for fast reads on high-traffic pages.
  aiGeneratedContent?: {
    description: string;
    trend_score?: number; // 0-100 score indicating trending potential.
    predicted_sales?: number; // Estimated units to be sold in next 30 days.
    visualSearchTags?: string[]; // Tags generated from image analysis for visual search.
    priceHistory?: Record<string, number>; // e.g. { "2023-10-26T10:00:00Z": 19.99 }
  };
};

// Represents a supplier or vendor.
// Firestore Collection: /suppliers
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
// Firestore Collection: /orders
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
  createdAt: Timestamp; // Changed from Date to support Firestore Timestamps directly.

  // AI-Generated Fields with schema validation required.
  ai_risk_assessment?: {
    score: number; // 0-1 scale, fraud likelihood score
    decision: 'approve' | 'review' | 'reject';
    validated: boolean; // Indicates if the schema was validated.
  };
};

// Represents a user of the application.
// Firestore Collection: /users
export type User = {
  id: string; // Document ID (matches Firebase Auth UID)
  email: string;
  role: 'admin' | 'staff' | 'customer' | 'ux-tester'; // Added 'ux-tester' role
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
  };
  // Buckets for A/B testing different UX features.
  abTesting?: {
    [experimentName: string]: 'control' | 'variantA' | 'variantB';
  };
};

// Represents a versioned AI model used in the platform.
// This structure supports gradual rollouts and staging environments.
// Firestore Collection: /ai_models
export type AIModel = {
  id: string; // Document ID, e.g., 'product-description-generator'
  name: string;
  version: string; // e.g., 'v2.1.0'
  description: string;
  endpoint: string; // URL for the model's API
  // Environment for deploying models without affecting production.
  environment: 'staging' | 'production';
  // Percentage of users this model is active for, enabling gradual rollouts.
  rolloutPercentage?: number; // 0-100
};

// Represents feedback on AI-generated content to be used for retraining.
// Firestore Collection: /ai_training_feedback
export type AITrainingFeedback = {
  id: string;
  modelId: string; // Foreign key to AI_models collection
  sourceId: string; // e.g., productId or orderId where AI was used
  userId: string; // User who provided feedback
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: Timestamp;
};

// Represents a log entry for a decision made by an AI model.
// This collection is crucial for debugging, monitoring, and ensuring transparency.
// Firestore Collection: /ai_decision_logs
export type AIDecisionLog = {
  id: string;
  modelId: string; // Which model made the decision
  sourceId: string; // Which document was affected (e.g., product or order ID)
  input: any; // The data the model received
  output: any; // The decision the model made
  timestamp: Timestamp;
  decisionTree?: any; // A representation of the decision path for explainability
  // Flag to identify logs that directly influenced the user interface.
  isUiAffecting: boolean;
};

// Represents a geo-targeted UX variation.
// Firestore Collection: /geo_targeted_ux
export type GeoTargetedUX = {
    id: string; // e.g. "US" or "EMEA"
    countryCodes: string[]; // e.g. ["US", "CA"]
    uxConfig: {
        bannerMessage?: string;
        featuredProductIds?: string[];
    }
}


// Represents global UI settings controlled from the backend.
// Firestore Collection: /ui_settings
export type UISettings = {
  id: string; // e.g., 'global'
  themeConfig: {
    darkMode: boolean;
    lightColors: { primary: string; accent: string; };
    darkColors: { primary: string; accent: string; };
  };
  animationPresets: {
    loadDuration: number; // in ms
    transitionCurve: 'ease-in' | 'ease-out' | 'ease-in-out';
  };
  layoutTemplates: {
    mobileBreakpoint: number; // in pixels
    desktopBreakpoint: number; // in pixels
  };
};

// Represents a single point in a heatmap.
// Firestore Sub-collection: /ux_metrics/{metricId}/clickHeatmaps
export type HeatmapDatapoint = {
  id: string;
  x: number;
  y: number;
  timestamp: Timestamp;
};


// Represents collected user experience metrics for analytics.
// Firestore Collection: /ux_metrics
export type UXMetrics = {
  id: string; // e.g., page URL or user ID
  pageUrl: string;
  userId?: string;
  scrollDepth: number; // Percentage
  aiPersonalizationScore: number; // 0-100 engagement rating
  recordedAt: Timestamp;
};

// Represents global admin controls for real-time UX adjustments.
// Firestore Collection: /admin_ux_controls
export type AdminUxControls = {
  id: string; // e.g., 'global'
  livePreview: boolean; // Toggles UI experiments for admins to see them live.
  aiBannerRotation: number; // Seconds between hero banner changes.
  emergencyUxOff: boolean; // A kill switch to disable complex animations and features.
};
