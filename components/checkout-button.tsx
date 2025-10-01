'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const { user, isLoading } = useUser();

  const handleCheckout = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.sub,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No checkout URL received');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={loading || !user}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        'Upgrade to Pro'
      )}
    </Button>
  );
}