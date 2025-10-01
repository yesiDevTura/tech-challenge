import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      console.error('❌ No session_id provided');
      return NextResponse.redirect(new URL('/dashboard?error=no_session', request.url));
    }

    console.log('✅ Processing payment success for session:', sessionId);

    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Session retrieved:', session.id, 'Payment status:', session.payment_status);

    if (session.payment_status !== 'paid') {
      console.error('❌ Payment not completed');
      return NextResponse.redirect(new URL('/dashboard?error=payment_failed', request.url));
    }

    const userId = session.metadata?.userId || session.client_reference_id;
    const subscriptionId = session.subscription as string;

    if (!userId || !subscriptionId) {
      console.error('❌ Missing userId or subscriptionId');
      return NextResponse.redirect(new URL('/dashboard?error=missing_data', request.url));
    }

    console.log('👤 User ID:', userId);
    console.log('📝 Subscription ID:', subscriptionId);

    // Obtener la subscripción de Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('✅ Subscription retrieved:', subscription.status);

    // Verificar si ya existe la subscripción en la DB
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (existingSubscription) {
      console.log('ℹ️ Subscription already exists in database');
      return NextResponse.redirect(new URL('/dashboard?success=true', request.url));
    }

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

    console.log('🎉 SUCCESS: Subscription saved to database:', savedSubscription.id);

    return NextResponse.redirect(new URL('/dashboard?success=true', request.url));

  } catch (error: any) {
    console.error('❌ ERROR processing payment success:', error);
    console.error('Error message:', error.message);
    return NextResponse.redirect(new URL('/dashboard?error=processing_failed', request.url));
  }
}