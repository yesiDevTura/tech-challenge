import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail } = body;

    // Validar que tenemos los datos necesarios
    if (!userId || !userEmail) {
      console.error('Missing userId or userEmail');
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    console.log('Creating checkout for user:', userId);

    // Crear sesión de checkout de Stripe
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
}