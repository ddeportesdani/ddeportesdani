
// ==========================================
// DDEPORTES DANI - DIRECTORIO NCAA
// ==========================================

const SUPABASE_URL = "https://qizogdfgjkgzjhdzhnmc.supabase.co";

const SUPABASE_KEY = "sb_publishable_lopHHwGv5NBOfIswGOlJ6Q_qvs2K9X3";

// Conexión con Supabase
const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Elementos HTML
const searchInput = document.getElementById("search");
const sportSelect = document.getElementById("sport");
const divisionSelect = document.getElementById("division");
const stateSelect = document.getElementById("state");
const communitySelect = document.getElementById("community");
const clearButton = document.getElementById("clearFilters");
const athletesContainer = document.getElementById("athletes");
const resultsCount = document.getElementById("resultsCount");

let athletes = [];

// ==========================================
// NORMALIZAR DIVISIONES
// ==========================================

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

// ==========================================
// CARGAR DEPORTISTAS DESDE SUPABASE
// ==========================================

async function loadAthletes() {
  resultsCount.textContent = "Cargando deportistas...";

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
        universidad
      `)
      .order("apellido", { ascending: true });

    if (error) throw error;

    athletes = data || [];

    populateFilters();
    renderAthletes();

  } catch (error) {
    console.error("Error cargando deportistas:", error);

    resultsCount.textContent = "No se pudo cargar el directorio.";

    athletesContainer.textContent =
      "Estamos teniendo problemas para conectar con el directorio. Inténtalo de nuevo más tarde.";
  }
}

// ==========================================
// CREAR OPCIONES DE LOS FILTROS
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
  const sports = [...new Set(
    athletes.map(a => a.deporte).filter(Boolean)
  )].sort();

  const states = [...new Set(
    athletes.map(a => a.estado).filter(Boolean)
  )].sort();

  const communities = [...new Set(
    athletes.map(a => a.comunidad).filter(Boolean)
  )].sort();

  const divisions = [...new Set(
    athletes.map(a => normalizeDivision(a.division)).filter(Boolean)
  )].sort();

  populateSelect(sportSelect, sports, "Todos los deportes");
  populateSelect(stateSelect, states, "Todos los estados");
  populateSelect(communitySelect, communities, "Todas las comunidades");
  populateSelect(divisionSelect, divisions, "Todas las divisiones");
}

// ==========================================
// MOSTRAR TARJETAS
// ==========================================

function createAthleteCard(athlete) {
  const card = document.createElement("article");
  card.className = "athlete-card";

  const name = document.createElement("h3");
  name.textContent =
    `${athlete.nombre || ""} ${athlete.apellido || ""}`.trim();

  const university = document.createElement("p");
  university.className = "athlete-university";
  university.textContent = athlete.universidad || "Universidad no indicada";

  const details = document.createElement("div");
  details.className = "athlete-details";

  const fields = [
    ["División", normalizeDivision(athlete.division)],
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

  const badge = document.createElement("span");
  badge.className = "athlete-badge";
  badge.textContent = "NCAA " + normalizeDivision(athlete.division);

  card.append(badge, name, university, details);

  return card;
}

// ==========================================
// FILTRAR Y MOSTRAR RESULTADOS
// ==========================================

function renderAthletes() {
  if (!athletesContainer) return;

  const search = (searchInput?.value || "")
    .toLowerCase()
    .trim();

  const sport = sportSelect?.value || "";
  const division = divisionSelect?.value || "";
  const state = stateSelect?.value || "";
  const community = communitySelect?.value || "";

  const filtered = athletes.filter(athlete => {
    const searchable = [
      athlete.nombre,
      athlete.apellido,
      athlete.universidad,
      athlete.deporte,
      athlete.estado,
      athlete.comunidad
    ].join(" ").toLowerCase();

    return (
      searchable.includes(search) &&
      (!sport || athlete.deporte === sport) &&
      (!division || normalizeDivision(athlete.division) === normalizeDivision(division)) &&
      (!state || athlete.estado === state) &&
      (!community || athlete.comunidad === community)
    );
  });

  resultsCount.textContent =
    filtered.length +
    (filtered.length === 1
      ? " deportista encontrado"
      : " deportistas encontrados");

  athletesContainer.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const heading = document.createElement("h3");
    heading.textContent = athletes.length
      ? "No hay resultados"
      : "Estamos preparando el directorio";

    const paragraph = document.createElement("p");
    paragraph.textContent = athletes.length
      ? "Prueba con otros términos o modifica los filtros."
      : "Pronto incorporaremos los primeros deportistas españoles.";

    empty.append(heading, paragraph);
    athletesContainer.appendChild(empty);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "athletes-cards";

  filtered.forEach(athlete => {
    grid.appendChild(createAthleteCard(athlete));
  });

  athletesContainer.appendChild(grid);
}

// ==========================================
// EVENTOS DE BUSQUEDA Y FILTROS
// ==========================================

[
  searchInput,
  sportSelect,
  divisionSelect,
  stateSelect,
  communitySelect
].filter(Boolean).forEach(control => {
  control.addEventListener("input", renderAthletes);
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

// ==========================================
// INICIAR DIRECTORIO
// ==========================================

loadAthletes();
