
const SUPABASE_URL = "https://qizogdfgjkgzjhdzhnmc.supabase.co";
const SUPABASE_KEY = "sb_publishable_lopHHwGv5NBOfIswGOlJ6Q_qvs2K9X3";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const container = document.getElementById("profileContent");
const athleteId = new URLSearchParams(location.search).get("id");

// ==========================================
// UTILIDADES
// ==========================================

function el(parent, tag, className, value) {
  const node = document.createElement(tag);

  if (className) node.className = className;

  if (value !== undefined && value !== null) {
    node.textContent = value;
  }

  parent.appendChild(node);

  return node;
}

// ==========================================
// VALIDAR FOTOGRAFÍAS
// ==========================================

function validImage(url) {
  try {
    const parsed = new URL(url);

    return ["https:", "http:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ==========================================
// FORMATO DE FECHA ESPAÑOL
// ==========================================

function formatSpanishDate(value) {
  if (!value) return "";

  const text = String(value).trim();

  // YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

// ==========================================
// NORMALIZAR ESTADÍSTICAS JSONB
// ==========================================

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
        item =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item)
      )
    );
  }

  return value && typeof value === "object" ? value : {};
}

// ==========================================
// TRADUCIR NOMBRES DE ESTADÍSTICAS
