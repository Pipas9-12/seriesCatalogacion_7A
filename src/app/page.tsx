"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Platform = { id: string; name: string; createdAt?: string };
type Series = { id: string; name: string; platformId: string; platform: Platform };
type Rating = {
  id: string;
  platformId: string;
  seriesId: string;
  score: number;
  observation: string;
  platform: Platform;
  series: Series;
  createdAt: string;
};
type Resource = "series" | "platforms" | "ratings";
type Tab = "overview" | Resource;
type DialogItem = Platform | Series | Rating;
type DialogState = { resource: Resource; item?: DialogItem } | null;

const labels: Record<Resource, string> = {
  series: "series",
  platforms: "plataformas",
  ratings: "valoraciones",
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Ocurrió un error inesperado.");
  return result as T;
}

function Icon({ name }: { name: string }) {
  const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "play") return <svg {...common}><path d="m8 5 11 7-11 7z" /></svg>;
  if (name === "grid") return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
  if (name === "screen") return <svg {...common}><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>;
  if (name === "star") return <svg {...common}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14m-7-7h14"/></svg>;
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if (name === "edit") return <svg {...common}><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z"/></svg>;
  if (name === "trash") return <svg {...common}><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>;
  return <svg {...common}><path d="M12 3v18m9-9H3"/></svg>;
}

function FormDialog({
  dialog,
  platforms,
  series,
  onClose,
  onSave,
}: {
  dialog: NonNullable<DialogState>;
  platforms: Platform[];
  series: Series[];
  onClose: () => void;
  onSave: (resource: Resource, payload: Record<string, string>) => Promise<void>;
}) {
  const { resource, item } = dialog;
  const existing = item as (Platform & Partial<Series & Rating>) | undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [platformId, setPlatformId] = useState(existing?.platformId ?? platforms[0]?.id ?? "");
  const [seriesId, setSeriesId] = useState(existing?.seriesId ?? "");
  const [score, setScore] = useState(String(existing?.score ?? "8"));
  const [observation, setObservation] = useState(existing?.observation ?? "");
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(item);
  const title = `${isEditing ? "Editar" : "Agregar"} ${resource === "series" ? "serie" : resource === "platforms" ? "plataforma" : "valoración"}`;
  const availableSeries = series.filter((entry) => entry.platformId === platformId);

  useEffect(() => {
    if (resource === "ratings" && availableSeries.length && !availableSeries.some((entry) => entry.id === seriesId)) {
      setSeriesId(availableSeries[0].id);
    }
  }, [availableSeries, resource, seriesId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    let payload: Record<string, string>;
    if (resource === "platforms") payload = { name };
    else if (resource === "series") payload = { name, platformId };
    else payload = { platformId, seriesId, score, observation };
    await onSave(resource, payload);
    setSaving(false);
  }

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-top"><div><span className="eyebrow">CATÁLOGO</span><h2 id="dialog-title">{title}</h2></div><button className="icon-button close-button" onClick={onClose} aria-label="Cerrar">×</button></div>
        <form onSubmit={submit} className="form-body">
          {(resource === "series" || resource === "platforms") && <label className="field"><span>Nombre</span><input autoFocus required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder={resource === "series" ? "Ej. The Bear" : "Ej. Netflix"} /></label>}
          {resource === "series" && <label className="field"><span>Plataforma</span><select required value={platformId} onChange={(event) => setPlatformId(event.target.value)}><option value="" disabled>Selecciona plataforma</option>{platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}</select>{platforms.length === 0 && <small>Primero registra una plataforma.</small>}</label>}
          {resource === "ratings" && <>
            <label className="field"><span>Plataforma</span><select required value={platformId} onChange={(event) => setPlatformId(event.target.value)}><option value="" disabled>Selecciona plataforma</option>{platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}</select></label>
            <label className="field"><span>Serie</span><select required value={seriesId} onChange={(event) => setSeriesId(event.target.value)}><option value="" disabled>Selecciona serie</option>{availableSeries.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select>{availableSeries.length === 0 && <small>No hay series registradas en esta plataforma.</small>}</label>
            <label className="field"><span>Puntaje <b className="score-preview">{score}/10</b></span><input type="range" min="1" max="10" value={score} onChange={(event) => setScore(event.target.value)} /></label>
            <label className="field"><span>Observación</span><textarea required maxLength={1000} rows={4} value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="¿Qué te pareció esta serie?" /></label>
          </>}
          {resource === "platforms" && <p className="form-hint">Las plataformas con series registradas no se pueden eliminar.</p>}
          {resource !== "platforms" && platforms.length === 0 && <p className="form-hint">Agrega una plataforma antes de continuar.</p>}
          <div className="dialog-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving || (resource !== "platforms" && platforms.length === 0) || (resource === "ratings" && availableSeries.length === 0)}>{saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear registro"}</button></div>
        </form>
      </section>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [platformData, seriesData, ratingData] = await Promise.all([
        request<Platform[]>("/api/platforms"), request<Series[]>("/api/series"), request<Rating[]>("/api/ratings"),
      ]);
      setPlatforms(platformData);
      setSeries(seriesData);
      setRatings(ratingData);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => { setNotice(""); setError(""); }, 4500);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  const average = ratings.length ? (ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length).toFixed(1) : "—";
  const recentRatings = ratings.slice(0, 4);
  const filteredSeries = useMemo(() => series.filter((entry) => `${entry.name} ${entry.platform.name}`.toLowerCase().includes(search.toLowerCase())), [series, search]);
  const filteredPlatforms = useMemo(() => platforms.filter((entry) => entry.name.toLowerCase().includes(search.toLowerCase())), [platforms, search]);
  const filteredRatings = useMemo(() => ratings.filter((entry) => `${entry.series.name} ${entry.platform.name} ${entry.observation}`.toLowerCase().includes(search.toLowerCase())), [ratings, search]);

  async function save(resource: Resource, payload: Record<string, string>) {
    if (!dialog) return;
    try {
      const endpoint = `/api/${resource}${dialog.item ? `/${dialog.item.id}` : ""}`;
      await request(endpoint, { method: dialog.item ? "PUT" : "POST", body: JSON.stringify(payload) });
      setDialog(null);
      setNotice(dialog.item ? "Cambios guardados correctamente." : "Registro creado correctamente.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar.");
    }
  }

  async function remove(resource: Resource, item: DialogItem) {
    const name = "name" in item ? item.name : `la valoración de ${item.series.name}`;
    if (!window.confirm(`¿Eliminar ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await request(`/api/${resource}/${item.id}`, { method: "DELETE" });
      setNotice("Registro eliminado correctamente.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar.");
    }
  }

  function openDialog(resource: Resource, item?: DialogItem) {
    if ((resource === "series" || resource === "ratings") && platforms.length === 0) {
      setError("Primero agrega al menos una plataforma.");
      setTab("platforms");
      return;
    }
    if (resource === "ratings" && series.length === 0) {
      setError("Primero agrega al menos una serie.");
      setTab("series");
      return;
    }
    setError("");
    setDialog({ resource, item });
  }

  const tabTitle: Record<Tab, string> = { overview: "Resumen", series: "Series", platforms: "Plataformas", ratings: "Valoraciones" };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" onClick={() => setTab("overview")}><span className="brand-mark"><Icon name="play" /></span><span>MI<span className="brand-light">SERIE</span><small>CATÁLOGO PERSONAL</small></span></a>
        <div className="nav-caption">ESPACIO DE TRABAJO</div>
        <nav className="side-nav" aria-label="Navegación principal">
          {(["overview", "series", "platforms", "ratings"] as Tab[]).map((entry) => <button key={entry} className={`nav-item ${tab === entry ? "active" : ""}`} onClick={() => { setTab(entry); setSearch(""); }}><Icon name={entry === "overview" ? "grid" : entry === "series" ? "play" : entry === "platforms" ? "screen" : "star"} /><span>{tabTitle[entry]}</span>{entry === "series" && <span className="nav-count">{series.length}</span>}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-note"><span className="note-icon">✦</span><p>Tu rincón para recordar cada historia.</p><span>Organiza. Califica. Recuerda.</span></div><div className="profile"><div className="avatar">S</div><div><b>Mi catálogo</b><span>Cuenta personal</span></div><span className="profile-dots">···</span></div></div>
      </aside>

      <section className="main-area" id="inicio">
        <header className="topbar"><div className="breadcrumbs">Mi espacio <span>/</span> <b>{tabTitle[tab]}</b></div><div className="topbar-right"><span className="live-dot"/> Tu colección, a tu manera <div className="top-avatar">S</div></div></header>
        <div className="content">
          <div className="page-heading"><div><div className="eyebrow">TU BIBLIOTECA PERSONAL</div><h1>{tab === "overview" ? <>Un universo de <em>historias.</em></> : tabTitle[tab]}</h1><p>{tab === "overview" ? "Todo lo que ves, en un solo lugar." : tab === "series" ? "Todas las series que tienes en tu lista." : tab === "platforms" ? "Administra dónde encuentras tus próximas historias." : "Tus opiniones, puntajes y recuerdos."}</p></div><div className="heading-actions">{tab === "overview" ? <button className="button button-quiet" onClick={() => setTab("series")}>Explorar catálogo <span>→</span></button> : <button className="button button-primary" onClick={() => openDialog(tab)}><Icon name="plus"/> Agregar {tab === "series" ? "serie" : tab === "platforms" ? "plataforma" : "valoración"}</button>}</div></div>

          {error && <div className="toast toast-error" role="alert"><span>!</span>{error}<button onClick={() => setError("")} aria-label="Cerrar aviso">×</button></div>}
          {notice && <div className="toast toast-success" role="status"><span>✓</span>{notice}<button onClick={() => setNotice("")} aria-label="Cerrar aviso">×</button></div>}

          {tab === "overview" && <>
            <div className="hero-card"><div className="hero-copy"><span className="hero-kicker"><span/> TU PRÓXIMA HISTORIA TE ESPERA</span><h2>¿Qué vemos<br/>esta noche?</h2><p>Tu catálogo está listo. Encuentra esa serie que guardaste para después.</p><button className="button hero-button" onClick={() => setTab("series")}>Ver mis series <span>↗</span></button></div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-art"><div className="art-sun"/><div className="art-moon"/><div className="art-ridge ridge-back"/><div className="art-ridge ridge-front"/><div className="art-card"><span>EN CARTELERA</span><b>Tu siguiente<br/>favorita.</b><div className="art-stars">✦ ✦ ✦ ✦ ✦</div></div></div><span className="hero-index">01 — TU COLECCIÓN</span></div>
            <section className="stats-grid" aria-label="Resumen del catálogo"><article className="stat-card"><span className="stat-icon purple"><Icon name="play"/></span><div><span className="stat-label">SERIES GUARDADAS</span><strong>{series.length}</strong><small>en tu biblioteca</small></div><span className="stat-spark">↗</span></article><article className="stat-card"><span className="stat-icon coral"><Icon name="screen"/></span><div><span className="stat-label">PLATAFORMAS</span><strong>{platforms.length}</strong><small>para explorar</small></div><span className="stat-spark">↗</span></article><article className="stat-card"><span className="stat-icon yellow"><Icon name="star"/></span><div><span className="stat-label">PUNTAJE PROMEDIO</span><strong>{average}<i>/10</i></strong><small>{ratings.length} valoraciones</small></div><span className="stat-spark">✦</span></article></section>
            <div className="overview-grid"><section className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">LO MÁS RECIENTE</span><h3>Valoraciones</h3></div><button className="text-link" onClick={() => setTab("ratings")}>Ver todas <span>→</span></button></div>{recentRatings.length ? <div className="recent-list">{recentRatings.map((rating) => <article className="recent-item" key={rating.id}><div className="poster-mini"><Icon name="play"/></div><div className="recent-info"><b>{rating.series.name}</b><span>{rating.platform.name}</span></div><div className="rating-pill"><Icon name="star"/>{rating.score}<small>/10</small></div></article>)}</div> : <EmptyState title="Aún no hay valoraciones" copy="Califica una serie para verla aparecer aquí." action="Agregar valoración" onAction={() => openDialog("ratings")}/>}</section><section className="panel platform-panel"><div className="panel-heading"><div><span className="eyebrow">DÓNDE VER</span><h3>Tus plataformas</h3></div><button className="round-add" onClick={() => openDialog("platforms")} aria-label="Agregar plataforma"><Icon name="plus"/></button></div>{platforms.length ? <div className="platform-list">{platforms.slice(0, 5).map((platform, index) => <button className="platform-row" key={platform.id} onClick={() => { setTab("series"); setSearch(platform.name); }}><span className={`platform-monogram color-${index % 4}`}>{platform.name.slice(0, 1).toUpperCase()}</span><span><b>{platform.name}</b><small>{series.filter((entry) => entry.platformId === platform.id).length} series</small></span><span className="row-arrow">↗</span></button>)}</div> : <EmptyState title="Empieza por una plataforma" copy="Registra tus servicios de streaming." action="Agregar plataforma" onAction={() => openDialog("platforms")}/>}</section></div>
          </>}

          {tab !== "overview" && <section className="panel list-panel"><div className="list-toolbar"><div className="search-box"><Icon name="search"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${labels[tab]}…`} aria-label={`Buscar ${labels[tab]}`}/><kbd>⌕</kbd></div><span className="result-count">{tab === "series" ? filteredSeries.length : tab === "platforms" ? filteredPlatforms.length : filteredRatings.length} registros</span></div>
            {loading ? <div className="loading-state"><span className="spinner"/>Cargando catálogo…</div> : tab === "series" ? filteredSeries.length ? <div className="table-wrap"><table><thead><tr><th>SERIE</th><th>PLATAFORMA</th><th>VALORACIÓN</th><th className="actions-heading">ACCIONES</th></tr></thead><tbody>{filteredSeries.map((entry, index) => { const related = ratings.filter((rating) => rating.seriesId === entry.id); const avg = related.length ? (related.reduce((sum, rating) => sum + rating.score, 0) / related.length).toFixed(1) : "—"; return <tr key={entry.id}><td><div className="series-cell"><span className={`poster poster-${index % 5}`}><Icon name="play"/></span><div><b>{entry.name}</b><small>{related.length} {related.length === 1 ? "valoración" : "valoraciones"}</small></div></div></td><td><span className="platform-tag"><span/>{entry.platform.name}</span></td><td><span className="table-score"><Icon name="star"/>{avg}<small>/10</small></span></td><td><RowActions onEdit={() => openDialog("series", entry)} onDelete={() => void remove("series", entry)}/></td></tr>; })}</tbody></table></div> : <EmptyState title="Tu lista empieza aquí" copy="Agrega una serie y elige dónde la estás viendo." action="Agregar serie" onAction={() => openDialog("series")}/> : tab === "platforms" ? filteredPlatforms.length ? <div className="platform-cards">{filteredPlatforms.map((platform, index) => <article className="platform-card" key={platform.id}><div className={`platform-monogram large color-${index % 4}`}>{platform.name.slice(0, 1).toUpperCase()}</div><div className="platform-card-copy"><span>PLATAFORMA</span><h3>{platform.name}</h3><p>{series.filter((entry) => entry.platformId === platform.id).length} series en tu catálogo</p></div><RowActions onEdit={() => openDialog("platforms", platform)} onDelete={() => void remove("platforms", platform)}/></article>)}</div> : <EmptyState title="Sin plataformas todavía" copy="Agrega Netflix, Max, Prime Video o la que uses." action="Agregar plataforma" onAction={() => openDialog("platforms")}/> : filteredRatings.length ? <div className="rating-list">{filteredRatings.map((rating) => <article className="rating-card" key={rating.id}><div className="rating-card-top"><div className="rating-series"><span className="poster poster-2"><Icon name="play"/></span><div><b>{rating.series.name}</b><span>{rating.platform.name}</span></div></div><div className="rating-large"><Icon name="star"/>{rating.score}<small>/10</small></div></div><p>“{rating.observation}”</p><div className="rating-card-bottom"><span>{new Date(rating.createdAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</span><RowActions onEdit={() => openDialog("ratings", rating)} onDelete={() => void remove("ratings", rating)}/></div></article>)}</div> : <EmptyState title="Tus opiniones tienen lugar aquí" copy="Deja un puntaje y una observación para cada serie." action="Agregar valoración" onAction={() => openDialog("ratings")}/>}</section>}
          <footer className="page-footer"><span>HECHO PARA LOS AMANTES DE LAS SERIES</span><span>MI SERIE <i>✦</i> CATÁLOGO PERSONAL</span></footer>
        </div>
      </section>
      {dialog && <FormDialog key={`${dialog.resource}-${dialog.item?.id ?? "new"}`} dialog={dialog} platforms={platforms} series={series} onClose={() => setDialog(null)} onSave={save}/>}
    </main>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="row-actions"><button className="icon-button" onClick={onEdit} aria-label="Editar"><Icon name="edit"/></button><button className="icon-button danger-action" onClick={onDelete} aria-label="Eliminar"><Icon name="trash"/></button></div>;
}

function EmptyState({ title, copy, action, onAction }: { title: string; copy: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="play"/></span><h4>{title}</h4><p>{copy}</p><button className="button button-primary" onClick={onAction}><Icon name="plus"/>{action}</button></div>;
}
