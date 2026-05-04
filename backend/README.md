# NOX Plataforma Social

## Despliegue Backend

1. Instala dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Configura tu base de datos y variables de entorno (`.env`):
   - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, etc.
3. Ejecuta migraciones y arranca el servidor:
   ```bash
   npm run migrate
   npm start
   ```
4. El WebSocket MyLink se integra automáticamente al arrancar el backend.

## Endpoints principales
- `/api/ideas` (ideas estructuradas, feed, versionado)
- `/api/users` (usuarios, perfil, edición)
- `/api/messages` (mensajería MyLink)
- `/api/follow` (seguir/dejar de seguir)
- `/api/explore` (explorar usuarios)
- `/api/comments` (comentarios en ideas)
- `/api/notifications` (notificaciones)
- `/api/badges` (logros)
- `/api/activitylog` (logs de actividad)

## Seguridad
- JWT para autenticación
- Validación de entradas y control de errores

## Escalabilidad
- Modular, listo para microservicios
- WebSocket y REST

---

# NOX Frontend

1. Instala dependencias:
   ```bash
   cd frontend
   npm install
   ```
2. Arranca el frontend:
   ```bash
   npm start
   ```
3. Configura la URL del backend en `.env` si es necesario.

## Funcionalidades
- Feed, perfil, exploración, mensajería, notificaciones, badges, comentarios, logs, loader animado, branding.
- Responsive, modo oscuro, animaciones, experiencia premium.

---

# Producción
- Usa `npm run build` en frontend para producción.
- Usa PM2, Docker o similar para backend.
- Configura HTTPS y variables de entorno seguras.

---

# ¡NOX está lista para operar y escalar!
