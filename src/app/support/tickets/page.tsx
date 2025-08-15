
'use client';

import { useState, useEffect } from 'react';
import { app } from '@/lib/firebase';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import type { Ticket } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper function to add dummy data. Run this once from another component if needed.
// async function addDummyTickets() {
//   const db = getFirestore(app);
//   const ticketsRef = collection(db, 'tickets');
//   const dummyTickets = [
//     { subject: 'Login Issue', description: 'Cannot log into my account.', priority: 'high', status: 'open', userId: 'user1' },
//     { subject: 'Order not received', description: 'My order #12345 has not arrived.', priority: 'high', status: 'open', userId: 'user2' },
//     { subject: 'Feature Request', description: 'Please add a dark mode.', priority: 'low', status: 'open', userId: 'user3' },
//     { subject: 'Payment Failed', description: 'My card was declined.', priority: 'medium', status: 'open', userId: 'user4' },
//     { subject: 'Broken Link', description: 'The link on the homepage is broken.', priority: 'low', status: 'closed', userId: 'user5' },
//   ];
//   for (const ticket of dummyTickets) {
//     await addDoc(ticketsRef, {
//       ...ticket,
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now(),
//     });
//   }
//   console.log('Added dummy tickets.');
// }


export default function SupportTicketsPage() {
  const [highPriorityTickets, setHighPriorityTickets] = useState<Ticket[]>([]);
  const [mediumPriorityTickets, setMediumPriorityTickets] = useState<Ticket[]>([]);
  const [lowPriorityTickets, setLowPriorityTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore(app);
    const ticketsRef = collection(db, 'tickets');
    const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
    const unsubscribes: (() => void)[] = [];
    
    // For optimal performance, it's recommended to store priority as a number
    // (e.g., 1 for high, 2 for medium, 3 for low) and use a single query with orderBy.
    // Since we are ordering by string values, we must fetch each priority level separately.
    priorities.forEach(priority => {
      const q = query(
        ticketsRef,
        where('status', '==', 'open'),
        where('priority', '==', priority),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        
        if (priority === 'high') setHighPriorityTickets(tickets);
        if (priority === 'medium') setMediumPriorityTickets(tickets);
        if (priority === 'low') setLowPriorityTickets(tickets);
        
        setLoading(false);
      }, (error) => {
        console.error(`Error fetching ${priority} priority tickets:`, error);
        setLoading(false);
      });
      
      unsubscribes.push(unsubscribe);
    });

    // Cleanup subscriptions on component unmount
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const allTickets = [...highPriorityTickets, ...mediumPriorityTickets, ...lowPriorityTickets];

  const getPriorityBadgeVariant = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-center mb-8">
          Open Support Tickets
        </h1>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : allTickets.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg">No open tickets found.</p>
        ) : (
          <div className="space-y-6">
            {allTickets.map(ticket => (
              <Card key={ticket.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-xl">{ticket.subject}</CardTitle>
                    <Badge variant={getPriorityBadgeVariant(ticket.priority)} className="capitalize">
                      {ticket.priority}
                    </Badge>
                  </div>
                   <CardDescription>
                    Opened on: {ticket.createdAt.toDate().toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{ticket.description}</p>
                </CardContent>
                 <CardFooter>
                  <p className="text-xs text-muted-foreground">User ID: {ticket.userId}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
