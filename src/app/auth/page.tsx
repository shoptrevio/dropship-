'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

type AuthStep = 'email' | 'password' | 'register';

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        setStep('password'); // Email exists, prompt for password
      } else {
        setStep('register'); // New email, prompt for registration
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Authentication Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'register' && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (step === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Account Created!", description: "Welcome to CommerceAI." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Signed In!", description: "Welcome back." });
      }
      // Redirect or update UI after successful auth
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Authentication Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: "Signed In with Google!", description: "Welcome." });
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Google Sign-In Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue with Email
            </Button>
          </form>
        );
      case 'password':
      case 'register':
        return (
          <form onSubmit={handleAuthAction} className="space-y-4">
             <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {step === 'register' && (
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === 'register' ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">
            {step === 'register' ? 'Create your Account' : 'Sign In or Sign Up'}
          </CardTitle>
          <CardDescription>
            {step === 'email' ? 'Enter your email to get started.' : 'Enter your password to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderStep()}
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
           </div>
           
           <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
             <Image src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" alt="Google logo" width={20} height={20} className="mr-2 h-5 w-5"/>
             Google
           </Button>
           
        </CardContent>
        <CardFooter className="flex-col items-start text-sm">
            {error && (
                <div className="flex items-center gap-2 text-destructive mb-4 p-2 bg-destructive/10 rounded-md">
                    <AlertTriangle className="h-4 w-4"/>
                    <span>{error}</span>
                </div>
            )}
            {step !== 'email' && (
                <Button variant="link" className="p-0 h-auto" onClick={() => {
                    setStep('email');
                    setError(null);
                    setPassword('');
                    setConfirmPassword('');
                }}>
                    Use a different email
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
