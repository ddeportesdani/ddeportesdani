
// ==========================================
// DDEPORTES DANI - ESPAÑOLES EN LA NCAA
// Directorio multideportivo
// ==========================================

const SUPABASE_URL = "https://qizogdfgjkgzjhdzhnmc.supabase.co";
const SUPABASE_KEY = "sb_publishable_lopHHwGv5NBOfIswGOlJ6Q_qvs2K9X3";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ==========================================
// ELEMENTOS HTML
// ==========================================

const searchInput = document.getElementById("search");
const sportSelect = document.getElementById("sport");
const divisionSelect = document.getElementById("division");
const stateSelect = document.getElementById("state");
const communitySelect = document.getElementById("community");
const clearButton = document.getElementById("clearFilters");

const athletesContainer = document.getElementById("athletes");
const resultsCount = document.getElementById("resultsCount");

const totalAthletes = document.getElementById("totalAthletes");
const totalUniversities = document.getElementById("totalUniversities");
const totalSports = document.getElementById("totalSports");

let athletes = [];

// ==========================================
// UTILIDADES
// ==========================================

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeSport(value) {
  return normalizeText(value);
}

function normalizeDivision(value) {
  const v = String(value || "").trim().toUpperCase();

  const divisions = {
    "I": "D1",
    "II": "D2",
    "III": "D3",
    "D1": "D1",
    "D2": "D2",
    "D3": "D3",
    "NCAA D1": "D1",
    "NCAA D2": "D2",
    "NCAA D3": "D3"
  };

  return divisions[v] || v;
}

function getSportIcon(sport) {
  const s = normalizeText(sport);

  const icons = [
    ["baloncesto", "🏀"],
    ["basketball", "🏀"],
    ["futbol", "⚽"],
    ["soccer", "⚽"],
    ["tenis", "🎾"],
    ["tennis", "🎾"],
    ["natacion", "🏊"],
    ["swimming", "🏊"],
    ["atletismo", "🏃"],
    ["track", "🏃"],
    ["cross country", "🏃"],
    ["golf", "⛳"],
    ["voleibol", "🏐"],
    ["volleyball", "🏐"],
    ["gimnasia", "🤸"],
    ["gymnastics", "🤸"],
    ["beisbol", "⚾"],
    ["baseball", "⚾"],
    ["softball", "🥎"],
    ["hockey", "🏑"],
    ["remo", "🚣"],
    ["rowing", "🚣"],
    ["esgrima", "🤺"],
    ["fencing", "🤺"],
    ["lucha", "🤼"],
    ["wrestling", "🤼"],
    ["lacrosse", "🥍"],
    ["buceo", "🤿"],
    ["diving", "🤿"],
    ["ciclismo", "🚴"],
    ["cycling", "🚴"],
    ["equitacion", "🏇"],
    ["equestrian", "🏇"],
    ["water polo", "🤽"],
    ["waterpolo", "🤽"]
  ];

  const match = icons.find(([keyword]) => s.includes(keyword));

  return match ? match[1] : "🏅";
}

// ==========================================
// CARGAR DEPORTISTAS
// ==========================================


async function loadAthletes() {
  if (resultsCount) {
    resultsCount.textContent = "Cargando deportistas...";
  }

  try {
    console.log("Iniciando carga completa de deportistas...");

    const PAGE_SIZE = 1000;
    let allAthletes = [];
    let from = 0;
    let finished = false;

    while (!finished) {
      console.log("SOLICITANDO PÁGINA DESDE:", from);
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


        .order("apellido", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

if (error) {
  console.error("ERROR DE SUPABASE:", error);
  throw error;
}

console.log("REGISTROS RECIBIDOS EN ESTA PÁGINA:", data?.length);
      const batch = data || [];

      allAthletes = allAthletes.concat(batch);

      console.log(
        "Deportistas descargados:",
        allAthletes.length
      );

      if (batch.length < PAGE_SIZE) {
        finished = true;
      } else {
        from += PAGE_SIZE;
      }
    }

    athletes = allAthletes;

    console.log(
      "TOTAL DE DEPORTISTAS CARGADOS:",
      athletes.length
    );

    populateFilters();
    updateStatistics();
    renderAthletes();

  } catch (error) {
    console.error("Error cargando deportistas:", error);

    if (resultsCount) {
      resultsCount.textContent =
        "No se pudo cargar el directorio.";
    }

    if (athletesContainer) {
      showMessage(
        "Error de conexión",
        "No se pudo cargar el directorio completo. Inténtalo de nuevo más tarde."
      );
    }
  }
}


// ==========================================
// FILTROS DINÁMICOS
// ==========================================

function populateSelect(select, values, defaultText) {
  if (!select) return;

  const previousValue = select.value;

  select.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = defaultText;

  select.appendChild(defaultOption);

  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  if (values.includes(previousValue)) {
    select.value = previousValue;
  }
}

function populateFilters() {

  // Eliminar deportes repetidos aunque tengan
  // diferencias de mayúsculas, tildes o espacios.

  const sportsMap = new Map();

  athletes.forEach(a => {
    const original = String(a.deporte || "")
      .replace(/\u00A0/g, " ")
      .trim();

    const key = normalizeSport(original);

    if (key && !sportsMap.has(key)) {
      sportsMap.set(key, original);
    }
  });

  const sports = [...sportsMap.values()]
    .sort((a, b) => a.localeCompare(b, "es"));

  const states = [...new Set(
    athletes
      .map(a => String(a.estado || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "es"));

  const communities = [...new Set(
    athletes
      .map(a => String(a.comunidad || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "es"));

  const divisions = [...new Set(
    athletes
      .map(a => normalizeDivision(a.division))
      .filter(Boolean)
  )].sort();

  populateSelect(
    sportSelect,
    sports,
    "Todos los deportes"
  );

  populateSelect(
    stateSelect,
    states,
    "Todos los estados"
  );

  populateSelect(
    communitySelect,
    communities,
    "Todas las comunidades"
  );

  populateSelect(
    divisionSelect,
    divisions,
    "Todas las divisiones"
  );

  console.log("Deportes únicos:", sports);
}

// ==========================================
// ESTADÍSTICAS GENERALES
// ==========================================

function updateStatistics() {

  const universities = new Set(
    athletes
      .map(a => normalizeText(a.universidad))
      .filter(Boolean)
  );

  const sports = new Set(
    athletes
      .map(a => normalizeSport(a.deporte))
      .filter(Boolean)
  );

  if (totalAthletes) {
    totalAthletes.textContent = athletes.length;
  }

  if (totalUniversities) {
    totalUniversities.textContent = universities.size;
  }

  if (totalSports) {
    totalSports.textContent = sports.size;
  }
}

// ==========================================
// MENSAJES
// ==========================================

function showMessage(title, message) {
  if (!athletesContainer) return;

  const empty = document.createElement("div");
  empty.className = "empty-state";

  const icon = document.createElement("div");
  icon.className = "empty-icon";
  icon.textContent = "🇪🇸";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  empty.append(icon, heading, paragraph);

  athletesContainer.replaceChildren(empty);
}

// ==========================================
// CREAR TARJETA DE DEPORTISTA
// ==========================================



function createAthleteCard(athlete) {
  const card = document.createElement("article");
  card.className = "athlete-card";

  
// FOTOGRAFÍA PRINCIPAL
if (athlete.foto_url) {
  const imageContainer = document.createElement("div");
  imageContainer.className = "athlete-photo-container";

  const image = document.createElement("img");
  image.className = "athlete-photo";
  image.style.setProperty("width", "90px", "important");
image.style.setProperty("height", "90px", "important");
image.style.setProperty("max-width", "90px", "important");
image.style.setProperty("max-height", "90px", "important");
image.style.setProperty("object-fit", "cover", "important");
image.style.setProperty("border-radius", "50%", "important");
image.style.setProperty("display", "block", "important");

imageContainer.style.setProperty("width", "90px", "important");
imageContainer.style.setProperty("height", "90px", "important");
imageContainer.style.setProperty("max-width", "90px", "important");
imageContainer.style.setProperty("max-height", "90px", "important");
imageContainer.style.setProperty("overflow", "hidden", "important");
imageContainer.style.setProperty("margin", "0 auto 15px", "important");
  image.src = athlete.foto_url;
  image.alt = `Fotografía de ${athlete.nombre || ""} ${athlete.apellido || ""}`;
  image.loading = "lazy";

  image.onerror = () => imageContainer.remove();

  imageContainer.appendChild(image);
  card.appendChild(imageContainer);
}


  // ICONO DEL DEPORTE
  const sportIcon = document.createElement("div");
  sportIcon.className = "athlete-sport-icon";
  sportIcon.textContent = getSportIcon(athlete.deporte);

  // DIVISIÓN
  const badge = document.createElement("span");
  badge.className = "athlete-badge";

  const division = normalizeDivision(athlete.division);

  badge.textContent = division
    ? "NCAA " + division
    : "NCAA";

  // NOMBRE
  const name = document.createElement("h3");
  name.textContent =
    `${athlete.nombre || ""} ${athlete.apellido || ""}`.trim()
    || "Nombre no indicado";

  // UNIVERSIDAD
  const university = document.createElement("p");
  university.className = "athlete-university";
  university.textContent =
    athlete.universidad || "Universidad no indicada";

  // INFORMACIÓN GENERAL
  const details = document.createElement("div");
  details.className = "athlete-details";

  const fields = [
    ["Deporte", athlete.deporte],
    ["Estado", athlete.estado],
    ["Año universitario", athlete.ano_universidad],
    ["Comunidad", athlete.comunidad],
    ["Temporada", athlete.temporada]
  ];

  fields.forEach(([label, value]) => {
    if (!value) return;

    const detail = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = label + ": ";

    const span = document.createElement("span");
    span.textContent = value;

    detail.append(strong, span);
    details.appendChild(detail);
  });

  card.append(sportIcon, badge, name, university, details);

  // BIOGRAFÍA
  if (athlete.biografia) {
    const biography = document.createElement("div");
    biography.className = "athlete-biography";

    const heading = document.createElement("h4");
    heading.textContent = "Trayectoria";

    const paragraph = document.createElement("p");
    paragraph.textContent = athlete.biografia;

    biography.append(heading, paragraph);
    card.appendChild(biography);
  }

  // ESTADÍSTICAS
  if (athlete.estadisticas) {
    const statistics = document.createElement("div");
    statistics.className = "athlete-statistics";

    const heading = document.createElement("h4");
    heading.textContent = "Estadísticas";

    statistics.appendChild(heading);

    const stats = athlete.estadisticas;

    Object.entries(stats).forEach(([key, value]) => {
      if (
        value === null ||
        value === undefined ||
        typeof value === "object"
      ) return;

      const row = document.createElement("p");

      const label = document.createElement("strong");
      label.textContent = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase()) + ": ";

      const content = document.createElement("span");
      content.textContent = String(value);

      row.append(label, content);
      statistics.appendChild(row);
    });

    card.appendChild(statistics);
  }

  // FOTOGRAFÍA COMPITIENDO
  if (athlete.foto_competicion_url) {
    const competition = document.createElement("div");
    competition.className = "athlete-competition";

    const heading = document.createElement("h4");
    heading.textContent = "En competición";

    const image = document.createElement("img");
    image.src = athlete.foto_competicion_url;
    image.alt = `Imagen de ${athlete.nombre || ""} compitiendo`;
    image.loading = "lazy";

    image.onerror = () => competition.remove();

    competition.append(heading, image);
    card.appendChild(competition);
  }

  // CALENDARIO
  if (Array.isArray(athlete.calendario) && athlete.calendario.length) {
    const calendar = document.createElement("div");
    calendar.className = "athlete-calendar";

    const heading = document.createElement("h4");
    heading.textContent = "Calendario deportivo";

    calendar.appendChild(heading);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = [...athlete.calendario]
      .filter(event => event.fecha && event.evento)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const upcoming = events.filter(event => {
      const date = new Date(event.fecha + "T00:00:00");
      return date >= today;
    });

    const displayedEvents = upcoming.length
      ? upcoming.slice(0, 4)
      : events.slice(-3).reverse();

    displayedEvents.forEach(event => {
      const item = document.createElement("div");
      item.className = "calendar-event";

      const date = document.createElement("span");
      date.className = "calendar-date";

      date.textContent = new Date(
        event.fecha + "T12:00:00"
      ).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      const eventName = document.createElement("span");
      eventName.className = "calendar-event-name";
      eventName.textContent = event.evento;

      item.append(date, eventName);

      if (event.resultado) {
        const result = document.createElement("span");
        result.className = "calendar-result";
        result.textContent = event.resultado;
        item.appendChild(result);
      }

      calendar.appendChild(item);
    });

    const note = document.createElement("p");
    note.className = "calendar-note";
    note.textContent = "Calendario del equipo. La participación individual debe confirmarse.";

    calendar.appendChild(note);
    card.appendChild(calendar);
  }

  return card;
}


// ==========================================
// BUSCAR Y FILTRAR
// ==========================================

function renderAthletes() {

  if (!athletesContainer) return;

  const search = normalizeText(searchInput?.value);
  const sport = sportSelect?.value || "";
  const division = divisionSelect?.value || "";
  const state = stateSelect?.value || "";
  const community = communitySelect?.value || "";

  const filtered = athletes.filter(athlete => {

    const searchable = normalizeText([
      athlete.nombre,
      athlete.apellido,
      athlete.universidad,
      athlete.deporte,
      athlete.estado,
      athlete.comunidad
    ].join(" "));

    return (
      searchable.includes(search) &&

      (!sport ||
        normalizeSport(athlete.deporte) ===
        normalizeSport(sport)) &&

      (!division ||
        normalizeDivision(athlete.division) ===
        normalizeDivision(division)) &&

      (!state ||
        athlete.estado === state) &&

      (!community ||
        athlete.comunidad === community)
    );
  });

  if (resultsCount) {
    resultsCount.textContent =
      filtered.length +
      (filtered.length === 1
        ? " DEPORTISTA ENCONTRADO"
        : " DEPORTISTAS ENCONTRADOS");
  }

  athletesContainer.replaceChildren();

  if (filtered.length === 0) {

    showMessage(
      athletes.length
        ? "No hay resultados"
        : "Estamos preparando el directorio",

      athletes.length
        ? "Prueba con otros términos o modifica los filtros."
        : "Pronto incorporaremos más deportistas españoles."
    );

    return;
  }

  filtered.forEach(athlete => {
    athletesContainer.appendChild(
      createAthleteCard(athlete)
    );
  });
}

// ==========================================
// EVENTOS
// ==========================================

// Buscador

if (searchInput) {
  searchInput.addEventListener("input", renderAthletes);
}

// Desplegables

[
  sportSelect,
  divisionSelect,
  stateSelect,
  communitySelect
].filter(Boolean).forEach(control => {
  control.addEventListener("change", renderAthletes);
});

// Limpiar filtros

if (clearButton) {
  clearButton.addEventListener("click", () => {

    if (searchInput) searchInput.value = "";
    if (sportSelect) sportSelect.value = "";
    if (divisionSelect) divisionSelect.value = "";
    if (stateSelect) stateSelect.value = "";
    if (communitySelect) communitySelect.value = "";

    renderAthletes();
  });
}

// ==========================================
// ACCESO A DEPORTES DESDE LA PORTADA
// ==========================================

document.querySelectorAll("[data-sport]").forEach(link => {

  link.addEventListener("click", () => {

    const selectedSport = link.dataset.sport;

    if (!sportSelect) return;

    if (!selectedSport) {
      sportSelect.value = "";
    } else {

      const option = [...sportSelect.options].find(
        option =>
          normalizeSport(option.value) ===
          normalizeSport(selectedSport)
      );

      if (option) {
        sportSelect.value = option.value;
      }
    }

    renderAthletes();
  });
});

// ==========================================
// INICIAR DIRECTORIO
// ==========================================

loadAthletes();

