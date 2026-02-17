/**
 * Estado global e persistência - CRM Multi-Nicho
 */

const state = (function() {
  let _nichos = {};

  function _getEmptyNichos() {
    const empty = {};
    for (const key of Object.keys(NICHOS)) {
      empty[key] = [];
    }
    return empty;
  }

  function _normalizeNome(str) {
    return (str || "").trim().toLowerCase();
  }

  function _normalizeTelefone(str) {
    return (str || "").replace(/\D/g, "");
  }

  function _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function _migrateLegacy(arr) {
    return (arr || []).map(c => ({
      id: c.id || _generateId(),
      nome: (c.nome || "").trim(),
      telefone: (c.telefone || "").trim(),
      endereco: (c.endereco || "").trim(),
      site: (c.site || "").trim(),
      temSite: !!(c.site || "").trim(),
      status: c.status || "novo",
      observacoes: (c.observacoes || "").trim()
    }));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.nichos && typeof parsed.nichos === "object") {
          _nichos = { ..._getEmptyNichos(), ...parsed.nichos };
          return;
        }
      }

      const legacyRaw = localStorage.getItem("prospeccao-clinicas-data");
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (Array.isArray(legacy) && legacy.length > 0) {
          _nichos = _getEmptyNichos();
          _nichos.clinica_estetica = _migrateLegacy(legacy);
          saveState();
          localStorage.removeItem("prospeccao-clinicas-data");
          return;
        }
      }
    } catch (_) {}

    if (typeof DADOS_PYTHON !== "undefined" && DADOS_PYTHON && typeof DADOS_PYTHON === "object") {
      _nichos = { ..._getEmptyNichos() };
      for (const key of Object.keys(NICHOS)) {
        const arr = DADOS_PYTHON[key];
        _nichos[key] = Array.isArray(arr) ? arr.slice() : [];
      }
    } else {
      _nichos = _getEmptyNichos();
    }
    saveState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nichos: _nichos }));
    } catch (_) {}
  }

  function getClientes(nicho) {
    return Array.isArray(_nichos[nicho]) ? _nichos[nicho] : [];
  }

  function isDuplicado(nicho, nome, telefone, excludeId) {
    const nNorm = _normalizeNome(nome);
    const tNorm = _normalizeTelefone(telefone);
    const clientes = getClientes(nicho);
    for (const c of clientes) {
      if (excludeId && c.id === excludeId) continue;
      const cn = _normalizeNome(c.nome);
      const ct = _normalizeTelefone(c.telefone);
      if (cn === nNorm && ct === tNorm) return true;
    }
    return false;
  }

  function addCliente(nicho, cliente) {
    if (!_nichos[nicho]) _nichos[nicho] = [];
    const c = {
      id: cliente.id || _generateId(),
      nome: (cliente.nome || "").trim(),
      telefone: (cliente.telefone || "").trim(),
      endereco: (cliente.endereco || "").trim(),
      site: (cliente.site || "").trim(),
      temSite: !!cliente.temSite,
      status: cliente.status || "novo",
      observacoes: (cliente.observacoes || "").trim()
    };
    _nichos[nicho].push(c);
    saveState();
    return c;
  }

  function updateCliente(nicho, id, campos) {
    const clientes = getClientes(nicho);
    const idx = clientes.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const allowed = ["status", "observacoes"];
    for (const k of allowed) {
      if (campos[k] !== undefined) clientes[idx][k] = campos[k];
    }
    saveState();
    return true;
  }

  return {
    loadState,
    saveState,
    getClientes,
    addCliente,
    updateCliente,
    isDuplicado,
    getNichos: () => ({ ..._nichos })
  };
})();
