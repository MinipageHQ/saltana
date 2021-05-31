import Stripe from 'stripe'
import { createInstance } from "@saltana/sdk";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { });

const adminApi = createInstance({
  apiKey: process.env.SALTANA_CORE_SECRET_API_KEY,
});

const admin = require('../lib/admin-sdk');

export async function createIntent({ assetId }) {
  // TODO: cache this - @b

  const asset = await adminApi.assets.read(assetId)
  if (!asset) {
    throw new Error('NOT_FOUND')
  }

 const paymentIntent = await stripe.paymentIntents.create({
  amount: asset.price,
  currency: 'usd',
  payment_method_types: ['card'],
  setup_future_usage: 'on_session',
  statement_descriptor: 'SALTANACREATOR',
  metadata: {
    asset_id: asset.id,
    origin: 'saltana.com'
  }
});

const admin = require('../lib/admin-sdk');

export async function createIntent({ assetId }) {
  // TODO: cache this - @b

  const asset = await adminApi.assets.read(assetId)

 const paymentIntent = await stripe.paymentIntents.create({
  amount: 1099,
  currency: 'usd',
  payment_method_types: ['card'],
  setup_future_usage: 'on_session',
  statement_descriptor: 'SALTANACREATOR',
  metadata: {
    asset_id: asset.id,
    origin: 'saltana.com'
  }
});


}
import { createInstance } from "@saltana/sdk";
import Stripe from 'stripe'

const stripe = new Stripe('sk_test_...', { });

const apiVersion = "2019-05-20";

const adminApi = createInstance({
  apiKey,
  apiVersion,
  //apiHost,
  //apiPort,
  //apiProtocol,
});

async function getOrCreateCustomer({}) {


}
export async function createIntent({ assetId }) {
  // TODO: cache this - @b

  const asset = adminApi.assets.read(assetId)

 const paymentIntent = await stripe.paymentIntents.create({
  amount: 1099,
  currency: 'usd',
  payment_method_types: ['card'],
  setup_future_usage: 'on_session',
  statement_descriptor: 'SALTANACREATOR',
  metadata: {
    asset_id: Model,
    origin: 'saltana.com'
  }
});
}

export async function checkout({ assetId, stripeId }) {
  const asset = adminApi.assets.read(assetId)

  const transaction = adminApi.transactions.create({})

  const customer =
}
export async function handleRequest(request: Request): Promise<Response> {
  return new Response(`request method: ${ request.method }`)
}


/**
 * create
p}

}

async function getOrCreateCustomer({}) {


}
export async function createIntent({ assetId }) {
  // TODO: cache this - @b

  const asset = adminApi.assets.read(assetId)

 const paymentIntent = await stripe.paymentIntents.create({
  amount: 1099,
  currency: 'usd',
  payment_method_types: ['card'],
  setup_future_usage: 'on_session',
  statement_descriptor: 'SALTANACREATOR',
  metadata: {
    asset_id: Model,
    origin: 'saltana.com'
  }
});
}

export async function checkout({ assetId, stripeId }) {
  const asset = adminApi.assets.read(assetId)

  const transaction = adminApi.transactions.create({})

  const customer =
}
export async function handleRequest(request: Request): Promise<Response> {
	return new Response(`request method: ${ request.method }`)
}


/**
 * create
