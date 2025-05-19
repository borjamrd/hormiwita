
"use client";

import type { ChatMessage } from '@/store/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';
import Image from 'next/image'; // Import next/image

interface ChatAvatarProps {
  role: ChatMessage['role'];
}

export function ChatAvatar({ role }: ChatAvatarProps) {
  return (
    <Avatar className="h-8 w-8">
      {role === 'user' ? (
        <>
          {/* <AvatarImage src={"https://placehold.co/40x40.png"} /> */}
          <AvatarFallback className="bg-muted-foreground/20">
            <User className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </>
      ) : (
        <>
          <AvatarImage src="/hormiguita_head_logo.png" alt="hormigüita assistant" />
          <AvatarFallback className="bg-muted-foreground/20">
            <Bot className="h-5 w-5 text-accent" /> {/* Fallback if image fails */}
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );
}
