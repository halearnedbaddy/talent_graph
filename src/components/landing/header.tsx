'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, LogOut } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <Zap className="h-6 w-6 text-foreground" />
          <span className="text-lg font-semibold text-foreground">Verve & Vigor</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {isUserLoading ? (
             <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-32" />
             </div>
          ) : user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/">Dashboard</Link>
              </Button>
              <Button onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
