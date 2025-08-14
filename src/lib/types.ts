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
};

export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
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
};
