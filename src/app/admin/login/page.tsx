
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page now only serves to redirect to the admin root,
// where the layout will handle showing the login form if needed.
export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirecionando para o painel de admin...</p>
    </div>
  );
}
