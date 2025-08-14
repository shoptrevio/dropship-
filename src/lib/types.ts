
export type Variant = {
  id: string;
  color?: string;
  size?: string;
  inventory: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  variants: Variant[];
  trend_score?: number;
  predicted_sales?: number;
  supplierId: string;
};

export type Supplier = {
  id: string;
  name: string;
  performance_metrics: {
    reliability: number;
    speed: number;
    cost: number;
  };
};

export type Order = {
  id: string;
  userId: string;
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
  ai_risk_assessment?: number;
};

export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type User = {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
};

export type AIModel = {
  id: string;
  name: string;
  version: string;
  description: string;
};
