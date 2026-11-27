const SUPABASE_URL = "https://qizogdfgjkgzjhdzhnmc.supabase.co";
const SUPABASE_KEY = "sb_publishable_lopHHwGv5NBOfIswGOlJ6Q_qvs2K9X3";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const container = document.getElementById("profileContent");
const athleteId = new URLSearchParams(location.search).get("id");

// UTILIDADES
function el(parent, tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined && value !== null) node.textContent = value;
  parent.appendChild(node);
  return node;
}

function validImage(url) {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// FECHAS
function formatSpanishDate(value) {
  if (!value) return "";
  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) return `${match[3]}/${match[2]}/${match[1]}`;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

// NORMALIZAR ESTADÍSTICAS JSONB
function normalizeStats(value) {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }

  if (Array.isArray(value)) {
    return Object.assign(
      {},
      ...value.filter(
        item => item && typeof item === "object" && !Array.isArray(item)
      )
    );
  }

  return value && typeof value === "object" ? value : {};
}

// TRADUCIR ESTADÍSTICAS
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

  return key.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

// MOSTRAR ESTADÍSTICAS
function renderStats(section, stats, athlete) {
  const sport = String(athlete.deporte || "").toLowerCase();

  const isSwimming =
    sport.includes("natación") ||
    sport.includes("natacion") ||
    sport.includes("swimming") ||
    Boolean(
      stats.piscina_25m ||
      stats.piscina_50m ||
      stats.piscina_yardas ||
      stats.pruebas ||
      stats.mejores_marcas_yardas ||
      stats.mejores_marcas_scm ||
      stats.mejores_marcas_lcm
    );

  const labels = {
    "50_libre": "50 libre",
    "100_libre": "100 libre",
    "200_libre": "200 libre",
    "400_libre": "400 libre",
    "800_libre": "800 libre",
    "1500_libre": "1500 libre",
    "50_mariposa": "50 mariposa",
    "100_mariposa": "100 mariposa",
    "200_mariposa": "200 mariposa",
    "50_espalda": "50 espalda",
    "100_espalda": "100 espalda",
    "200_espalda": "200 espalda",
    "50_braza": "50 braza",
    "100_braza": "100 braza",
    "200_braza": "200 braza",
    "100_estilos": "100 estilos",
    "200_estilos": "200 estilos",
    "400_estilos": "400 estilos"
  };

  function readableLabel(key) {
    const normalized = String(key).toLowerCase().trim();
    if (labels[normalized]) return labels[normalized];

    return String(key)
      .replace(/_/g, " ")
      .replace(/\bscy\b/gi, "SCY")
      .replace(/\bscm\b/gi, "SCM")
      .replace(/\blcm\b/gi, "LCM")
      .replace(/\s+/g, " ")
      .trim();
  }

  function showMarks(title, marks, target = section) {
    if (!marks || typeof marks !== "object" || Array.isArray(marks)) return;

    const validMarks = Object.entries(marks).filter(([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      typeof value !== "object"
    );

    if (!validMarks.length) return;

    const group = el(target, "div", "profile-swim-group");
    el(group, "h3", "profile-swim-title", title);

    const grid = el(group, "div", "profile-stat-grid");

    validMarks.forEach(([key, value]) => {
      const item = el(grid, "div", "profile-stat");
      el(item, "strong", "", String(value));
      el(item, "span", "", readableLabel(key));
    });
  }

  function showRecentResult(title, result) {
    if (!result || typeof result !== "object" || Array.isArray(result)) return;

    const group = el(section, "div", "profile-swim-group");
    el(group, "h3", "profile-swim-title", title);

    if (result.competicion || result.evento || result.nombre) {
      el(
        group,
        "p",
        "profile-biography",
        result.competicion || result.evento || result.nombre
      );
    }

    if (result.fecha) {
      el(group, "p", "profile-season", formatSpanishDate(result.fecha));
    }

    if (result.piscina || result.unidad) {
      el(group, "p", "", result.piscina || result.unidad);
    }

    const excluded = [
      "fecha", "competicion", "evento", "nombre", "piscina", "unidad",
      "temporada", "puesto", "posicion", "lugar"
    ];

    const marks = Object.fromEntries(
      Object.entries(result).filter(([key, value]) =>
        !excluded.includes(key.toLowerCase()) &&
        value !== null &&
        value !== undefined &&
        value !== "" &&
        typeof value !== "object"
      )
    );

    showMarks("Marcas", marks, group);

    if (result.puesto || result.posicion) {
      el(group, "p", "", `Puesto: ${result.puesto || result.posicion}`);
    }
  }

  if (isSwimming) {
    el(section, "h2", "", "Marcas y estadísticas");

    if (stats.temporada || athlete.temporada) {
      el(
        section,
        "p",
        "profile-season",
        `Temporada ${stats.temporada || athlete.temporada}`
      );
    }

    if (stats.unidad || stats.piscina) {
      el(
        section,
        "p",
        "profile-season",
        [stats.piscina, stats.unidad].filter(Boolean).join(" · ")
      );
    }

    const poolGroups = [
      ["Piscina de 25 metros (SCM)", ["piscina_25m", "mejores_marcas_scm", "mejores_marcas_25m"]],
      ["Piscina de 50 metros (LCM)", ["piscina_50m", "mejores_marcas_lcm", "mejores_marcas_50m"]],
      ["Piscina de yardas (SCY)", ["piscina_yardas", "mejores_marcas_yardas", "marcas_personales_scy"]]
    ];

    const renderedKeys = new Set();

    poolGroups.forEach(([title, keys]) => {
      const combined = {};

      keys.forEach(key => {
        const value = stats[key];

        if (value && typeof value === "object" && !Array.isArray(value)) {
          Object.assign(combined, value);
          renderedKeys.add(key);
        }
      });

      showMarks(title, combined);
    });
        const otherMarkKeys = [
      ["Marcas registradas", "pruebas"],
      ["Mejores marcas personales", "mejores_marcas_personales"],
      ["Mejores marcas", "mejores_marcas"],
      ["Marcas", "marcas"],
      ["Mejores marcas de temporada", "mejoras_temporada"],
      ["Mejores marcas 2025-2026", "mejoras_marcas_2025_26"]
    ];

    otherMarkKeys.forEach(([title, key]) => {
      if (renderedKeys.has(key)) return;
      showMarks(title, stats[key]);
      renderedKeys.add(key);
    });

    if (stats.resultados_recientes && typeof stats.resultados_recientes === "object") {
      showRecentResult("Resultados recientes", stats.resultados_recientes);
    }

    Object.entries(stats).forEach(([key, value]) => {
      if (!/^resultados_\d{4}[_-]\d{2,4}$/i.test(key)) return;
      if (!value || typeof value !== "object" || Array.isArray(value)) return;

      showMarks(
        `Resultados de temporada ${key.replace("resultados_", "").replace(/_/g, "-")}`,
        value
      );
    });

    const achievements = stats.logros;

    if (Array.isArray(achievements) && achievements.length) {
      const group = el(section, "div", "profile-swim-group");
      el(group, "h3", "profile-swim-title", "Palmarés y logros");

      const list = el(group, "ul", "profile-achievements");
      achievements.forEach(achievement => el(list, "li", "", String(achievement)));
    }

    const history = stats.historial_competiciones;

    if (Array.isArray(history) && history.length) {
      const group = el(section, "div", "profile-swim-group");
      el(group, "h3", "profile-swim-title", "Historial de competiciones");

      history.forEach(meet => {
        if (!meet || typeof meet !== "object") return;

        const item = el(group, "div", "profile-calendar-item");
        el(item, "strong", "", meet.competicion || meet.evento || "Competición");

        if (meet.fecha || meet.temporada) {
          el(
            item,
            "span",
            "",
            meet.fecha ? formatSpanishDate(meet.fecha) : `Temporada ${meet.temporada}`
          );
        }

        if (meet.piscina || meet.unidad) {
          el(item, "span", "", meet.piscina || meet.unidad);
        }

        if (meet.resultados) {
          showMarks("Resultados", meet.resultados, item);
        }
      });
    }

    return;
  }

  const ignored = [
    "temporada", "deporte", "universidad", "division", "nombre", "apellido"
  ];

  const entries = Object.entries(stats).filter(([key, value]) =>
    !ignored.includes(key.toLowerCase()) &&
    value !== null &&
    value !== undefined &&
    ["string", "number", "boolean"].includes(typeof value)
  );

  if (entries.length) {
    el(section, "h2", "", "Estadísticas");
    const grid = el(section, "div", "profile-stat-grid");

    entries.forEach(([key, value]) => {
      const item = el(grid, "div", "profile-stat");
      el(item, "strong", "", String(value));
      el(item, "span", "", statLabel(key, athlete.deporte));
    });
  }
}

// ERRORES
function showError(title, message) {
  if (!container) return;

  container.replaceChildren();

  const box = el(container, "div", "profile-error");
  el(box, "div", "empty-icon", "🇪🇸");
  el(box, "h2", "", title);
  el(box, "p", "", message);
}

// CONSTRUIR PERFIL
function renderProfile(athlete) {
  container.replaceChildren();

  const card = el(container, "article", "profile-card");
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
    `${athlete.nombre || ""} ${athlete.apellido || ""}`.trim() ||
    "Deportista español";

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

  if (athlete.biografia) {
    const section = el(card, "section", "profile-section");
    el(section, "h2", "", "Biografía");
    el(section, "p", "profile-biography", athlete.biografia);
  }

  const stats = normalizeStats(athlete.estadisticas);
  const statsSection = el(card, "section", "profile-section");
  renderStats(statsSection, stats, athlete);

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

  // CALENDARIO E HISTORIAL
  let events = athlete.calendario;

  if (typeof events === "string") {
    try {
      events = JSON.parse(events);
    } catch {
      events = [];
    }
  }

  if (Array.isArray(events)) {
    const now = new Date();

    const today =
      now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");

    const uniqueEvents = [];
    const seenEvents = new Set();

    events.forEach(event => {
      if (!event || typeof event !== "object") return;

      const signature = JSON.stringify(event);
      if (seenEvents.has(signature)) return;

      seenEvents.add(signature);
      uniqueEvents.push(event);
    });

    const validEvents = uniqueEvents
      .filter(event => Boolean(event.fecha || event.date))
      .sort((a, b) => {
        const dateA = String(a.fecha || a.date);
        const dateB = String(b.fecha || b.date);
        return dateA.localeCompare(dateB);
      });

    const upcomingEvents = validEvents.filter(event =>
      (event.fecha || event.date) >= today
    );

    const pastEvents = validEvents.filter(event =>
      (event.fecha || event.date) < today
    );

    function renderCalendarEvent(section, event, past = false) {
      const item = el(section, "div", "profile-calendar-item");
      const eventDate = event.fecha || event.date;

      el(item, "strong", "", formatSpanishDate(eventDate));

      const eventName =
        event.competicion || event.evento || event.nombre || event.event;

      if (eventName) el(item, "span", "", eventName);
      if (event.lugar) el(item, "span", "", event.lugar);

      el(
        item,
        "span",
        "",
        event.estado || (past ? "Finalizado" : "Próximamente")
      );

      if (event.resultado || event.result) {
        el(item, "span", "", event.resultado || event.result);
      }

      if (
        event.resultados &&
        typeof event.resultados === "object" &&
        !Array.isArray(event.resultados)
      ) {
        const resultGrid = el(item, "div", "profile-stat-grid");

        Object.entries(event.resultados).forEach(([key, value]) => {
          if (
            value === null ||
            value === undefined ||
            value === "" ||
            typeof value === "object"
          ) return;

          const resultItem = el(resultGrid, "div", "profile-stat");
          el(resultItem, "strong", "", String(value));

          el(
            resultItem,
            "span",
            "",
            key === "puesto" || key === "posicion"
              ? "Puesto"
              : key.replace(/_/g, " ")
          );
        });
      }

      if (event.url) {
        const link = el(item, "a", "", "Ver competición");
        link.href = event.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    }
        if (upcomingEvents.length) {
      const section = el(card, "section", "profile-section");
      el(section, "h2", "", "Próximas competiciones");

      upcomingEvents.forEach(event =>
        renderCalendarEvent(section, event, false)
      );
    }

    if (pastEvents.length) {
      const section = el(card, "section", "profile-section");
      el(section, "h2", "", "Resultados e historial");

      pastEvents.slice().reverse().forEach(event =>
        renderCalendarEvent(section, event, true)
      );
    }

    if (!validEvents.length) {
      const section = el(card, "section", "profile-section");
      el(section, "h2", "", "Calendario y resultados");

      el(
        section,
        "p",
        "profile-biography",
        "Todavía no hay competiciones registradas."
      );
    }
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
        console.error("Error al compartir:", error);
      }
    }
  });
}

// CARGAR DATOS DE SUPABASE
async function loadProfile() {
  if (!container) {
    console.error("No existe el elemento profileContent.");
    return;
  }

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

// INICIAR PERFIL
loadProfile();
