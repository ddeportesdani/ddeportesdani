
const SUPABASE_URL = "https://qizogdfgjkgzjhdzhnmc.supabase.co";
const SUPABASE_KEY = "sb_publishable_lopHHwGv5NBOfIswGOlJ6Q_qvs2K9X3";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const container = document.getElementById("profileContent");
const athleteId = new URLSearchParams(location.search).get("id");

function el(parent, tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined && value !== null) node.textContent = value;
  parent.appendChild(node);
  return node;
}

function validImage(url) {
  
function formatSpanishDate(value) {
  if (!value) return "";

  // Evitar problemas de zona horaria
  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

  try {
    return ["https:", "http:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function normalizeStats(value) {
  if (typeof value === "string") {
    try { value = JSON.parse(value); }
    catch { return {}; }
  }

  if (Array.isArray(value)) {
    return Object.assign({}, ...value.filter(
      item => item && typeof item === "object" && !Array.isArray(item)
    ));
  }

  return value && typeof value === "object" ? value : {};
}

function statLabel(key, sport) {
  const common = {
    games: "Partidos",
    partidos: "Partidos",
    appearances: "Partidos",
    starts: "Titularidades",
    titularidades: "Titularidades",
    minutes: "Minutos",
    minutos: "Minutos",
    points: "Puntos",
    puntos: "Puntos",
    rebounds: "Rebotes",
    rebotes: "Rebotes",
    assists: "Asistencias",
    asistencias: "Asistencias",
    steals: "Robos",
    robos: "Robos",
    blocks: "Tapones",
    tapones: "Tapones",
    goals: "Goles",
    goles: "Goles",
    wins: "Victorias",
    victorias: "Victorias",
    losses: "Derrotas",
    derrotas: "Derrotas",
    tournaments: "Torneos",
    torneos: "Torneos",
    time: "Tiempo",
    tiempo: "Tiempo",
    distance: "Distancia",
    distancia: "Distancia",
    personal_best: "Marca personal",
    marca_personal: "Marca personal",
    aces: "Aces",
    sets_won: "Sets ganados",
    sets_lost: "Sets perdidos",
    podiums: "Podios",
    medals: "Medallas",
    records: "Récords",
    tackles: "Entradas",
    yellow_cards: "Tarjetas amarillas",
    red_cards: "Tarjetas rojas",
    saves: "Paradas",
    clean_sheets: "Porterías a cero",
    birdies: "Birdies",
    eagles: "Eagles",
    pars: "Pares",
    rebounds_per_game: "Rebotes por partido",
    points_per_game: "Puntos por partido",
    assists_per_game: "Asistencias por partido",
    field_goal_percentage: "Porcentaje de tiro",
    three_point_percentage: "Porcentaje de triples",
    free_throw_percentage: "Porcentaje de tiros libres"
  };

  const normalized = key.toLowerCase();

  if (common[normalized]) return common[normalized];

  const sportName = String(sport || "").toLowerCase();

  if (sportName.includes("baloncesto") || sportName.includes("basketball")) {
    if (normalized.includes("rebound")) return "Rebotes";
    if (normalized.includes("assist")) return "Asistencias";
    if (normalized.includes("point")) return "Puntos";
  }

  if (sportName.includes("futbol") || sportName.includes("soccer")) {
    if (normalized.includes("goal")) return "Goles";
    if (normalized.includes("assist")) return "Asistencias";
    if (normalized.includes("save")) return "Paradas";
  }

  if (sportName.includes("tenis") || sportName.includes("tennis")) {
    if (normalized.includes("ace")) return "Aces";
    if (normalized.includes("win")) return "Victorias";
  }

  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function showError(title, message) {
  container.replaceChildren();

  const box = el(container, "div", "profile-error");
  el(box, "div", "empty-icon", "🇪🇸");
  el(box, "h2", "", title);
  el(box, "p", "", message);
}

function renderProfile(athlete) {
  container.replaceChildren();

  const card = el(container, "article", "profile-card");

  // CABECERA

  const cover = el(card, "section", "profile-cover");

  if (validImage(athlete.foto_url)) {
    const image = document.createElement("img");
    image.className = "profile-main-photo";
    image.src = athlete.foto_url;
    image.alt = `Fotografía de ${athlete.nombre || ""} ${athlete.apellido || ""}`;
    image.onerror = () => image.remove();
    cover.appendChild(image);
  }

  const heading = el(cover, "div", "profile-heading");

  const fullName =
    `${athlete.nombre || ""} ${athlete.apellido || ""}`.trim()
    || "Deportista español";

  el(heading, "div", "eyebrow", "DEPORTISTA ESPAÑOL · NCAA");
  el(heading, "h1", "profile-name", fullName);

  el(
    heading,
    "p",
    "profile-university",
    athlete.universidad || "Universidad no indicada"
  );

  const tags = el(heading, "div", "profile-meta");

  [
    athlete.division ? `NCAA ${athlete.division}` : "NCAA",
    athlete.deporte,
    athlete.ano_universidad,
    athlete.temporada
  ].filter(Boolean).forEach(tag => {
    el(tags, "span", "profile-tag", tag);
  });

  // INFORMACIÓN DEPORTIVA

  const fields = [
    ["Deporte", athlete.deporte],
    ["Universidad", athlete.universidad],
    ["División", athlete.division],
    ["Estado", athlete.estado],
    ["Comunidad autónoma", athlete.comunidad],
    ["Año universitario", athlete.ano_universidad],
    ["Temporada", athlete.temporada]
  ].filter(([, value]) => value);

  if (fields.length) {
    const section = el(card, "section", "profile-section");
    el(section, "h2", "", "Información deportiva");

    const grid = el(section, "div", "profile-detail-grid");

    fields.forEach(([label, value]) => {
      const item = el(grid, "div", "profile-detail-item");
      el(item, "span", "", label);
      el(item, "strong", "", value);
    });
  }

  // BIOGRAFÍA

  if (athlete.biografia) {
    const section = el(card, "section", "profile-section");
    el(section, "h2", "", "Biografía");
    el(section, "p", "profile-biography", athlete.biografia);
  }

  // ESTADÍSTICAS DINÁMICAS

  const stats = normalizeStats(athlete.estadisticas);

  const ignored = [
    "temporada",
    "deporte",
    "universidad",
    "division",
    "nombre",
    "apellido"
  ];

  const entries = Object.entries(stats).filter(([key, value]) =>
    !ignored.includes(key.toLowerCase()) &&
    value !== null &&
    value !== undefined &&
    value !== "" &&
    ["string", "number", "boolean"].includes(typeof value)
  );

  if (entries.length) {
    const section = el(card, "section", "profile-section");
    el(section, "h2", "", "Estadísticas");

    const season = athlete.temporada || stats.temporada;

    if (season) {
      el(section, "p", "profile-season", `Temporada ${season}`);
    }

    const grid = el(section, "div", "profile-stat-grid");

    entries.forEach(([key, value]) => {
      const stat = el(grid, "div", "profile-stat");
      el(stat, "strong", "", String(value));
      el(stat, "span", "", statLabel(key, athlete.deporte));
    });
  }

  // GALERÍA

  const photos = [
    athlete.foto_url,
    athlete.foto_competicion_url
  ].filter((url, index, array) =>
    validImage(url) && array.indexOf(url) === index
  );

  if (photos.length) {
    const section = el(card, "section", "profile-section");
    el(section, "h2", "", "Galería de fotografías");

    const gallery = el(section, "div", "profile-gallery");

    photos.forEach((url, index) => {
      const image = document.createElement("img");
      image.src = url;
      image.alt = index === 0
        ? "Fotografía del deportista"
        : "Fotografía de competición";
      image.loading = "lazy";
      image.onerror = () => image.remove();
      gallery.appendChild(image);
    });
  }

  // CALENDARIO

  let events = athlete.calendario;

  if (typeof events === "string") {
    try { events = JSON.parse(events); }
    catch { events = []; }
  }

  if (Array.isArray(events) && events.length) {
    const section = el(card, "section", "profile-section");
    el(section, "h2", "", "Calendario y resultados");

    events.forEach(event => {
      if (!event || typeof event !== "object") return;

      const item = el(section, "div", "profile-calendar-item");

      if (event.fecha || event.date) {
        el(item, "strong", "", event.fecha || event.date);
      }

      if (event.evento || event.nombre || event.event) {
        el(item, "span", "", event.evento || event.nombre || event.event);
      }

      if (event.resultado || event.result) {
        el(item, "span", "", event.resultado || event.result);
      }
    });
  }

  // COMPARTIR

  const share = el(card, "div", "profile-share");
  el(share, "span", "", "Comparte este perfil.");

  const button = el(share, "button", "", "COMPARTIR PERFIL");
  button.type = "button";

  button.addEventListener("click", async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          text: "Descubre este deportista español en la NCAA.",
          url: location.href
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(location.href);
        button.textContent = "ENLACE COPIADO";
      } else {
        button.textContent = "COPIA EL ENLACE DEL NAVEGADOR";
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
      }
    }
  });
}

// CARGAR DATOS

async function loadProfile() {
  if (!athleteId) {
    showError(
      "Perfil no encontrado",
      "No se ha indicado el identificador del deportista."
    );
    return;
  }

  try {
    const { data, error } = await db
      .from("deportistas")
      .select(`
        id,
        estado,
        division,
        nombre,
        apellido,
        deporte,
        ano_universidad,
        comunidad,
        universidad,
        foto_url,
        foto_competicion_url,
        temporada,
        estadisticas,
        calendario,
        biografia
      `)
      .eq("id", athleteId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      showError(
        "Deportista no encontrado",
        "No hemos encontrado este perfil en nuestra base de datos."
      );
      return;
    }

    const fullName =
      `${data.nombre || ""} ${data.apellido || ""}`.trim();

    document.title =
      `${fullName} | Españoles en la NCAA | DDeportes Dani`;

    const description = document.querySelector(
      'meta[name="description"]'
    );

    if (description) {
      description.content =
        `Biografía, trayectoria y estadísticas de ${fullName}, deportista español en la NCAA.`;
    }

    renderProfile(data);

  } catch (error) {
    console.error("Error cargando perfil:", error);

    showError(
      "Error de conexión",
      "No hemos podido cargar la información del deportista."
    );
  }
}

loadProfile();

