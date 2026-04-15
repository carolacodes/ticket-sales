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
