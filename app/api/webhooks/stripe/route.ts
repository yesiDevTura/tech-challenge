import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook received');
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ No signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Event verified:', event.type);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Manejar el evento
  try {
    if (event.type === 'checkout.session.completed') {
      console.log('💳 Processing checkout.session.completed');
      
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Session data:', {
        id: session.id,
        subscription: session.subscription,
        customer: session.customer,
        metadata: session.metadata,
        client_reference_id: session.client_reference_id
      });

      // Obtener user ID
      const userId = session.metadata?.userId || session.client_reference_id;
      
      if (!userId) {
        console.error('❌ No user ID found in session');
        return NextResponse.json({ error: 'No user ID' }, { status: 400 });
      }

      console.log('👤 User ID found:', userId);

      // Verificar subscription ID
      const subscriptionId = session.subscription as string;
      
      if (!subscriptionId) {
        console.error('❌ No subscription ID in session');
        return NextResponse.json({ error: 'No subscription ID' }, { status: 400 });
      }

      console.log('📝 Retrieving subscription from Stripe...');

      // Obtener la subscripción completa de Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      console.log('✅ Subscription retrieved:', subscription.id, 'Status:', subscription.status);

      console.log('💾 Saving to database...');

      // Guardar en base de datos
      const savedSubscription = await prisma.subscription.create({
        data: {
          userId: userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscriptionId,
          plan: 'pro',
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });

      console.log('✅ Subscription saved to database:', savedSubscription.id);
      console.log(`🎉 SUCCESS: Subscription created for user ${userId}`);
      
      return NextResponse.json({ 
        received: true, 
        saved: true,
        subscriptionId: savedSubscription.id 
      });
    }

    console.log('ℹ️ Event type not handled:', event.type);
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error('❌ ERROR processing webhook:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}