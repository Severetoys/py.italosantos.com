
"use client";

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function WhatsAppButton() {
  const pathname = usePathname();
  const whatsappUrl = `https://wa.me/italosantos`;
  
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2 group",
        )}
        aria-label="Fale conosco no WhatsApp"
    >
         <div className="order-1 text-lg font-bold text-white">
            WHATSAPP
        </div>
        <div
            className={cn(
                "relative h-16 w-16 order-2 rounded-full bg-black border border-gray-700 flex items-center justify-center shadow-neon-white"
            )}
        >
            <img 
                src="/Icon-Whatsapp.svg" 
                alt="WhatsApp"
                width={32}
                height={32}
                style={{ objectFit: 'contain', filter: 'grayscale(1) brightness(2)' }}
                className="rounded-full"
            />
        </div>
    </a>
  );
}
