'use client';

import Link from 'next/link';
import { Bot, Home, PackagePlus, ShoppingCart, Store } from 'lucide-react';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/admin/add-product', label: 'Add Product', icon: PackagePlus },
    { href: '/checkout', label: 'Checkout', icon: ShoppingCart },
  ];

  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <Store className="h-8 w-8" />
              <span className="text-2xl font-bold font-headline">CommerceAI</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant={pathname === link.href ? 'default' : 'ghost'}
                asChild
              >
                <Link href={link.href} className="flex items-center gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
