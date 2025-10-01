import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  console.log('🔔 SUCCESS CALLBACK TRIGGERED');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      console.error('❌ No session_id in URL');
      return NextResponse.redirect(new URL('/dashboard?error=no_session', request.url));
    }

    console.log('📋 Session ID:', sessionId);
    console.log('🔍 Fetching session from Stripe...');

    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('✅ Session retrieved from Stripe');
    console.log('Payment status:', session.payment_status);
    console.log('Customer:', session.customer);
    console.log('Subscription:', session.subscription);

    if (session.payment_status !== 'paid') {
      console.error('❌ Payment not completed. Status:', session.payment_status);
      return NextResponse.redirect(new URL('/dashboard?error=payment_incomplete', request.url));
    }

    console.log('✅ Payment confirmed as PAID');

    const userId = session.metadata?.userId || session.client_reference_id;
    const subscriptionId = session.subscription as string;

    console.log('👤 User ID:', userId);
    console.log('📝 Subscription ID:', subscriptionId);

    if (!userId) {
      console.error('❌ No userId found');
      return NextResponse.redirect(new URL('/dashboard?error=no_user', request.url));
    }

    if (!subscriptionId) {
      console.error('❌ No subscriptionId found');
      return NextResponse.redirect(new URL('/dashboard?error=no_subscription', request.url));
    }

    console.log('🔍 Checking if subscription already exists in database...');

    // Verificar si ya existe
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (existingSubscription) {
      console.log('ℹ️ Subscription already exists in database (avoiding duplicate)');
      return NextResponse.redirect(new URL('/dashboard?success=true&existing=true', request.url));
    }

    console.log('🔍 Fetching full subscription details from Stripe...');

    // Obtener detalles completos de la subscripción
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('✅ Subscription details retrieved');
    console.log('Status:', subscription.status);
    console.log('Current period end:', new Date(subscription.current_period_end * 1000));

    console.log('💾 Attempting to save to database...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

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

    console.log('🎉🎉🎉 SUCCESS! Subscription saved to Neon database!');
    console.log('Database record ID:', savedSubscription.id);
    console.log('User ID:', savedSubscription.userId);
    console.log('Plan:', savedSubscription.plan);
    console.log('Status:', savedSubscription.status);

    return NextResponse.redirect(new URL('/dashboard?success=true&saved=true', request.url));

  } catch (error: any) {
    console.error('❌❌❌ CRITICAL ERROR in success callback:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    return NextResponse.redirect(new URL('/dashboard?error=save_failed&details=' + encodeURIComponent(error.message), request.url));
  }
}