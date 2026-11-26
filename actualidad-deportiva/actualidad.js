
/* ==========================================
   DDEPORTES DANI
   ACTUALIDAD DEPORTIVA
   SUPABASE
========================================== */

const SUPABASE_URL = "https://qizogdfgjkgzjhdzhnmc.supabase.co";

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

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function createElement(tag, className, content) {
  const node = document.createElement(tag);

  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;

  return node;
}

/* ==========================================
   CLASIFICADOS
========================================== */

async function loadClassifieds() {
  const tbody = $("athletes");

  if (!tbody) return;

  try {
    const { data: classifications, error: classificationError } =
      await supabaseClient
        .from("clasificados")
        .select("*")
        .order("id", { ascending: true });

    if (classificationError) throw classificationError;

    const { data: athletes, error: athleteError } =
      await supabaseClient
        .from("deportistas_actualidad")
        .select("*");

    if (athleteError) throw athleteError;

    const athleteMap = new Map(
      athletes.map(athlete => [String(athlete.id), athlete])
    );

    classifiedData = classifications.map(item => ({
      ...item,
      athlete: athleteMap.get(String(item.deportista_id)) || null
    }));

    console.log("CLASIFICADOS:", classifications);
    console.log("DEPORTISTAS:", athletes);

    populateSportFilter();
    renderClassifieds();

  } catch (error) {
    console.error("Error cargando clasificados:", error);

    tbody.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.textContent = "No se pudieron cargar los clasificados.";

    row.appendChild(cell);
    tbody.appendChild(row);
  }
}

function renderClassifieds() {
  const tbody = $("athletes");
  const nominalContainer = $("classified-athletes");
  const placesContainer = $("classified-places");

  if (!tbody) return;

  tbody.replaceChildren();

  if (nominalContainer) nominalContainer.replaceChildren();
  if (placesContainer) placesContainer.replaceChildren();

  const sport = $("sport-filter")?.value || "";
  const type = $("type-filter")?.value || "";

  const filtered = classifiedData.filter(item => {
    if (!item.athlete) return false;

    const athlete = item.athlete;

    return (
      (!sport || athlete.deporte === sport) &&
      (!type || normalize(athlete.tipo) === normalize(type))
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

    const values = [
      athlete.nombre,
      athlete.deporte,
      item.competicion || athlete.competicion_clasificacion,
      athlete.modalidad,
      item.estado || athlete.estado_clasificacion
    ];

    const row = document.createElement("tr");

    values.forEach((value, index) => {
      const cell = document.createElement("td");

      if (index === 4) {
        const badge = document.createElement("span");

        badge.className = "status" +
          (isPlace ? " non-nominal" : "");

        badge.textContent = value || "Pendiente";
        cell.appendChild(badge);
      } else {
        cell.textContent = value || "—";
      }

      row.appendChild(cell);
    });

    tbody.appendChild(row);

    // Tarjetas de deportistas y plazas
    const container = isPlace ? placesContainer : nominalContainer;

    if (container) {
      const card = createElement("article", "classified-card");

      if (athlete.fotografia) {
        const img = document.createElement("img");
        img.src = safeLink(athlete.fotografia);
        img.alt = athlete.nombre || "Deportista";
        img.loading = "lazy";
        img.onerror = () => img.remove();
        card.appendChild(img);
      }

      card.appendChild(
        createElement("span", "category", athlete.deporte || "Deporte")
      );

      card.appendChild(
        createElement("h3", "", athlete.nombre || "Deportista")
      );

      card.appendChild(
        createElement("p", "", "Modalidad: " + (athlete.modalidad || "—"))
      );

      card.appendChild(
        createElement(
          "p",
          "",
          "Competición: " +
          (item.competicion || athlete.competicion_clasificacion || "—")
        )
      );

      const badge = createElement(
        "span",
        "status" + (isPlace ? " non-nominal" : ""),
        item.estado || athlete.estado_clasificacion || "Clasificado"
      );

      card.appendChild(badge);
      container.appendChild(card);
    }
  });

  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.textContent = "No hay clasificados para estos filtros.";

    row.appendChild(cell);
    tbody.appendChild(row);
  }

  if ($("classified-count")) {
    $("classified-count").textContent = nominalCount;
  }

  if ($("places-count")) {
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

  const option = createElement("option", "", "Todos los deportes");
  option.value = "";
  select.appendChild(option);

  sports.forEach(sport => {
    const option = createElement("option", "", sport);
    option.value = sport;
    select.appendChild(option);
  });

  select.value = sports.includes(previous) ? previous : "";
}

/* ==========================================
   MINIMAS
========================================== */

async function loadMinimas() {
  const container = $("minimums");

  if (!container) return;

  try {
    const { data, error } = await supabaseClient
      .from("minimas")
      .select("id, deporte, prueba, marca, competicion, periodo, fuente_url")
      .order("deporte", { ascending: true });

    if (error) throw error;

    container.replaceChildren();

    if (!data || data.length === 0) {
      container.appendChild(
        createElement("p", "empty", "Todavía no hay mínimas publicadas.")
      );
      return;
    }

    data.forEach(item => {
      const card = createElement("article", "data-card minima-card");
      const body = createElement("div", "data-content");

      body.appendChild(
        createElement("span", "category", item.deporte || "Deporte")
      );

      body.appendChild(
        createElement("h3", "", item.prueba || "Prueba pendiente")
      );

      body.appendChild(
        createElement("div", "minima-mark", item.marca || "Sin marca")
      );

      body.appendChild(
        createElement("p", "", "Competición: " + (item.competicion || "—"))
      );

      body.appendChild(
        createElement("p", "", "Periodo: " + (item.periodo || "—"))
      );

      if (item.fuente_url) {
        const link = createElement("a", "more", "CONSULTAR FUENTE OFICIAL →");
        link.href = safeLink(item.fuente_url);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        body.appendChild(link);
      }

      card.appendChild(body);
      container.appendChild(card);
    });

    console.log("MÍNIMAS CARGADAS:", data);

  } catch (error) {
    console.error("Error cargando mínimas:", error);

    container.replaceChildren();

    container.appendChild(
      createElement("p", "empty", "No se pudieron cargar las mínimas.")
    );
  }
}

/* ==========================================
   NOTICIAS Y RESTO DE CONTENIDOS
========================================== */

async function loadData() {
  try {
    const response = await fetch(DATA_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("No se encuentra actualidad.json");
    }

    const incoming = await response.json();

    database.news = incoming.news || [];
    database.minimums = incoming.minimums || [];
    database.systems = incoming.systems || [];
    database.sources = incoming.sources || [];

    renderNews();
    renderSystems();
    renderSources();

  } catch (error) {
    console.error("Error cargando actualidad.json:", error);
  }
}

function renderNews() {
  const container = $("news");
  if (!container) return;

  container.replaceChildren();

  database.news.forEach(item => {
    const card = createElement("article", "news-card");
    const body = createElement("div", "news-content");

    body.appendChild(
      createElement("span", "category", item.category || "Deporte")
    );

    body.appendChild(
      createElement("h3", "", item.title || "Noticia")
    );

    body.appendChild(
      createElement("p", "", item.summary || "")
    );

    if (item.url) {
      const link = createElement("a", "more", "LEER NOTICIA →");
      link.href = safeLink(item.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      body.appendChild(link);
    }

    card.appendChild(body);
    container.appendChild(card);
  });
}

function renderSystems() {
  const container = $("systems");
  if (!container) return;

  container.replaceChildren();

  database.systems.forEach(item => {
    const card = createElement("article", "data-card");
    const body = createElement("div", "data-content");

    body.appendChild(
      createElement("h3", "", item.sport || "Deporte")
    );

    body.appendChild(
      createElement("p", "", item.description || "")
    );

    if (item.url) {
      const link = createElement("a", "more", "CONSULTAR SISTEMA →");
      link.href = safeLink(item.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      body.appendChild(link);
    }

    card.appendChild(body);
    container.appendChild(card);
  });
}

function renderSources() {
  const container = $("sources");
  if (!container) return;

  container.replaceChildren();

  database.sources.forEach(source => {
    const link = createElement("a", "", source.name || "Fuente oficial");
    link.href = safeLink(source.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    container.appendChild(link);
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
    loadMinimas(),
    loadData()
  ]);

  setInterval(() => {
    loadClassifieds();
    loadMinimas();
    loadData();
  }, REFRESH_INTERVAL);
}

initialize();
