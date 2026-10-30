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
  return NextResponse.json({ error: "No se pudo completar la operación." }, { status: 500 });
}

export async function GET(_request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (!isResource(resource)) return NextResponse.json({ error: "Recurso no válido." }, { status: 404 });

  try {
    if (resource === "platforms") {
      return NextResponse.json(await prisma.platform.findMany({ orderBy: { name: "asc" } }));
    }
    if (resource === "series") {
      return NextResponse.json(
        await prisma.series.findMany({ include: { platform: true }, orderBy: { name: "asc" } }),
      );
    }
    return NextResponse.json(
      await prisma.rating.findMany({
        include: { platform: true, series: true },
        orderBy: { createdAt: "desc" },
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (!isResource(resource)) return NextResponse.json({ error: "Recurso no válido." }, { status: 404 });

  try {
    const body = await request.json();
    if (resource === "platforms") {
      const name = text(body.name);
      if (!name) return NextResponse.json({ error: "Escribe el nombre de la plataforma." }, { status: 400 });
      return NextResponse.json(await prisma.platform.create({ data: { name } }), { status: 201 });
    }
    if (resource === "series") {
      const name = text(body.name);
      const platformId = text(body.platformId);
      if (!name || !platformId) return NextResponse.json({ error: "La serie y su plataforma son obligatorias." }, { status: 400 });
      return NextResponse.json(
        await prisma.series.create({ data: { name, platformId }, include: { platform: true } }),
        { status: 201 },
      );
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
    return NextResponse.json(
      await prisma.rating.create({
        data: { platformId, seriesId, score, observation },
        include: { platform: true, series: true },
      }),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
