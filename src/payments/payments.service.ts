import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config/envs'; 
import { PaymentSessionDto } from './dto/payment-session.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPaymentSession(dto: PaymentSessionDto) {
    const { orderId, currency, items } = dto;

    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_intent_data: {
        metadata: { orderId },
      },
      line_items: lineItems,
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });

    return session;
  }

  handleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    if (!signature || !rawBody) {
      throw new BadRequestException('Webhook Error: missing signature or body');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        envs.stripeEndpointSecret,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'invalid signature';
      throw new BadRequestException(`Webhook Error: ${msg}`);
    }

    switch (event.type) {
      case 'charge.succeeded': {
        const charge = event.data.object;
        this.logger.log(
          `Pago confirmado. orderId=${charge.metadata?.orderId} chargeId=${charge.id}`,
        );
        break;
      }
      default:
        this.logger.log(`Evento no manejado: ${event.type}`);
    }

    return { received: true };
  }
}