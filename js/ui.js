/**
 * Renderização e UI - CRM Multi-Nicho
 */

const ui = (function() {
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function escapeCsv(str) {
    if (str == null) return "";
    const s = String(str);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function renderSidebar(nichoAtivo, onNichoClick) {
    const el = document.getElementById("sidebarList");
    if (!el) return;
    el.innerHTML = Object.entries(NICHOS).map(([key, label]) => {
      const count = state.getClientes(key).length;
      const activeClass = key === nichoAtivo ? " active" : "";
      return `<a href="#" class="sidebar-item${activeClass}" data-nicho="${escapeHtml(key)}">
        <span class="sidebar-label">${escapeHtml(label)}</span>
        <span class="sidebar-count">${count}</span>
      </a>`;
    }).join("");

    el.querySelectorAll(".sidebar-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        onNichoClick(item.dataset.nicho);
      });
    });
  }

  function renderHeader(nicho) {
    const label = NICHOS[nicho] || "Prospecção";
    const h1 = document.getElementById("pageTitle");
    const sub = document.getElementById("pageSubtitle");
    if (h1) h1.textContent = label;
    if (sub) sub.textContent = `Prospecção · ${label} · Use os campos para acompanhar suas vendas`;
  }

  function renderStats(nicho, filtered, total, semSite) {
    const totalEl = document.getElementById("totalCount");
    const filteredEl = document.getElementById("filteredCount");
    const semSiteEl = document.getElementById("semSiteCount");
    if (totalEl) totalEl.textContent = total;
    if (filteredEl) filteredEl.textContent = filtered;
    if (semSiteEl) semSiteEl.textContent = semSite;
  }

  function renderTable(clientes, nicho, onStatusChange, onNotesChange) {
    const tbody = document.getElementById("tbody");
    const emptyMsg = document.getElementById("emptyMsg");
    if (!tbody) return;

    if (clientes.length === 0) {
      tbody.innerHTML = "";
      if (emptyMsg) emptyMsg.style.display = "block";
      return;
    }
    if (emptyMsg) emptyMsg.style.display = "none";

    tbody.innerHTML = clientes.map(c => {
      const tel = (c.telefone || "").trim();
      const telDisplay = tel
        ? `<a href="tel:${tel.replace(/\D/g, "")}">${escapeHtml(tel)}</a>`
        : '<span class="empty">—</span>';
      const siteUrl = (c.site || "").trim();
      const temSite = !!c.temSite || !!siteUrl;
      const siteDisplay = temSite && siteUrl
        ? `<span class="site-ok" title="Tem site">&#10003;</span> <a href="${siteUrl.startsWith("http") ? siteUrl : "https://" + siteUrl}" target="_blank" rel="noopener">${escapeHtml(siteUrl)}</a>`
        : `<span class="site-no" title="Não tem site">&#10007;</span>`;

      const statusOpts = STATUS_OPTS.map(o =>
        `<option value="${o.value}" ${c.status === o.value ? "selected" : ""}>${o.label}</option>`
      ).join("");

      return `
        <tr data-id="${escapeHtml(c.id)}" data-nicho="${escapeHtml(nicho)}">
          <td class="nome">${escapeHtml(c.nome || "")}</td>
          <td class="telefone ${!tel ? "empty" : ""}">${telDisplay}</td>
          <td class="endereco">${escapeHtml(c.endereco || "")}</td>
          <td class="site ${!temSite ? "empty" : ""}">${siteDisplay}</td>
          <td><select class="status-select" data-id="${escapeHtml(c.id)}" data-nicho="${escapeHtml(nicho)}" data-field="status">${statusOpts}</select></td>
          <td><input type="text" class="notes-input" data-id="${escapeHtml(c.id)}" data-nicho="${escapeHtml(nicho)}" data-field="observacoes" value="${escapeHtml(c.observacoes || "")}" placeholder="Anotações de venda"></td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".status-select").forEach(el => {
      el.addEventListener("change", (e) => {
        el.dataset.status = el.value;
        onStatusChange(el.dataset.nicho, el.dataset.id, { status: el.value });
      });
      el.dataset.status = el.value;
    });
    tbody.querySelectorAll(".notes-input").forEach(el => {
      const saveNotes = () => onNotesChange(el.dataset.nicho, el.dataset.id, { observacoes: el.value });
      el.addEventListener("change", saveNotes);
      el.addEventListener("blur", saveNotes);
    });
  }

  function applyFilters(clientes, searchText, statusFilter) {
    let result = clientes;
    const search = (searchText || "").trim().toLowerCase();
    if (search) {
      result = result.filter(c =>
        (c.nome || "").toLowerCase().includes(search) ||
        (c.endereco || "").toLowerCase().includes(search) ||
        (c.telefone || "").toLowerCase().includes(search) ||
        (c.site || "").toLowerCase().includes(search)
      );
    }
    if (statusFilter) {
      result = result.filter(c => (c.status || "") === statusFilter);
    }
    return result;
  }

  function exportCsv(nicho) {
    const clientes = state.getClientes(nicho);
    const headers = ["nome", "telefone", "endereco", "site", "temSite", "status", "observacoes"];
    const rows = clientes.map(c =>
      headers.map(h => escapeCsv(c[h]))
    );
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const label = (NICHOS[nicho] || nicho).replace(/\s+/g, "_").toLowerCase();
    a.download = `prospeccao_${label}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return {
    escapeHtml,
    escapeCsv,
    renderSidebar,
    renderHeader,
    renderStats,
    renderTable,
    applyFilters,
    exportCsv
  };
})();
