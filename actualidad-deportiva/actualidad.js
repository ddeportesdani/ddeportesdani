
/* ==========================================
   DDEPORTES DANI - ACTUALIDAD DEPORTIVA
   Supabase + actualidad.json
========================================== */

const DATA_URL = "../data/actualidad.json";
const REFRESH_INTERVAL = 5 * 60 * 1000;

// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = "https://supabase.com/dashboard/project/qizogdfgjkgzjhdzhnmc";
const SUPABASE_ANON_KEY = "sb_publishable_lopHHwGv5NBOfIswGOlJ6Q_qvs2K9X3";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// BASE DE DATOS LOCAL
let database = {
  news: [],
  athletes: [],
  minimums: [],
  systems: [],
  sources: [],
  updatedAt: null
};

let classifiedData = [];

const $ = id => document.getElementById(id);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
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
   CARGAR JSON
========================================== */

async function loadData() {
  try {
    const response = await fetch(
      DATA_URL + "?t=" + Date.now(),
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("No se pudo cargar actualidad.json");
    }

    const incoming = await response.json();

    database = {
      news: Array.isArray(incoming.news) ? incoming.news : [],
      athletes: Array.isArray(incoming.athletes) ? incoming.athletes : [],
      minimums: Array.isArray(incoming.minimums) ? incoming.minimums : [],
      systems: Array.isArray(incoming.systems) ? incoming.systems : [],
      sources: Array.isArray(incoming.sources) ? incoming.sources : [],
      updatedAt: incoming.updatedAt || null
    };

    renderNews();
    renderAthletes();
    renderMinimums();
    renderSystems();
    renderSources();

  } catch (error) {
    console.error("Error cargando JSON:", error);
  }
}

/* ==========================================
   NOTICIAS
========================================== */

function renderNews() {
  const container = $("news");
  if (!container) return;

  container.replaceChildren();

  if (!database.news.length) {
    container.append(
      element("p", "empty", "No hay noticias publicadas.")
    );
    return;
  }

  database.news.forEach(item => {
    const card = element("article", "news-card");

    const image = element("div", "news-image", "🏅");

    if (item.image) {
      const img = element("img");
      img.src = safeLink(item.image);
      img.alt = item.title || "Noticia deportiva";
      img.loading = "lazy";
      img.style.width = "100%";
      img.style.height = "180px";
      img.style.objectFit = "cover";
      image.replaceChildren(img);
    }

    card.append(image);

    const body = element("div", "news-content");

    body.append(element(
      "span",
      "category",
      item.category || "Deporte"
    ));

    body.append(element("h3", "", item.title || "Noticia"));
    body.append(element("p", "", item.summary || ""));

    if (item.url) {
      const link = element("a", "more", "LEER NOTICIA →");
      link.href = safeLink(item.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      body.append(link);
    }

    card.append(body);
    container.append(card);
  });
}

/* ==========================================
   DEPORTISTAS DEL JSON
========================================== */

function renderAthletes() {
  const tbody = $("athletes");
  if (!tbody) return;

  tbody.replaceChildren();

  const sport = $("sport-filter")?.value || "";
  const type = $("type-filter")?.value || "";

  const filtered = database.athletes.filter(a => {
    const athleteSport = a.sport || a.deporte;
    const athleteType = a.type || a.tipo;

    return (
      (!sport || athleteSport === sport) &&
      (!type || normalize(athleteType) === normalize(type))
    );
  });

  if (!filtered.length) {
    const row = element("tr");
    const cell = element(
      "td",
      "",
      "No hay deportistas adicionales en el archivo de actualidad."
    );
    cell.colSpan = 5;
    row.append(cell);
    tbody.append(row);
    return;
  }

  filtered.forEach(a => {
    const row = element("tr");

    [
      a.name || a.nombre,
      a.sport || a.deporte,
      a.event || a.competicion,
      a.type || a.tipo,
      a.status || a.estado || "Pendiente"
    ].forEach(value => {
      row.append(element("td", "", value || "—"));
    });

    tbody.append(row);
  });
}

/* ==========================================
   MINIMAS
========================================== */

function renderMinimums() {
  const container = $("minimums");
  if (!container) return;

  container.replaceChildren();

  if (!database.minimums.length) {
    container.append(
      element("p", "empty", "No hay mínimas publicadas.")
    );
    return;
  }

  database.minimums.forEach(m => {
    const card = element("article", "data-card");
    const body = element("div", "data-content");

    body.append(element("h3", "", m.sport || m.deporte || "Deporte"));
    body.append(element("p", "", "Competición: " + (m.event || m.competicion || "—")));
    body.append(element("p", "", "Prueba: " + (m.discipline || m.modalidad || "—")));
    body.append(element("p", "", "Marca: " + (m.mark || m.minima || "Consultar documento")));

    if (m.source || m.fuente_url) {
      const link = element("a", "more", "CONSULTAR FUENTE →");
      link.href = safeLink(m.source || m.fuente_url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      body.append(link);
    }

    card.append(body);
    container.append(card);
  });
}

/* ==========================================
   SISTEMAS DE CLASIFICACION
========================================== */

function renderSystems() {
  const container = $("systems-grid");
  if (!container) return;

  container.replaceChildren();

  database.systems.forEach(item => {
    const card = element("article", "data-card");
    const body = element("div", "data-content");

    body.append(element("h3", "", item.sport || "Deporte"));
    body.append(element("p", "", item.event || ""));
    body.append(element("p", "", item.description || ""));

    if (item.url) {
      const link = element("a", "more", "VER SISTEMA →");
      link.href = safeLink(item.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      body.append(link);
    }

    card.append(body);
    container.append(card);
  });
}

/* ==========================================
   FUENTES
========================================== */

function renderSources() {
  const container = $("sources-list");
  if (!container) return;

  container.replaceChildren();

  database.sources.forEach(source => {
    const link = element("a", "", source.name || "Fuente oficial");
    link.href = safeLink(source.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    container.append(link);
  });
}

/* ==========================================
   CARGAR CLASIFICADOS DESDE SUPABASE
========================================== */

async function loadClassifieds() {
  try {
    console.log("Cargando clasificados desde Supabase...");

    const { data: classifications, error: classError } =
      await supabaseClient
        .from("clasificados")
        .select("*")
        .order("created_at", { ascending: false });

    if (classError) throw classError;

    if (!classifications || classifications.length === 0) {
      classifiedData = [];
      renderClassifieds();
      return;
    }

    const ids = [
      ...new Set(classifications.map(c => c.deportista_id))
    ];

    const { data: athletes, error: athleteError } =
      await supabaseClient
        .from("deportistas_actualidad")
        .select("*")
        .in("id", ids);

    if (athleteError) throw athleteError;

    const athleteMap = new Map(
      (athletes || []).map(a => [String(a.id), a])
    );

    classifiedData = classifications.map(c => ({
      ...c,
      athlete: athleteMap.get(String(c.deportista_id))
    }));

    console.log("Clasificados recibidos:", classifiedData);

    renderClassifieds();

  } catch (error) {
    console.error("Error cargando clasificados:", error);

    const nominal = $("classified-athletes");
    const places = $("classified-places");

    if (nominal) {
      nominal.replaceChildren(
        element("p", "empty", "No se han podido cargar los clasificados.")
      );
    }

    if (places) {
      places.replaceChildren();
    }
  }
}

/* ==========================================
   MOSTRAR CLASIFICADOS
========================================== */

function renderClassifieds() {
  const nominal = $("classified-athletes");
  const places = $("classified-places");

  if (!nominal || !places) {
    console.error("No se encuentran los contenedores de clasificados.");
    return;
  }

  nominal.replaceChildren();
  places.replaceChildren();

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
      normalize(item.estado) === "plaza no nominal";

    const card = element("article", "classified-card");

    if (athlete.fotografia) {
      const img = element("img");
      img.src = safeLink(athlete.fotografia);
      img.alt = athlete.nombre || "Deportista";
      img.loading = "lazy";
      card.append(img);
    }

    card.append(element("span", "category",
      athlete.tipo === "paralimpico" ? "PARALÍMPICO" : "OLÍMPICO"
    ));

    card.append(element("h3", "", athlete.nombre || "Sin nombre"));
    card.append(element("p", "", athlete.deporte || "—"));

    if (athlete.modalidad) {
      card.append(element("p", "", "Modalidad: " + athlete.modalidad));
    }

    card.append(element("p", "", item.competicion || "—"));

    card.append(element(
      "span",
      isPlace ? "status non-nominal" : "status",
      item.estado || "Pendiente"
    ));

    if (athlete.federacion) {
      card.append(element("p", "", athlete.federacion));
    }

    if (item.fecha_clasificacion) {
      card.append(element(
        "p",
        "",
        "Fecha: " + new Date(
          item.fecha_clasificacion + "T00:00:00"
        ).toLocaleDateString("es-ES")
      ));
    }

    if (item.observaciones) {
      card.append(element("p", "", item.observaciones));
    }

    if (item.fuente_url) {
      const link = element("a", "more", "CONSULTAR FUENTE →");
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
    nominal.append(element(
      "p", "empty", "No hay clasificados nominales."
    ));
  }

  if (!placesCount) {
    places.append(element(
      "p", "empty", "No hay plazas no nominales."
    ));
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

function populateFilters() {
  const select = $("sport-filter");
  if (!select) return;

  const values = [
    ...classifiedData.map(c => c.athlete?.deporte),
    ...database.athletes.map(a => a.sport || a.deporte)
  ];

  const previous = select.value;

  select.replaceChildren(
    element("option", "", "Todos los deportes")
  );

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

/* ==========================================
   INICIALIZACION
========================================== */

function initialize() {
  const sportFilter = $("sport-filter");
  const typeFilter = $("type-filter");

  if (sportFilter) {
    sportFilter.addEventListener("change", () => {
      renderAthletes();
      renderClassifieds();
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", () => {
      renderAthletes();
      renderClassifieds();
    });
  }

  loadData();

  loadClassifieds().then(() => {
    populateFilters();
    renderClassifieds();
    renderAthletes();
  });

  setInterval(() => {
    loadData();

    loadClassifieds().then(() => {
      populateFilters();
      renderClassifieds();
      renderAthletes();
    });
  }, REFRESH_INTERVAL);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
