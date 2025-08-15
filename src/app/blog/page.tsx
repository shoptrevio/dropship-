
'use client';

import { useState, useEffect } from 'react';
import { app } from '@/lib/firebase';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Define a type for our blog post
type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: any;
};

// A helper function to add dummy data. Run this once from a component if needed.
async function addDummyPosts() {
  const db = getFirestore(app);
  const postsRef = collection(db, 'posts');
  for (let i = 1; i <= 25; i++) {
    await addDoc(postsRef, {
      title: `Blog Post ${i}`,
      content: `This is the content for blog post number ${i}. It's part of a demonstration of Firestore pagination.`,
      createdAt: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000), // Stagger the dates
    });
  }
  console.log('Added 25 dummy posts.');
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const POSTS_LIMIT = 10;

  const fetchPosts = async () => {
    if (!hasMore || loading) return;
    setLoading(true);

    const db = getFirestore(app);
    const postsRef = collection(db, 'posts');
    let q;

    if (lastVisible) {
      q = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(POSTS_LIMIT)
      );
    } else {
      q = query(postsRef, orderBy('createdAt', 'desc'), limit(POSTS_LIMIT));
    }

    try {
      const documentSnapshots = await getDocs(q);
      const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      
      const newLastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(newLastVisible);
      
      if (documentSnapshots.docs.length < POSTS_LIMIT) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching posts: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-center mb-8">
          Our Blog
        </h1>
        <div className="space-y-8">
          {posts.map(post => (
            <Card key={post.id} className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline">{post.title}</CardTitle>
                <CardDescription>
                  {post.createdAt?.toDate().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{post.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          {loading && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}
          {!loading && hasMore && (
            <Button onClick={fetchPosts} variant="outline">Load More</Button>
          )}
          {!hasMore && (
            <p className="text-muted-foreground">You've reached the end!</p>
          )}
        </div>
      </div>
    </div>
  );
}
