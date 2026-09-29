# Microservicio de Pagos (Stripe)

## Rutas principales implementadas

- **POST `/payments/create-payment-session`**
  Crea una Checkout Session en Stripe.
  Body requerido:
  ```json
  {
    "orderId": "ord-1",
    "currency": "usd",
    "items": [
      { "name": "Producto 1", "price": 20, "quantity": 1 }
    ]
  }
  ```

- **POST `/payments/webhook`**
  Ruta pública para que Stripe envíe notificaciones (por ejemplo, cuando un cobro es exitoso: `charge.succeeded`). Valida la firma del evento mediante la cabecera `stripe-signature` y usa el cuerpo de la petición en crudo (`rawBody`).
