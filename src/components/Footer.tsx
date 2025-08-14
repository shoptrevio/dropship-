import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { Button } from './ui/button';

export function Footer() {
  return (
    <footer className="bg-card text-card-foreground mt-auto py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CommerceAI. All rights reserved.
        </p>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="ghost" size="icon" asChild>
            <Link href="#" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="#" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="#" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </footer>
  );
}
