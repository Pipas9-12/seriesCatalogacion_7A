import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const resources = ["platforms", "series", "ratings"] as const;
type Resource = (typeof resources)[number];

function isResource(value: string): value is Resource {
  return resources.includes(value as Resource);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function errorResponse(error: unknown) {
  console.error(error);
  return NextResponse.json(
    { error: "No se pudo completar. Comprueba que no existan elementos relacionados." },
    { status: 409 },
  );
}

export async function PUT(request: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await context.params;
  if (!isResource(resource)) return NextResponse.json({ error: "Recurso no válido." }, { status: 404 });

  try {
    const body = await request.json();
    if (resource === "platforms") {
      const name = text(body.name);
      if (!name) return NextResponse.json({ error: "Escribe el nombre de la plataforma." }, { status: 400 });
      return NextResponse.json(await prisma.platform.update({ where: { id }, data: { name } }));
    }
    if (resource === "series") {
      const name = text(body.name);
      const platformId = text(body.platformId);
      if (!name || !platformId) return NextResponse.json({ error: "La serie y su plataforma son obligatorias." }, { status: 400 });
      const existingRatings = await prisma.rating.count({ where: { seriesId: id } });
      if (existingRatings) {
        const rating = await prisma.rating.findFirst({ where: { seriesId: id } });
        if (rating && rating.platformId !== platformId) {
          return NextResponse.json({ error: "No se puede cambiar de plataforma una serie que ya tiene valoraciones." }, { status: 400 });
        }
      }
      return NextResponse.json(await prisma.series.update({ where: { id }, data: { name, platformId }, include: { platform: true } }));
    }
    const platformId = text(body.platformId);
    const seriesId = text(body.seriesId);
    const score = Number(body.score);
    const observation = text(body.observation);
    if (!platformId || !seriesId || !observation || !Number.isInteger(score) || score < 1 || score > 10) {
      return NextResponse.json({ error: "Completa todos los campos y usa un puntaje entre 1 y 10." }, { status: 400 });
    }
    const series = await prisma.series.findUnique({ where: { id: seriesId } });
    if (!series || series.platformId !== platformId) {
      return NextResponse.json({ error: "La plataforma debe coincidir con la plataforma de la serie." }, { status: 400 });
    }
    return NextResponse.json(await prisma.rating.update({
      where: { id },
      data: { platformId, seriesId, score, observation },
      include: { platform: true, series: true },
    }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await context.params;
  if (!isResource(resource)) return NextResponse.json({ error: "Recurso no válido." }, { status: 404 });

  try {
    if (resource === "platforms") await prisma.platform.delete({ where: { id } });
    else if (resource === "series") await prisma.series.delete({ where: { id } });
    else await prisma.rating.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
