'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Package, Truck } from 'lucide-react';

const mockCart = [
  { id: '1', name: 'Astro-Tech Hoodie', price: 59.99, quantity: 1, size: 'L' },
  { id: '2', name: 'Cyber-Synth Keyboard', price: 129.99, quantity: 1, size: '' },
];

const subtotal = mockCart.reduce((acc, item) => acc + item.price * item.quantity, 0);

export default function CheckoutPage() {
  const [postalCode, setPostalCode] = useState('');
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const { toast } = useToast();

  const handleCalculateShipping = () => {
    if (postalCode.trim().length > 3) {
      const cost = parseFloat((Math.random() * 15 + 5).toFixed(2));
      setShippingCost(cost);
      toast({
        title: 'Shipping Calculated',
        description: `Standard shipping to ${postalCode} is $${cost}.`,
      });
    } else {
      toast({
        title: 'Invalid Postal Code',
        description: 'Please enter a valid postal code.',
        variant: 'destructive',
      });
    }
  };

  const total = shippingCost !== null ? subtotal + shippingCost : subtotal;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-bold font-headline text-center mb-8">Checkout</h1>
      <div className="grid md:grid-cols-2 gap-12">
        <div className="md:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2"><Package className="h-6 w-6 text-primary"/>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {mockCart.map(item => (
                  <li key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.size && `Size: ${item.size}`}</p>
                    </div>
                    <p className="font-mono">${item.price.toFixed(2)}</p>
                  </li>
                ))}
              </ul>
              <Separator className="my-6" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-mono">{shippingCost !== null ? `$${shippingCost.toFixed(2)}` : 'Calculated at next step'}</span>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1 space-y-8">
           <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><Truck className="h-6 w-6 text-primary"/>Shipping</CardTitle>
                <CardDescription>Calculate shipping costs for your order.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <Label htmlFor="postal-code">Postal Code</Label>
                        <Input id="postal-code" placeholder="e.g. 90210" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                    </div>
                    <Button onClick={handleCalculateShipping} className="self-end w-full">Calculate</Button>
                </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Payment Information</CardTitle>
              <CardDescription>Enter your payment details to complete the purchase.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input id="card-number" placeholder="**** **** **** ****" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry-date">Expiry Date</Label>
                    <Input id="expiry-date" placeholder="MM / YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="***" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="name-on-card">Name on Card</Label>
                  <Input id="name-on-card" placeholder="John Doe" />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button size="lg" className="w-full bg-accent hover:bg-accent/90" disabled={shippingCost === null}>
                Pay ${total.toFixed(2)}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
