export const prerender = false; // Tvinger Netlify til å kjøre denne live på serveren

import Stripe from 'stripe';
import { sanityClient } from 'sanity:client';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { slug, ref } = body;

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Manglende produkt-slug' }), { status: 400 });
    }

    // Henter produktet fra Sanity
    const product = await sanityClient.fetch(
      `*[_type == "product" && slug.current == $slug][0]{
        title,
        stripePriceId,
        price
      }`,
      { slug }
    );

    if (!product || !product.stripePriceId) {
      return new Response(JSON.stringify({ error: 'Produkt eller Stripe Price ID ikke funnet i Sanity' }), { status: 404 });
    }

    // Oppretter Stripe Checkout-sesjon
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}${ref ? `&ref=${ref}` : ''}`,
      cancel_url: `${request.headers.get('origin')}/#collection`,
      metadata: {
        curator_ref: ref || 'Direkte salg',
        product_title: product.title
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stripe API feil:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
