# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

# 1 ✅ API client + AuthProvider (sesión)

- src/api/client.js (axios configurado)

### Explicación clave

withCredentials: true es CRUCIAL: permite que el navegador mande cookies al backend.  
Tu refreshToken está en cookie httpOnly → JS no lo puede leer → perfecto.  
Pero el browser sí la manda en cada request si withCredentials está activo.  
Access token en memoria: dura 15 min, cuando se vence, lo renovamos con /auth/refresh  
si refrescás la página, se borra la memoria → por eso “bootstrap” con refresh.

---

# 2 ✅ Auth Provider: src/auth/AuthProvider.jsx

- src/auth/AuthProvider.jsx (estado global de sesión + refresh)

### Explicacion clave

- Este componente crea un contexto global para:
- user
- accessToken
- loading de sesión
- funciones login, logout, bootstrap

---

# 3 ✅

- src/auth/oauth-callback.jsx real (finaliza Google OAuth)

# ORGANIZACION DEL PROYECTO FRONTEND

api/ → axios instance + funciones por módulo  
context/ → solo el contexto (sin lógica)  
providers/ → lógica del estado + bootstrap + interceptor  
hooks/ → hook cómodo useAuth()  
routes/ → wrappers para rutas protegidas  
pages/ → pantallas
