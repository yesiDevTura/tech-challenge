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
    const userName = session.customer_details?.name || session.metadata?.userName || 'User'; // ← AGREGAR
    
    console.log('👤 User ID:', userId);
    console.log('👤 User Name:', userName); // ← AGREGAR
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

    const existingSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (existingSubscription) {
      console.log('ℹ️ Subscription already exists in database (avoiding duplicate)');
      return NextResponse.redirect(new URL('/dashboard?success=true&existing=true', request.url));
    }

    console.log('🔍 Fetching full subscription details from Stripe...');

    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
    console.log('✅ Subscription details retrieved');
    console.log('Status:', subscription.status);
    console.log('Subscription object:', JSON.stringify(subscription, null, 2));

    console.log('💾 Attempting to save to database...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    let periodEndDate: Date | null = null;
    
    if (subscription.current_period_end) {
      periodEndDate = new Date(subscription.current_period_end * 1000);
      console.log('Period end date:', periodEndDate);
    } else {
      console.warn('⚠️ No current_period_end in subscription, using null');
    }

    const savedSubscription = await prisma.subscription.create({
      data: {
        userId: userId,
        userName: userName,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        plan: 'pro',
        status: subscription.status,
        currentPeriodEnd: periodEndDate,
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
    
    return NextResponse.redirect(new URL('/dashboard?error=save_failed&details=' + encodeURIComponent(error.message), request.url));
  }
}