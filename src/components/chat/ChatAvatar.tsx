"use client";

import type { ChatMessage } from '@/store/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';

interface ChatAvatarProps {
  role: ChatMessage['role'];
}

export function ChatAvatar({ role }: ChatAvatarProps) {
  return (
    <Avatar className="h-8 w-8">
      {/* Placeholder for actual images if available */}
      {/* <AvatarImage src={role === 'user' ? "https://placehold.co/40x40.png" : "https://placehold.co/40x40.png"} /> */}
      <AvatarFallback className="bg-muted-foreground/20">
        {role === 'user' ? (
          <User className="h-5 w-5 text-primary" />
        ) : (
          <Bot className="h-5 w-5 text-accent" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
