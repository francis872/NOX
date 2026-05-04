// payments.js - Endpoints para pagos y suscripciones (Stripe)
const express = require('express');
const router = express.Router();

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
};

// Crear sesión de pago
router.post('/create-session', async (req, res) => {
  try {
    const { user_id, price_id, success_url, cancel_url } = req.body;
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Pagos no disponibles' });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: req.body.email,
      success_url,
      cancel_url,
      metadata: { user_id }
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Webhook para eventos de Stripe (suscripción, pago, etc.)
router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  // Aquí procesar eventos de Stripe
  res.json({ received: true });
});

module.exports = router;
