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
