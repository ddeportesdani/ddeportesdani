
/* ==========================================
   DDEPORTES DANI - ACTUALIDAD DEPORTIVA
   SUPABASE + CLASIFICADOS
========================================== */

const SUPABASE_URL =
  "https://qizogdfgjkgzjhdzhnmc.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_lopHHwGv5NBOfIswGOlJ6Q_qvs2K9X3";

const REFRESH_INTERVAL = 5 * 60 * 1000;
const DATA_URL = "../data/actualidad.json";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = id => document.getElementById(id);

let classifiedData = [];
let database = {
  news: [],
  minimums: [],
  systems: [],
  sources: []
};

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function safeLink(url) {
  try {
    const parsed = new URL(url, location.origin);
    return ["https:", "http:"].includes(parsed.protocol)
      ? parsed.href : "#";
  } catch {
    return "#";
  }
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* ==========================================
   MOSTRAR TARJETAS Y CONTADORES
========================================== */

function renderClassifieds() {
  const nominal = $("classified-athletes");
  const places = $("classified-places");

  if (!nominal || !places) {
    console.error("Faltan los contenedores HTML de clasificados.");
    return;
  }

  nominal.replaceChildren();
  places.replaceChildren();

  const sport = $("sport-filter")?.value || "";
  const type = $("type-filter")?.value || "";

  const filtered = classifiedData.filter(item => {
    if (!item.athlete) return false;

    return (
      (!sport || item.athlete.deporte === sport) &&
      (!type || normalize(item.athlete.tipo) === normalize(type))
    );
  });

  let nominalCount = 0;
  let placesCount = 0;

  filtered.forEach(item => {
    const athlete = item.athlete;

    const isPlace =
      normalize(athlete.estado_clasificacion) === "plaza no nominal" ||
      normalize(item.estado) === "plaza no nominal";

    const card = el("article", "classified-card");

    if (athlete.fotografia) {
      const img = el("img");
      img.src = safeLink(athlete.fotografia);
      img.alt = athlete.nombre || "Deportista";
      img.loading = "lazy";
      card.append(img);
    }

    card.append(el(
      "span",
      "category",
      normalize(athlete.tipo) === "paralimpico"
        ? "DEPORTE PARALÍMPICO"
        : "DEPORTE OLÍMPICO"
    ));

    card.append(el("h3", "", athlete.nombre || "Sin nombre"));
    card.append(el("p", "", "Deporte: " + (athlete.deporte || "—")));
    card.append(el("p", "", "Modalidad: " + (athlete.modalidad || "—")));
    card.append(el("p", "", "Competición: " + (
      item.competicion ||
      athlete.competicion_clasificacion ||
      "—"
    )));

    card.append(el(
      "span",
      isPlace ? "status non-nominal" : "status",
      item.estado || athlete.estado_clasificacion || "Clasificado"
    ));

    if (athlete.federacion) {
      card.append(el("p", "", "Federación: " + athlete.federacion));
    }

    if (item.fecha_clasificacion) {
      card.append(el(
        "p", "",
        "Fecha: " + new Date(item.fecha_clasificacion + "T00:00:00")
          .toLocaleDateString("es-ES")
      ));
    }

    if (item.observaciones) {
      card.append(el("p", "", item.observaciones));
    }

    if (item.fuente_url) {
      const link = el("a", "more", "CONSULTAR FUENTE OFICIAL →");
      link.href = safeLink(item.fuente_url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      card.append(link);
    }

    if (isPlace) {
      places.append(card);
      placesCount++;
    } else {
      nominal.append(card);
      nominalCount++;
    }
  });

  if (!nominalCount) {
    nominal.append(el("p", "empty", "No hay clasificados nominales."));
  }

  if (!placesCount) {
    places.append(el("p", "empty", "No hay plazas no nominales."));
  }

  if ($("classified-count")) {
    $("classified-count").textContent = nominalCount;
  }

  $("classified-count").textContent = nominalCount;
$("places-count").textContent = placesCount;
  }
}

/* ==========================================
   FILTROS
========================================== */

function populateSportFilter() {
  const select = $("sport-filter");
  if (!select) return;

  const previous = select.value;

  const sports = [
    ...new Set(
      classifiedData
        .filter(item => item.athlete)
        .map(item => item.athlete.deporte)
        .filter(Boolean)
    )
  ].sort();

  select.replaceChildren();

  const all = el("option", "", "Todos los deportes");
  all.value = "";
  select.append(all);

  sports.forEach(sport => {
    const option = el("option", "", sport);
    option.value = sport;
    select.append(option);
  });

  select.value = sports.includes(previous) ? previous : "";
}

/* ==========================================
   RESTO DE CONTENIDOS JSON
========================================== */

async function loadData() {
  try {
    const response = await fetch(DATA_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });

    if (!response.ok) throw new Error("Error cargando actualidad.json");

    const incoming = await response.json();

    database.news = incoming.news || [];
    database.minimums = incoming.minimums || [];
    database.systems = incoming.systems || [];
    database.sources = incoming.sources || [];

    renderNews();
    renderMinimums();
    renderSystems();
    renderSources();

  } catch (error) {
    console.error("Error cargando actualidad:", error);
  }
}

function renderNews() {
  const container = $("news");
  if (!container) return;

  container.replaceChildren();

  database.news.forEach(item => {
    const card = el("article", "news-card");
    const body = el("div", "news-content");

    body.append(el("span", "category", item.category || "Deporte"));
    body.append(el("h3", "", item.title || "Noticia"));
    body.append(el("p", "", item.summary || ""));

    if (item.url) {
      const link = el("a", "more", "LEER NOTICIA →");
      link.href = safeLink(item.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      body.append(link);
    }

    card.append(body);
    container.append(card);
  });
}

function renderMinimums() {
  const container = $("minimums");
  if (!container) return;

  container.replaceChildren();

  database.minimums.forEach(item => {
    const card = el("article", "data-card");
    const body = el("div", "data-content");

    body.append(el("h3", "", item.sport || item.deporte || "Deporte"));
    body.append(el("p", "", "Competición: " + (item.event || item.competicion || "—")));
    body.append(el("p", "", "Marca: " + (item.mark || item.minima || "—")));

    card.append(body);
    container.append(card);
  });
}

function renderSystems() {
  const container = $("systems");
  if (!container) return;

  container.replaceChildren();

  database.systems.forEach(item => {
    const card = el("article", "data-card");
    const body = el("div", "data-content");

    body.append(el("h3", "", item.sport || "Deporte"));
    body.append(el("p", "", item.description || ""));

    if (item.url) {
      const link = el("a", "more", "CONSULTAR SISTEMA →");
      link.href = safeLink(item.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      body.append(link);
    }

    card.append(body);
    container.append(card);
  });
}

function renderSources() {
  const container = $("sources");
  if (!container) return;

  container.replaceChildren();

  database.sources.forEach(source => {
    const link = el("a", "", source.name || "Fuente oficial");
    link.href = safeLink(source.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    container.append(link);
  });
}

/* ==========================================
   INICIALIZACIÓN
========================================== */

async function initialize() {
  $("sport-filter")?.addEventListener("change", renderClassifieds);
  $("type-filter")?.addEventListener("change", renderClassifieds);

  await Promise.all([
    loadClassifieds(),
    loadData()
  ]);

  setInterval(() => {
    loadClassifieds();
    loadData();
  }, REFRESH_INTERVAL);
}

initialize();
async function pruebaSupabase() {
  const resultado = await window.supabase
    .createClient(
      "https://qizogdfgjkgzjhdzhnmc.supabase.co",
      "sb_publishable_lopHHwGv5NBOfIswGOlJ6Q_qvs2K9X3"
    )
    .from("clasificados")
    .select("*");

  console.log("PRUEBA SUPABASE:", resultado);
}

pruebaSupabase();
