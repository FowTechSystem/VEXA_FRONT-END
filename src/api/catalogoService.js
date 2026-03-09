// src/api/catalogoService.js
// Armazena catálogos em localStorage (futuro: API dedicada com URL por cliente)

const STORAGE_KEY = "vexa_catalogos";

function listarCatalogos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data;
  } catch {
    return {};
  }
}

function gerarId() {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const catalogoService = {
  criar: (dados) => {
    const id = gerarId();
    const catalogos = listarCatalogos();
    catalogos[id] = {
      id,
      ...dados,
      criadoEm: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalogos));
    return id;
  },

  getById: (id) => {
    const catalogos = listarCatalogos();
    return catalogos[id] ?? null;
  },

  getLinkPublico: (catalogoId) => {
    const base = window.location.origin;
    return `${base}/catalogo-publico/${catalogoId}`;
  },
};
