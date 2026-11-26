
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

// ELEMENTOS HTML

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

// UTILIDADES

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
    I: "D1",
    II: "D2",
    III: "D3",
    D1: "D1",
    D2: "D2",
    D3: "D3",
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

// CARGAR DEPORTISTAS

async function loadAthletes() {
  if (resultsCount) {
    resultsCount.textContent = "Cargando deportistas...";
  }

  try {
    const PAGE_SIZE = 1000;
    let allAthletes = [];
    let from = 0;

    while (true) {
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

      if (error) throw error;

      const batch = data || [];
      allAthletes = allAthletes.concat(batch);

      if (batch.length < PAGE_SIZE) break;

      from += PAGE_SIZE;
    }

    athletes = allAthletes;

    populateFilters();
    updateStatistics();
    renderAthletes();

  } catch (error) {
    console.error("Error cargando deportistas:", error);

    if (resultsCount) {
      resultsCount.textContent = "No se pudo cargar el directorio.";
    }

    showMessage(
      "Error de conexión",
      "No se pudo cargar el directorio. Inténtalo de nuevo más tarde."
    );
  }
}

// FILTROS

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
  const sportsMap = new Map();

  athletes.forEach(a => {
    const original = String(a.deporte || "").trim();
    const key = normalizeSport(original);

    if (key && !sportsMap.has(key)) {
      sportsMap.set(key, original);
    }
  });

  const sports = [...sportsMap.values()]
    .sort((a, b) => a.localeCompare(b, "es"));

  const states = [...new Set(
    athletes.map(a => String(a.estado || "").trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "es"));

  const communities = [...new Set(
    athletes.map(a => String(a.comunidad || "").trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "es"));

  const divisions = [...new Set(
    athletes.map(a => normalizeDivision(a.division)).filter(Boolean)
  )].sort();

  populateSelect(sportSelect, sports, "Todos los deportes");
  populateSelect(stateSelect, states, "Todos los estados");
  populateSelect(communitySelect, communities, "Todas las comunidades");
  populateSelect(divisionSelect, divisions, "Todas las divisiones");
}

// ESTADÍSTICAS GENERALES

function updateStatistics() {
  const universities = new Set(
    athletes.map(a => normalizeText(a.universidad)).filter(Boolean)
  );

  const sports = new Set(
    athletes.map(a => normalizeSport(a.deporte)).filter(Boolean)
  );

  if (totalAthletes) totalAthletes.textContent = athletes.length;
  if (totalUniversities) totalUniversities.textContent = universities.size;
  if (totalSports) totalSports.textContent = sports.size;
}

// MENSAJES

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

// TARJETA DE DEPORTISTA

function createAthleteCard(athlete) {
  const card = document.createElement("article");
  card.className = "athlete-card";

  if (athlete.foto_url) {
    const imageContainer = document.createElement("div");
    imageContainer.className = "athlete-photo-container";

    const image = document.createElement("img");
    image.className = "athlete-photo";
    image.src = athlete.foto_url;
    image.alt = `Fotografía de ${athlete.nombre || ""} ${athlete.apellido || ""}`;
    image.loading = "lazy";

    image.onerror = () => imageContainer.remove();

    imageContainer.appendChild(image);
    card.appendChild(imageContainer);
  }

  const sportIcon = document.createElement("div");
  sportIcon.className = "athlete-sport-icon";
  sportIcon.textContent = getSportIcon(athlete.deporte);

  const badge = document.createElement("span");
  badge.className = "athlete-badge";

  const division = normalizeDivision(athlete.division);
  badge.textContent = division ? `NCAA ${division}` : "NCAA";

  const name = document.createElement("h3");
  name.textContent =
    `${athlete.nombre || ""} ${athlete.apellido || ""}`.trim()
    || "Nombre no indicado";

  const university = document.createElement("p");
  university.className = "athlete-university";
  university.textContent = athlete.universidad || "Universidad no indicada";

  const details = document.createElement("div");
  details.className = "athlete-details";

  const fields = [
    ["Deporte", athlete.deporte],
    ["Estado", athlete.estado],
    ["Año universitario", athlete.ano_universidad],
    ["Comunidad", athlete.comunidad]
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

  const profileButton = document.createElement("a");
  profileButton.className = "athlete-profile-button";
  profileButton.href = `deportista/?id=${encodeURIComponent(athlete.id)}`;
  profileButton.textContent = "VER PERFIL →";
  profileButton.setAttribute(
    "aria-label",
    `Ver perfil de ${name.textContent}`
  );

  card.append(
    sportIcon,
    badge,
    name,
    university,
    details,
    profileButton
  );

  return card;
}

// BUSCAR Y FILTRAR

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
      (!sport || normalizeSport(athlete.deporte) === normalizeSport(sport)) &&
      (!division || normalizeDivision(athlete.division) === normalizeDivision(division)) &&
      (!state || athlete.estado === state) &&
      (!community || athlete.comunidad === community)
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
      athletes.length ? "No hay resultados" : "Estamos preparando el directorio",
      athletes.length
        ? "Prueba con otros términos o modifica los filtros."
        : "Pronto incorporaremos más deportistas españoles."
    );
    return;
  }

  filtered.forEach(athlete => {
    athletesContainer.appendChild(createAthleteCard(athlete));
  });
}

// EVENTOS

if (searchInput) {
  searchInput.addEventListener("input", renderAthletes);
}

[
  sportSelect,
  divisionSelect,
  stateSelect,
  communitySelect
].filter(Boolean).forEach(control => {
  control.addEventListener("change", renderAthletes);
});

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

// ACCESO A DEPORTES DESDE LA PORTADA

document.querySelectorAll("[data-sport]").forEach(link => {
  link.addEventListener("click", () => {
    const selectedSport = link.dataset.sport;
    if (!sportSelect) return;

    if (!selectedSport) {
      sportSelect.value = "";
    } else {
      const option = [...sportSelect.options].find(
        option => normalizeSport(option.value) === normalizeSport(selectedSport)
      );

      if (option) sportSelect.value = option.value;
    }

    renderAthletes();
  });
});

// INICIAR

loadAthletes();
