import type { Product } from './types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Astro-Tech Hoodie',
    description: 'A comfortable and stylish hoodie for the modern space enthusiast. Made with 100% recycled materials, this hoodie features a sleek design with subtle cosmic accents. Perfect for stargazing on a cool night or just lounging around the space station.',
    price: 59.99,
    imageUrl: 'https://placehold.co/600x600.png',
    category: 'Apparel',
    variants: [
      { id: 'v1-1', color: 'Deep Space Black', size: 'S', inventory: 10 },
      { id: 'v1-2', color: 'Deep Space Black', size: 'M', inventory: 15 },
      { id: 'v1-3', color: 'Deep Space Black', size: 'L', inventory: 5 },
      { id: 'v1-4', color: 'Galaxy Blue', size: 'M', inventory: 8 },
    ],
  },
  {
    id: '2',
    name: 'Cyber-Synth Keyboard',
    description: 'Elevate your typing experience with this retro-futuristic mechanical keyboard. Featuring customizable RGB lighting, clicky switches, and a durable aluminum frame, it\'s the perfect tool for programmers, writers, and gamers who appreciate a cyberpunk aesthetic.',
    price: 129.99,
    imageUrl: 'https://placehold.co/600x600.png',
    category: 'Electronics',
    variants: [
      { id: 'v2-1', inventory: 20 },
    ],
  },
  {
    id: '3',
    name: 'Eco-Grow Smart Planter',
    description: 'Bring nature indoors with this AI-powered smart planter. It automatically waters and provides the right amount of light for your plants, ensuring they thrive. Connect to the app to monitor your plant\'s health and get tips from our AI botanist.',
    price: 89.99,
    imageUrl: 'https://placehold.co/600x600.png',
    category: 'Home Goods',
    variants: [
      { id: 'v3-1', color: 'Ceramic White', inventory: 30 },
      { id: 'v3-2', color: 'Matte Black', inventory: 12 },
    ],
  },
  {
    id: '4',
    name: 'Quantum-Leap Sneakers',
    description: 'Step into the future with these lightweight, responsive sneakers. The energy-return foam and adaptive-fit upper make you feel like you\'re walking on air. Designed for both athletic performance and all-day comfort.',
    price: 149.99,
    imageUrl: 'https://placehold.co/600x600.png',
    category: 'Footwear',
    variants: [
      { id: 'v4-1', color: 'White/Blue', size: '9', inventory: 7 },
      { id: 'v4-2', color: 'White/Blue', size: '10', inventory: 11 },
      { id: 'v4-3', color: 'Black/Purple', size: '10', inventory: 9 },
    ],
  },
];
