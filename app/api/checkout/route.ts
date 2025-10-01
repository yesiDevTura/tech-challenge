import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export const POST = withApiAuthRequired(async (request: NextRequest) => {
  try {
    const res = new NextResponse();
    const session = await getSession(request, res);
    
    if (!session?.user) {
      console.error('No user in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub as string;
    const userEmail = session.user.email as string;

    console.log('Creating checkout for user:', userId);

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.AUTH0_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.AUTH0_BASE_URL}/dashboard?canceled=true`,
      metadata: {
        userId: userId,
      },
    });

    console.log('Checkout session created:', checkoutSession.id);
    return NextResponse.json({ url: checkoutSession.url });
    
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout', details: error.message },
      { status: 500 }
    );
  }
});