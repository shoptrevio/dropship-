'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Button } from './ui/button';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { handleChatMessage } from '@/app/actions';

type Message = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');

    startTransition(async () => {
      const result = await handleChatMessage(messageToSend);
      
      let aiResponseText = 'Sorry, something went wrong.';
      if (result.response) {
        aiResponseText = result.response;
      } else if (typeof result.error === 'string') {
        aiResponseText = result.error;
      }

      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResponseText,
      };
      setMessages((prev) => [...prev, aiMessage]);
    });
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        </Button>
      </div>
      {isOpen && (
        <Card className="fixed bottom-20 right-4 z-50 w-80 h-[500px] shadow-2xl flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
              </Avatar>
              Support Assistant
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2 text-sm',
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.sender === 'ai' && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 max-w-[80%]',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isPending && (
                <div className="flex justify-start gap-2">
                   <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <CardFooter className="p-2 border-t">
            <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={isPending}
              />
              <Button type="submit" size="icon" disabled={isPending || !input.trim()} className="bg-accent hover:bg-accent/90">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
