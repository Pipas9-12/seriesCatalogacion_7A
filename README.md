# Mi Serie — Catálogo personal

Aplicación web en español para administrar series, plataformas de streaming y valoraciones. Está construida con Next.js App Router, Prisma y PostgreSQL, y preparada para desplegarse en Vercel.

## Funcionalidades

- CRUD de series: nombre y plataforma.
- CRUD de plataformas: nombre.
- CRUD de valoraciones: plataforma, serie, puntaje de 1 a 10 y observación.
- Resumen con estadísticas, puntaje promedio y actividad reciente.
- Búsqueda en las listas y diseño adaptable a móvil.
- Persistencia en PostgreSQL administrado; no depende del almacenamiento efímero de Vercel.
- Las valoraciones requieren una serie y plataforma coincidentes. Al eliminar una serie se eliminan sus valoraciones; una plataforma con series asociadas no se puede borrar.

## Requisitos

- Node.js 18.18 o superior (recomendado Node.js 20 LTS).
- Una base de datos PostgreSQL accesible desde internet, por ejemplo Neon.

## Desarrollo local

1. Instala dependencias con `npm install`.
2. Copia `.env.example` a `.env` y configura `DATABASE_URL` con la URL de conexión de tu PostgreSQL. En Neon, utiliza la URL pooled con SSL.
3. Sincroniza el esquema: `npm run db:push`.
4. Inicia el servidor: `npm run dev` y abre `http://localhost:3000`.

La aplicación genera el cliente Prisma automáticamente durante `npm run build`.

## Despliegue en Vercel

1. Sube este proyecto a un repositorio Git y selecciónalo en Vercel como proyecto Next.js.
2. Crea una base PostgreSQL (Neon es una opción) y agrega `DATABASE_URL` en **Project Settings → Environment Variables** para Preview y Production.
3. Antes de usar la aplicación, aplica el esquema a la base de producción desde un entorno configurado con esa misma `DATABASE_URL`, ejecutando `npm run db:push`. Para futuras evoluciones del esquema, conviene crear migraciones Prisma y aplicar `prisma migrate deploy` como parte del proceso de despliegue.
4. Vercel ejecutará `npm run build`, que genera Prisma Client y compila Next.js. No se requiere servidor persistente.

> No subas `.env` al repositorio. Usa `.env.example` solo como plantilla.

## Acceso y seguridad

Esta primera versión no incluye inicio de sesión: quien pueda abrir la URL también puede consultar y modificar el catálogo. Para un despliegue personal, activa **Vercel Deployment Protection** o añade autenticación antes de compartir el enlace públicamente.
