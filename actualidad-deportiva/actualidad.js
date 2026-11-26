
/* ==========================================
   DDEPORTES DANI - ACTUALIDAD DEPORTIVA
   SUPABASE + CLASIFICADOS
========================================== */

const SUPABASE_URL = "https://qizogdfgjkgzjhdzhnmc.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_lopHHwGv5NBOfIswGOlJ6Q_qvs2K9X3";

const REFRESH_INTERVAL = 5 * 60 * 1000;
const DATA_URL = "/data/actualidad.json";

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
      ? parsed.href
      : "#";
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
   CARGAR CLASIFICADOS DESDE SUPABASE
========================================== */


async function loadClassifieds() {
  const tbody = $("athletes");

  try {
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="5">Cargando deportistas...</td></tr>';
    }

    const { data: clasificados, error: errorClasificados } =
      await supabaseClient
        .from("clasificados")
        .select("*");

    if (errorClasificados) throw errorClasificados;

    const { data: deportistas, error: errorDeportistas } =
      await supabaseClient
        .from("deportistas_actualidad")
        .select("*");

    if (errorDeportistas) throw errorDeportistas;

    const mapaDeportistas = new Map(
      (deportistas || []).map(deportista => [
        String(deportista.id),
        deportista
      ])
    );

    classifiedData = (clasificados || [])
      .map(item => {
        const deportista = mapaDeportistas.get(
          String(item.deportista_id)
        );

        if (!deportista) return null;

        return {
          ...item,
          athlete: deportista
        };
      })
      .filter(Boolean);

    populateSportFilter();
    renderClassifieds();

    console.log("CLASIFICADOS MOSTRADOS:", classifiedData);

  } catch (error) {
    console.error("Error cargando clasificados:", error);

    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="5">Error cargando clasificados.</td></tr>';
    }
  }
}


/* ==========================================
   MOSTRAR CLASIFICADOS Y CONTADORES
========================================== */

function renderClassifieds() {
  const tbody = $("athletes");
  if (!tbody) return;

  tbody.replaceChildren();

  const sport = $("sport-filter")?.value || "";
  const type = $("type-filter")?.value || "";

  const filtered = classifiedData.filter(item => {
    if (!item.athlete) return false;

    const athlete = item.athlete;

    return (
      (!sport || athlete.deporte === sport) &&
      (!type ||
        normalize(athlete.tipo) === normalize(type) ||
        normalize(item.estado) === normalize(type) ||
        normalize(athlete.estado_clasificacion) === normalize(type))
    );
  });

  let nominalCount = 0;
  let placesCount = 0;

  filtered.forEach(item => {
    const athlete = item.athlete;

    const isPlace =
      normalize(item.estado) === "plaza no nominal" ||
      normalize(athlete.estado_clasificacion) === "plaza no nominal";

    if (isPlace) {
      placesCount++;
    } else {
      nominalCount++;
    }

    const row = document.createElement("tr");

    const values = [
      athlete.nombre,
      athlete.deporte,
      item.competicion || athlete.competicion_clasificacion,
      athlete.modalidad,
      item.estado || athlete.estado_clasificacion
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");

      if (index === 4) {
        const badge = document.createElement("span");
        badge.className = "status" + (isPlace ? " non-nominal" : "");
        badge.textContent = value || "Pendiente";
        cell.appendChild(badge);
      } else {
        cell.textContent = value || "—";
      }

      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.textContent = "No hay clasificados para estos filtros.";

    row.appendChild(cell);
    tbody.appendChild(row);
  }

  const allNominal = classifiedData.filter(item =>
    item.athlete &&
    normalize(item.estado) !== "plaza no nominal" &&
    normalize(item.athlete.estado_clasificacion) !== "plaza no nominal"
  ).length;

  const allPlaces = classifiedData.filter(item =>
    item.athlete && (
      normalize(item.estado) === "plaza no nominal" ||
      normalize(item.athlete.estado_clasificacion) === "plaza no nominal"
    )
  ).length;

  if ($("classified-count")) {
    $("classified-count").textContent = allNominal;
  }

  if ($("places-count")) {
    $("places-count").textContent = allPlaces;
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

    if (!response.ok) {
      throw new Error("Error cargando actualidad.json");
    }

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
