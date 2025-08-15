
'use client';

import Link from 'next/link';
import { Bot, Home, PackagePlus, ShoppingCart, Store, LifeBuoy, LayoutDashboard, User } from 'lucide-react';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const pathname = usePathname();
  const [user, loading] = useAuthState(auth);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, admin: true },
    { href: '/admin/add-product', label: 'Add Product', icon: PackagePlus, admin: true },
    { href: '/checkout', label: 'Checkout', icon: ShoppingCart },
    { href: '/support/tickets', label: 'Support', icon: LifeBuoy, admin: true },
  ];
  
  const handleSignOut = () => {
    auth.signOut();
  }

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
          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.filter(l => !l.admin).map((link) => (
              <Button
                key={link.href}
                variant={pathname === link.href ? 'secondary' : 'ghost'}
                asChild
              >
                <Link href={link.href} className="flex items-center gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                   <Avatar className="h-8 w-8">
                    {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                    <AvatarFallback>{user?.email?.[0].toUpperCase() || <User/>}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {user ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LifeBuoy className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                   <DropdownMenuItem asChild>
                      <Link href="/auth">
                        <User className="mr-2 h-4 w-4" />
                        <span>Login / Sign Up</span>
                      </Link>
                    </DropdownMenuItem>
                )}
                
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
