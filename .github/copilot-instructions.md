# Mi Serie — Instrucciones del proyecto

- Aplicación Next.js App Router con TypeScript, Prisma y PostgreSQL.
- La interfaz y los mensajes para el usuario final deben mantenerse en español.
- Ejecutar `npm run db:push` con `DATABASE_URL` configurada para crear o actualizar el esquema local.
- Usar base de datos PostgreSQL administrada en Vercel; no introducir persistencia local/efímera.
- Las APIs CRUD están en `src/app/api/[resource]` y el esquema está en `prisma/schema.prisma`.
