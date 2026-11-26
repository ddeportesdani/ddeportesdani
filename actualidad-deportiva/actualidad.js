<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/actualidad.js" defer></script>
const DATA_URL = "../data/actualidad.json";
const REFRESH_INTERVAL = 5 * 60 * 1000;

const SUPABASE_URL = "TU_URL_DE_SUPABASE";
const SUPABASE_ANON_KEY = "TU_CLAVE_PUBLICA";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let database = {
  news: [],
  athletes: [],
  minimums: [],
  systems: [],
  sources: [],
  updatedAt: null
};

const $ = id => document.getElementById(id);

function safeLink(url) {
  try {
    const parsed = new URL(url, location.origin);
    return ["https:", "http:"].includes(parsed.protocol)
      ? parsed.href : "#";
  } catch {
    return "#";
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function loadData() {
  try {
    const response = await fetch(DATA_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });

    if (!response.ok) throw new Error("No se pudieron cargar los datos");

    const incoming = await response.json();

    database = {
      news: Array.isArray(incoming.news) ? incoming.news : [],
      athletes: Array.isArray(incoming.athletes) ? incoming.athletes : [],
      minimums: Array.isArray(incoming.minimums) ? incoming.minimums : [],
      systems: Array.isArray(incoming.systems) ? incoming.systems : [],
      sources: Array.isArray(incoming.sources) ? incoming.sources : [],
      updatedAt: incoming.updatedAt || null
    };

    renderAll();

  } catch (error) {
    console.error("Actualidad Deportiva:", error);
    showError();
  }
}

function renderAll() {
  renderNews();
  renderAthletes();
  renderMinimums();
  renderSystems();
  renderSources();
  populateFilters();

  $("classified-update").textContent =
    database.updatedAt
      ? "Última actualización de datos: " +
        new Date(database.updatedAt).toLocaleString("es-ES")
      : "Fecha de actualización no disponible.";
}

function renderNews() {
  const container = $("news-grid");
  container.replaceChildren();

  if (!database.news.length) {
    container.append(element("p", "empty", "No hay noticias publicadas."));
    return;
  }

  database.news.forEach(item => {
    const card = element("article", "news-card");

    if (item.image) {
      const img = element("img");
      img.src = safeLink(item.image);
      img.alt = item.title || "Noticia deportiva";
      img.loading = "lazy";
      card.append(img);
    }

    const body = element("div", "news-body");
    body.append(element("span", "news-category", item.category || "Deporte"));
    body.append(element("h3", "", item.title || "Noticia"));

    body.append(element("p", "", item.summary || ""));

    if (item.publishedAt) {
      body.append(element("p", "", new Date(item.publishedAt).toLocaleDateString("es-ES")));
    }

    const link = element("a", "read-more", "LEER NOTICIA →");
    link.href = safeLink(item.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    body.append(link);
    card.append(body);
    container.append(card);
  });
}

function renderAthletes() {
  const tbody = $("athletes-table");
  tbody.replaceChildren();

  const sport = $("sport-filter").value;
  const event = $("event-filter").value;
  const type = $("type-filter").value;

  const filtered = database.athletes.filter(a =>
    (!sport || a.sport === sport) &&
    (!event || a.event === event) &&
    (!type || a.type === type)
  );

  if (!filtered.length) {
    const row = element("tr");
    const cell = element("td", "", "No hay deportistas para estos filtros.");
    cell.colSpan = 5;
    row.append(cell);
    tbody.append(row);
    return;
  }

  filtered.forEach(a => {
    const row = element("tr");

    [
      a.name,
      a.sport,
      a.event,
      a.type === "paralimpico" ? "Paralímpico" : "Olímpico"
    ].forEach(value => row.append(element("td", "", value || "—")));

    const statusCell = element("td");
    statusCell.append(element("span", "status", a.status || "Pendiente"));
    row.append(statusCell);

    tbody.append(row);
  });
}

function renderMinimums() {
  const container = $("minimum-grid");
  container.replaceChildren();

  const sport = $("minimum-sport").value;
  const event = $("minimum-event").value;

  const filtered = database.minimums.filter(m =>
    (!sport || m.sport === sport) &&
    (!event || m.event === event)
  );

  if (!filtered.length) {
    container.append(element("p", "empty", "No hay mínimas disponibles."));
    return;
  }

  filtered.forEach(m => {
    const card = element("article", "minimum-card");
    card.append(element("h3", "", m.sport || "Deporte"));
    card.append(element("p", "", "Competición: " + (m.event || "—")));
    card.append(element("p", "", "Prueba: " + (m.discipline || "—")));
    card.append(element("p", "", "Marca: " + (m.mark || "Consultar documento")));
    card.append(element("p", "", "Periodo: " + (m.period || "No indicado")));

    if (m.source) {
      const link = element("a", "read-more", "CONSULTAR FUENTE OFICIAL →");
      link.href = safeLink(m.source);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      card.append(link);
    }

    container.append(card);
  });
}

function renderSystems() {
  const container = $("systems-grid");
  container.replaceChildren();

  database.systems.forEach(item => {
    const card = element("article", "system-card");
    card.append(element("h3", "", item.sport || "Deporte"));
    card.append(element("p", "", item.event || ""));
    card.append(element("p", "", item.description || ""));

    const link = element("a", "read-more", "VER SISTEMA DE CLASIFICACIÓN →");
    link.href = safeLink(item.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    card.append(link);
    container.append(card);
  });
}

function renderSources() {
  const container = $("sources-list");
  container.replaceChildren();

  database.sources.forEach(source => {
    const link = element("a", "", source.name || "Fuente oficial");
    link.href = safeLink(source.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    container.append(link);
  });
}

function populateFilters() {
  setOptions("sport-filter", database.athletes.map(a => a.sport));
  setOptions("event-filter", database.athletes.map(a => a.event));
  setOptions("minimum-sport", database.minimums.map(a => a.sport));
  setOptions("minimum-event", database.minimums.map(a => a.event));
}

function setOptions(id, values) {
  const select = $(id);
  const previous = select.value;
  const first = select.options[0];

  select.replaceChildren(first);

  [...new Set(values.filter(Boolean))]
    .sort()
    .forEach(value => {
      const option = element("option", "", value);
      option.value = value;
      select.append(option);
    });

  if ([...select.options].some(o => o.value === previous)) {
    select.value = previous;
  }
}

function showError() {
  $("news-grid").replaceChildren(
    element("p", "empty", "No ha sido posible cargar las noticias. Inténtalo más tarde.")
  );
  $("athletes-table").replaceChildren();
  const row = element("tr");
  const cell = element("td", "", "Datos temporalmente no disponibles.");
  cell.colSpan = 5;
  row.append(cell);
  $("athletes-table").append(row);
}

["sport-filter", "event-filter", "type-filter"].forEach(id => {
  $(id).addEventListener("change", renderAthletes);
});

["minimum-sport", "minimum-event"].forEach(id => {
  $(id).addEventListener("change", renderMinimums);
});

loadData();
setInterval(loadData, REFRESH_INTERVAL);
