
'use client';

import { useState, useEffect } from 'react';
import { app } from '@/lib/firebase';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

// This is a mock user. In a real app, you'd get this from your auth state.
const mockUser = {
  uid: 'user' + Date.now(),
  displayName: 'Guest',
};

type ChatMessage = {
  id: string;
  text: string;
  userId: string;
  createdAt: any;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const db = getFirestore(app);
    const q = query(collection(db, 'chat'), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const db = getFirestore(app);
    await addDoc(collection(db, 'chat'), {
      text: newMessage,
      userId: mockUser.uid,
      createdAt: serverTimestamp(),
    });

    setNewMessage('');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Real-time Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full p-4 border rounded-md">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{msg.userId.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{msg.userId === mockUser.uid ? 'You' : `User ${msg.userId.substring(0,4)}`}</p>
                      <p className="p-2 bg-muted rounded-lg">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
              />
              <Button type="submit" className="bg-accent hover:bg-accent/90">
                <Send/>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
