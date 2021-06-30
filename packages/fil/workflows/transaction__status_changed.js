// Workflows to be used with Saltana API.
// Please refer to the Docs for more info: https://saltana.com/docs/command/workflows

// '`${computed.var}`' template strings can be used in plain strings in Workflows,
// and will be evaluated during run.
// Please note that backticks ` are not needed in endpointUri nor in endpointHeaders,
// where only strings are expected and parsed as template strings anyway.

// You can also use Workflow context for easier maintenance
// with environment variables as in `${env.SOME_VAR}`, SOME_VAR being set via Config API

/* eslint-disable no-template-curly-in-string */
module.exports = {
  sendEmailToTakerWhenTransactionStatusChanged: {
    name: '[Email] Transaction update to taker',
    description:
      'Send an email to taker when a transaction is accepted or refused by owner',
    event: 'transaction__status_changed',
    context: ['saltana'],
    computed: {
      missingEnvVariables: '!env.SALTANA_INSTANT_WEBSITE_URL',
      // fallback to empty strings for email content
      transactionId: 'transaction.id',
      ownerName: 'owner.displayName || ""',
      takerName: 'taker.displayName || ""',
      assetName: '_.get(transaction, "assetSnapshot.name", "")',
      toName: 'taker.displayName || ""',
      toEmail: 'taker.email',
    },
    run: [
      {
        name: 'messages',
        stop: 'computed.missingEnvVariables',
        endpointMethod: 'GET',
        endpointUri: '/messages?topicId=${computed.transactionId}',
      },
      {
        name: 'acceptedByOwnerEmail',
        endpointMethod: 'POST',
        computed: {
          isEmptyConversation:
            '!responses.messages.results.filter(message => !message.metadata.isHiddenMessage).length',
          conversationLink:
            '`${env.SALTANA_INSTANT_WEBSITE_URL}/i/${responses.messages.results[0].conversationId}`',
        },
        stop: '!computed.toEmail || computed.isEmptyConversation',
        skip: 'transaction.status !== "accepted"',
        endpointUri: '/emails/send-template',
        endpointPayload: {
          name: '"transactionAcceptedByOwnerToTaker"',
          data: {
            assetName: 'computed.assetName',
            ownerName: 'computed.ownerName',
            takerName: 'computed.takerName',
            conversationLink: 'computed.conversationLink',
          },
          locale: `"${locale}"`,
          to: {
            address: 'computed.toEmail',
            name: 'computed.toName',
          },
        },
      },
      {
        name: 'refusedByOwnerEmail',
        endpointMethod: 'POST',
        computed: {
          isEmptyConversation:
            '!responses.messages.results.filter(message => !message.metadata.isHiddenMessage).length',
          conversationLink:
            '`${env.SALTANA_INSTANT_WEBSITE_URL}/i/${responses.messages.results[0].conversationId}`',
        },
        stop: '!computed.toEmail || computed.isEmptyConversation',
        skip: `
            transaction.status !== "cancelled" ||
            transaction.cancellationReason !== "refusedByOwner"
          `,
        endpointUri: '/emails/send-template',
        endpointPayload: {
          name: '"transactionRefusedByOwnerToTaker"',
          data: {
            ownerName: 'computed.ownerName',
            assetName: 'computed.assetName',
            takerName: 'computed.takerName',
            conversationLink: 'computed.conversationLink',
          },
          locale: `"${locale}"`,
          to: {
            address: 'computed.toEmail',
            name: 'computed.toName',
          },
        },
      },
    ],
  },

  sendEmailToOwnerWhenTransactionStatusChanged: {
    name: '[Email] Transaction update to owner',
    description:
      'Send email to owner when transaction is accepted or refused by taker',
    event: 'transaction__status_changed',
    context: ['saltana'],
    computed: {
      missingEnvVariables: '!env.SALTANA_INSTANT_WEBSITE_URL',
      // fallback to empty strings for email content
      transactionId: 'transaction.id',
      takerName: 'taker.displayName || ""',
      ownerName: 'owner.displayName || ""',
      assetName: '_.get(transaction, "assetSnapshot.name", "")',
      toName: 'owner.displayName || ""',
      toEmail: 'owner.email',
    },
    run: [
      {
        name: 'messages',
        stop: 'computed.missingEnvVariables',
        endpointMethod: 'GET',
        endpointUri: '/messages?topicId=${computed.transactionId}',
      },
      // accepted
      {
        name: 'acceptedByTakerEmail',
        endpointMethod: 'POST',
        computed: {
          isEmptyConversation:
            '!responses.messages.results.filter(message => !message.metadata.isHiddenMessage).length',
          conversationLink:
            '`${env.SALTANA_INSTANT_WEBSITE_URL}/i/${responses.messages.results[0].conversationId}`',
        },
        stop: '!computed.toEmail || computed.isEmptyConversation',
        skip: 'transaction.status !== "validated"',
        endpointUri: '/emails/send-template',
        endpointPayload: {
          name: '"transactionAcceptedByTakerToOwner"',
          data: {
            takerName: 'computed.takerName',
            assetName: 'computed.assetName',
            ownerName: 'computed.ownerName',
            conversationLink: 'computed.conversationLink',
          },
          locale: `"${locale}"`,
          toEmail: 'computed.toEmail',
          toName: 'computed.toName',
        },
      },
      // refused
      {
        name: 'messages',
        stop: `
            transaction.status !== "cancelled" ||
            !["refusedByTaker", "withdrawn"].includes(transaction.cancellationReason)
          `,
        endpointMethod: 'GET',
        endpointUri: '/messages?topicId=${computed.transactionId}',
      },
      {
        name: 'refusedByTakerEmail',
        stop: '!computed.toEmail || computed.isEmptyConversation',
        endpointMethod: 'POST',
        computed: {
          isEmptyConversation:
            '!responses.messages.results.filter(message => !message.metadata.isHiddenMessage).length',
          conversationLink:
            '`${env.SALTANA_INSTANT_WEBSITE_URL}/i/${responses.messages.results[0].conversationId}`',
        },
        endpointUri: '/emails/send-template',
        endpointPayload: {
          name: '"transactionRefusedByTakerToOwner"',
          data: {
            takerName: 'computed.takerName',
            assetName: 'computed.assetName',
            conversationLink: 'computed.conversationLink',
            ownerName: 'computed.ownerName',
          },
          locale: `"${locale}"`,
          toEmail: 'computed.toEmail',
          toName: 'computed.toName',
        },
      },
    ],
  },

  sendNotificationWhenNewMessage: {
    name: 'New message notification',
    description: 'Send a notification via Signal',
    event: 'message__created',
    context: ['saltana'],
    computed: {
      messageId: '_.get(message, "id")',
      receiverId: '_.get(message, "receiverId")',
    },
    run: [
      {
        stop: '!computed.receiverId',
        endpointMethod: 'POST',
        endpointUri: '/signal',
        endpointPayload: {
          message: {
            id: 'computed.messageId',
          },
          destination: 'computed.receiverId',
          event: '"newMessage"',
        },
      },
    ],
  },

  completeTransactions: {
    name: 'Complete transactions',
    description: `
        Trigger completion transition of validated transactions.
        Completed transactions won't block assets removal.
      `,
    event: 'transaction__status_changed',
    run: [
      {
        endpointMethod: 'POST',
        stop: 'transaction.status !== "validated"',
        endpointUri: '/transactions/${transaction.id}/transitions',
        endpointPayload: {
          name: '"complete"',
        },
      },
    ],
  },

  captureStripePaymentIntent: {
    name: 'Capture Stripe payment intent',
    description: `
        When the owner accepts the transaction, capture the payment intent so the money is effectively taken from the taker
      `,
    event: 'transaction__status_changed',
    computed: {
      stripePaymentIntentId:
        '_.get(transaction, "platformData.stripePaymentIntentId")',
      currencyDecimal: '_.get(transaction, "platformData.currencyDecimal", 2)',
    },
    run: [
      {
        endpointMethod: 'POST',
        stop: '!computed.stripePaymentIntentId || transaction.status !== "validated"',
        endpointUri: '/integrations/stripe/request',
        endpointPayload: {
          method: '"paymentIntents.capture"',
          args: [
            'computed.stripePaymentIntentId',
            {
              amount_to_capture:
                'transaction.takerAmount * Math.pow(10, computed.currencyDecimal)',
              application_fee_amount:
                'transaction.platformAmount * Math.pow(10, computed.currencyDecimal) || undefined',
            },
          ],
        },
      },
    ],
  },

  onStripePaymentIntentCancellation: {
    name: 'On Stripe payment intent cancellation',
    description: `
        When a payment intent is cancelled because the uncapture duration max limit is exceeded,
        the associated transaction must be cancelled too.
        Otherwise the transaction owner can still accept it.
      `,
    event: 'stripe_payment_intent.canceled',
    computed: {
      paymentIntentId: '_.get(metadata, "data.object.id")',
      transactionId: '_.get(metadata, "data.object.metadata.transactionId")',
    },
    run: [
      {
        stop: '!computed.paymentIntentId || !computed.transactionId',
        endpointMethod: 'POST',
        endpointUri: '/transactions/${computed.transactionId}/transitions',
        endpointPayload: {
          name: '"cancel"',
          data: {
            cancellationReason: '"forceCancel"',
          },
        },
      },
    ],
  },

  onStripeCheckoutCompletion: {
    name: 'On Stripe completed checkout session',
    description: `
        This event is created after a completed checkout session (notification via Stripe webhook).
        The objective of this workflow is to retrieve the linked transaction to the session payment intent via metadata
        and trigger the transition 'confirmAndPay' as taker has paid.
      `,
    event: 'stripe_checkout.session.completed',
    context: ['saltana'],
    computed: {
      paymentIntentId: '_.get(metadata, "data.object.payment_intent")',
    },
    run: [
      {
        stop: '!computed.paymentIntentId',
        name: 'paymentIntent',
        endpointMethod: 'POST',
        endpointUri: '/integrations/stripe/request',
        endpointPayload: {
          method: '"paymentIntents.retrieve"',
          args: 'computed.paymentIntentId',
        },
      },
      {
        stop: '!computed.transactionId',
        computed: {
          transactionId:
            '_.get(responses.paymentIntent, "metadata.transactionId")',
        },
        name: 'transaction',
        endpointMethod: 'GET',
        endpointUri: '/transactions/${computed.transactionId}',
      },
      {
        computed: {
          transaction: 'responses.transaction',
        },
        endpointMethod: 'POST',
        endpointUri: '/messages',
        endpointPayload: {
          content: '" "',
          topicId: 'computed.transactionId',
          senderId: 'computed.transaction.takerId',
          receiverId: 'computed.transaction.ownerId',
        },
      },
      {
        endpointMethod: 'POST',
        endpointUri: '/transactions/${computed.transactionId}/transitions',
        endpointPayload: {
          name: '"confirmAndPay"',
        },
      },
    ],
  },
}
/* eslint-enable no-template-curly-in-string */
