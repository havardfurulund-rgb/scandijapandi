export const prerender = false; // Tvinger Astro til å kjøre denne live på serveren (SSR) i stedet for statisk

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { sanityClient } from 'sanity:client';

// Initialiserer Stripe med den hemmelige nøkkelen fra Netlify-miljøet ditt
const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', 
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { slug, ref } = body;

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Manglende produkt-slug' }), { status: 400 });
    }

    // 1. Hent produktdetaljer og Stripe Price ID direkte fra Sanity
    const product = await sanityClient.fetch(
      `*[_type == "product" && slug.current == $slug][0]{
        title,
        stripePriceId,
        price
      }`,
      { slug }
    );

    if (!product || !product.stripePriceId) {
      return new Response(JSON.stringify({ error: 'Produktet eller Stripe Price ID ble ikke funnet i Sanity' }), { status: 404 });
    }

    // 2. Opprett Stripe Checkout-sesjon
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.stripePriceId, // Kobler direkte til riktig pris i Stripe
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Sender kunden tilbake til suksess-siden, tar med kurator-ref hvis den finnes
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}${ref ? `&ref=${ref}` : ''}`,
      cancel_url: `${request.headers.get('origin')}/#collection`,
      // Legger ved metadata så du ser hvem som solgte hva inne i Stripe-panelet ditt
      metadata: {
        curator_ref: ref || 'Direkte salg (ingen kurator)',
        product_title: product.title
      },
    });

    // 3. Returner Stripe-URL-en som forsiden videresender til
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Feil i Stripe Checkout API:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
