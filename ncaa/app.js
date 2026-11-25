
const searchInput = document.getElementById("search");
const sportSelect = document.getElementById("sport");
const divisionSelect = document.getElementById("division");
const clearButton = document.getElementById("clearFilters");
const athletesContainer = document.getElementById("athletes");
const resultsCount = document.getElementById("resultsCount");

let athletes = [];

async function loadAthletes() {
  try {
    const response = await fetch("deportistas.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar el directorio");
    }

    athletes = await response.json();
    populateSports();
    renderAthletes();
  } catch (error) {
    console.error(error);
    resultsCount.textContent = "Directorio en preparación";
  }
}

function populateSports() {
  const sports = [...new Set(
    athletes.map(a => a.deporte).filter(Boolean)
  )].sort();

  sports.forEach(sport => {
    const option = document.createElement("option");
    option.value = sport;
    option.textContent = sport;
    sportSelect.appendChild(option);
  });
}

function renderAthletes() {
  const search = searchInput.value.toLowerCase().trim();
  const sport = sportSelect.value;
  const division = divisionSelect.value;

  const filtered = athletes.filter(athlete => {
    const searchable = [
      athlete.nombre,
      athlete.universidad,
      athlete.deporte
    ].join(" ").toLowerCase();

    return searchable.includes(search) &&
      (!sport || athlete.deporte === sport) &&
      (!division || athlete.division === division);
  });

  resultsCount.textContent =
    filtered.length + (filtered.length === 1
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

  filtered.forEach(athlete => {
    const card = document.createElement("article");
    card.className = "athlete-card";

    const name = document.createElement("h3");
    name.textContent = athlete.nombre;

    const university = document.createElement("p");
    university.textContent = athlete.universidad;

    const details = document.createElement("p");
    details.textContent =
      `${athlete.deporte} · División ${athlete.division}`;

    card.append(name, university, details);
    athletesContainer.appendChild(card);
  });
}

[searchInput, sportSelect, divisionSelect].forEach(control => {
  control.addEventListener("input", renderAthletes);
});

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  sportSelect.value = "";
  divisionSelect.value = "";
  renderAthletes();
});

loadAthletes();
