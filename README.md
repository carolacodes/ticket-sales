# Ticket Sales — Backend (Node.js + Express + MongoDB)

Backend para una aplicación web de venta de tickets para eventos, con autenticación basada en **JWT Access + Refresh Tokens**.

---

## Stack

- **Node.js + Express**
- **MongoDB Atlas + Mongoose**
- **JWT** (`jsonwebtoken`)
- **bcrypt** (hash de contraseñas)
- **cookie-parser** (cookies httpOnly)
- **cors** (CORS con credenciales)
- **zod** (validación de requests)

---

## Estructura del proyecto (MVC)

> El proyecto sigue un patrón MVC + separación por capas.

```
src/
controllers/
libs/
middlewares/
models/
routes/
schemas/
services/
app.js
db.js
index.js
```

### Responsabilidades

- **models/**: definición de colecciones (Mongoose Schemas).
- **services/**: acceso a datos (consultas a DB). _Sin lógica de negocio compleja._
- **controllers/**: lógica de negocio + orquestación (hashing, tokens, cookies, respuestas).
- **middlewares/**: validaciones, autenticación, autorización por roles.
- **libs/**: utilidades reutilizables (por ejemplo, firma/verificación de JWT).
- **schemas/**: validación de input con Zod.
- **routes/**: define endpoints y encadena middlewares + controllers.

---

## Variables de entorno

Crear un `.env` en `backend/`:

```env
PORT=3000
DB_CONNECTION= your_db_connection
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

---

## Auth (Access + Refresh Tokens)

### Conceptos

#### Se usan 2 tokens:

#### Access Token (corto)

- Duración corta (ej: 15m)

- Se envía en cada request protegido como:

- Authorization: Bearer <accessToken>

- Sirve para autenticar y autorizar acciones (ej: crear evento si role=ORGANIZER)

#### Refresh Token (largo)

- Duración larga (ej: 7d)

- Se guarda en una cookie httpOnly:

- el frontend no puede leerla desde JavaScript (más seguro)

- Sirve únicamente para pedir un nuevo access token cuando este vence

#

# SISTEMA DE PAGO

Tu sistema hoy hace esto:

el buyer crea una orden PENDING

```
después llama a /orders/:id/confirm
```

eso:

- descuenta stock
- marca la orden como PAID
- crea tickets
- manda email

(Eso te sirvió como MVP ✅)

## Pero con Mercado Pago, el flujo correcto cambia a:

- el buyer crea una orden PENDING
- el buyer inicia el pago
- Mercado Pago procesa el pago
- Mercado Pago te avisa por webhook
- recién ahí tu backend:
- confirma la orden
- descuenta stock
- crea tickets
- manda email

# 📌 Qué vamos a hacer

## Paso 1

Crear un service nuevo para la confirmación real de la orden.

```
Archivo nuevo:
src/services/orderConfirmation.service.js
```

Ese archivo va a contener toda la lógica transaccional que hoy está dentro de:

```
order.controller.js -> confirm()
```

## 🧠 ¿Por qué esto es importante?

Porque esa lógica la vas a necesitar desde dos lugares posibles:

Antes

```
order.controller.confirm
```

Después

```
payment.controller.webhook
```

Y no conviene duplicarla.

## Paso 2

Modificar order.controller.js para reutilizar ese service.

✅ Paso 2

Modificar order.controller.js para reutilizar ese service.

Antes

```
Tu confirm() tiene toda la lógica adentro.
```

Ahora

Lo vamos a simplificar mucho.

Importá el nuevo service:

```
import { confirmPaidOrder } from "../services/orderConfirmation.service.js";
```

Y reemplazá tu función confirm por esto:
(INSERTAR LINK QUE LLEVE AL CODIGO)

# Qué es un webhook

Un webhook es una notificación automática entre sistemas.
En vez de que tu backend esté preguntando todo el tiempo “¿ya pagó?”, “¿ya pagó?”, “¿ya pagó?”, Mercado Pago te avisa solo cuando ocurre un evento. Mercado Pago lo define justamente como un método para enviar información en tiempo real cuando ocurre un evento.

#

## En tu flujo de pago, el webhook sería esto:

Usuario paga en Checkout Pro  
→ Mercado Pago aprueba el pago  
→ Mercado Pago llama a tu endpoint /api/payments/webhook  
→ tu backend recibe esa notificación  
→ tu backend consulta el pago real en Mercado Pago  
→ tu backend confirma la order local  
→ genera tickets  
→ manda email

## Por qué el webhook es tan importante

Porque la pantalla de “pago aprobado” no es suficiente para confiar.  
La redirección del usuario sirve para UX, pero la confirmación real de backend debe venir por notificación y validación del pago. Además, Mercado Pago recomienda configurar notificaciones de pago y usar la API de Payments para validar el pago; incluso anunció la discontinuación de la Collections API para ese uso.

# Lo primero que vamos a hacer

## Paso 1: crear una función para obtener el pago real desde Mercado Pago

Esto es importante porque el webhook de Mercado Pago no siempre trae toda la información completa del pago.
Lo normal es que te llegue el identificador del pago y después vos consultes la API de pagos para obtener el estado real. Mercado Pago expone el endpoint para obtener un pago por su ID.

## Paso 2: crear la lógica reutilizable de confirmación de la order

Esto te lo recomiendo mucho porque ya tenés esa lógica en order.controller.confirm, pero ahí está demasiado pegada al endpoint HTTP.

Archivo nuevo

```
src/services/orderConfirmation.service.js
```

### Lo más importante de la funcion implementada en orderConfirmation.service.js

1. Usa transacción

```
const session = await mongoose.startSession();
session.startTransaction();
```

### Esto significa:

- o se hace todo bien, o no se hace nada

### Eso evita problemas como:

- bajar stock pero no crear tickets
- crear tickets pero no marcar la order como pagada

2. Si la orden ya está PAID, no rompe

```
if (order.status === "PAID") {
  await session.commitTransaction();
  return order;
}
```

Esto es muy importante para webhooks, porque a veces pueden llegar más de una vez.  
Entonces tu lógica queda idempotente: si ya la procesaste, no vuelve a emitir tickets ni duplicar stock.

3. Guarda referencia del pago

```
paymentProvider: "MERCADO_PAGO",
paymentRef: paymentData.paymentId || null,
```

Esto es clave para que en tu DB quede registrado:

- quién procesó el pago
- cuál fue el ID del pago en Mercado Pago

# LOGICA WEBHOOK (MERCADO PAGO)

# 1) ¿Para qué sirve getPaymentById?

Tu webhook hoy recibe una notificación como esta:

```
{
  "action": "payment.created",
  "data": { "id": "153648233399" },
  "type": "payment"
}
```

Eso no es todavía “la verdad completa del pago”.  
Es más bien un aviso que dice:

_“Che, pasó algo con el pago 153648233399”._

Entonces getPaymentById(paymentId) sirve para hacer esto:

## Paso real

- Mercado Pago te manda el aviso por webhook
- vos extraés el paymentId
- con getPaymentById(paymentId) le preguntás a Mercado Pago:
- cuál es el estado real
- cuál es el external_reference
- cuánto pagó
- quién pagó
- si está approved, pending, etc.

Por eso en tu webhook hacés:

```
const payment = await getPaymentById(paymentId);
```

y después:

```
if (payment.status !== "approved") {
  return res.sendStatus(200);
}
```

O sea, en simple:

```
getPaymentById es el paso que convierte:

“me llegó un aviso”

en

“confirmé con Mercado Pago que el pago existe y está aprobado”.
```

# 2) ¿Para qué sirve la firma del webhook?

La firma sirve para verificar que el webhook que llegó realmente fue enviado por Mercado Pago y no por cualquiera. Mercado Pago indica que las notificaciones Webhooks incluyen una clave/firma secreta para poder validar su autenticidad.

## Sin firma

Cualquiera podría intentar hacer un POST manual a:

```
POST /api/payments/webhook
```

y mandarte un body inventado diciendo:

```
{
  "type": "payment",
  "data": { "id": "123456" }
}
```

o incluso intentar simular que el pago fue aprobado.

## Con firma

Vos verificás que ese request:

- viene realmente de Mercado Pago
- no fue alterado
- corresponde a una notificación auténtica

# 3) ¿El header trae la clave secreta?

##### No exactamente.

- La clave secreta no te la manda Mercado Pago en cada request.
- La clave secreta la configurás vos y la guardás en tu backend,

##### por ejemplo en .env:

```
MP_WEBHOOK_SECRET=tu_clave_secreta
```

Lo que Mercado Pago envía en la notificación son headers, y entre ellos usa headers como x-signature y x-request-id para que vos puedas validar la autenticidad de la notificación con esa clave secreta. La documentación de Mercado Pago menciona específicamente la firma secreta en Webhooks y el uso de headers como x-signature; además, en sus docs de notificaciones también aparece x-request-id como parte del proceso de validación.

#### En simple:

- tu backend tiene la clave secreta
- Mercado Pago manda la firma en headers
- vos usás ambas cosas para validar

# 4) Entonces, ¿por qué hay que leer headers?

Porque la firma de seguridad viaja en los headers, no en el body.

#### Por eso después querés inspeccionar cosas como:

```
req.headers["x-signature"]
req.headers["x-request-id"]
```

Esos headers forman parte de la validación de autenticidad de la notificación según la documentación de Mercado Pago.

# 5) ¿Qué sería “construir la validación”?

Significa hacer una lógica tipo:

- leer el header x-signature
- leer el header x-request-id
- leer datos del request, como data.id o req.body
- usar tu MP_WEBHOOK_SECRET
- comparar lo que llegó con lo que debería dar si la notificación fuera auténtica

#### Si coincide → aceptás el webhook

#### Si no coincide → lo rechazás

# ETAPA DE SEGURIDAD

## Implementar la validación de la firma del webhook

##### Ese ya sería el paso de seguridad, no de funcionalidad básica.

### Qué vamos a hacer

- Vamos a agregar un helper que valide la firma del webhook antes de procesarlo.

##### Tu flujo quedará así:

- llega el webhook
- leemos headers y query
- validamos la firma
- solo si es válida seguimos con _getPaymentById(paymentId)_
- confirmamos la orden

### Para qué sirve cada pieza

## _getPaymentById_

Sirve para consultar el pago real en Mercado Pago. El webhook solo te avisa que pasó algo; la consulta del pago te da el estado oficial como approved, el external_reference, el monto, etc. Eso es exactamente lo que ya estás haciendo bien.

## _firma del webhook_

Sirve para verificar que el request lo mandó realmente Mercado Pago y no alguien intentando pegarle a tu endpoint con datos inventados.

## _headers_

En este caso, los headers traen la firma (x-signature) y el identificador de request (x-request-id). La clave secreta no viaja en el request; esa la guardás vos en .env.

### Archivo 1: crear el helper de validación

- Ruta del archivo

```
src/libs/mercadoPagoWebhook.js
```
