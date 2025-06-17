// src/components/chat/ChatInput.tsx
"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizontal } from 'lucide-react';

interface ChatInputProps {
  // Solo necesita saber qué hacer cuando se envía un mensaje y si está cargando
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  // El componente ahora maneja el estado del input internamente
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue?.trim() && !isLoading) {
      // Llama a la función del padre con el mensaje
      onSendMessage(inputValue);
      // Limpia su propio estado
      setInputValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <Input
        type="text"
        placeholder="Escribe tu mensaje..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={isLoading}
        className="flex-1"
        aria-label="Chat message input"
      />
      <Button type="submit" size="icon" disabled={isLoading || !inputValue?.trim()} aria-label="Send message">
        <SendHorizontal className="h-5 w-5" />
      </Button>
    </form>
  );
}