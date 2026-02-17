/**
 * Modal de adicionar cliente - CRM Multi-Nicho
 */

const modal = (function() {
  const MODAL_ID = "modalAddCliente";
  const FORM_ID = "formAddCliente";

  function _setupTemSiteToggle() {
    const form = document.getElementById(FORM_ID);
    if (!form) return;
    const siteInput = form.querySelector("[name=site]");
    const temSiteCheck = form.querySelector("[name=temSite]");
    if (!temSiteCheck || !siteInput) return;
    temSiteCheck.addEventListener("change", function() {
      siteInput.disabled = !temSiteCheck.checked;
      if (!temSiteCheck.checked) siteInput.value = "";
    });
  }

  function open(nichoAtivo, onSaved) {
    const overlay = document.getElementById(MODAL_ID);
    const form = document.getElementById(FORM_ID);
    if (!overlay || !form) return;

    form.reset();
    const nomeInput = form.querySelector("[name=nome]");
    const siteInput = form.querySelector("[name=site]");
    const temSiteCheck = form.querySelector("[name=temSite]");
    if (temSiteCheck && siteInput) {
      temSiteCheck.checked = false;
      siteInput.disabled = true;
    }

    overlay.classList.add("open");
    if (nomeInput) nomeInput.focus();
  }

  function close() {
    const overlay = document.getElementById(MODAL_ID);
    if (overlay) overlay.classList.remove("open");
  }

  function handleSubmit(e, nichoAtivo, onSaved) {
    e.preventDefault();
    const form = e.target;
    const nome = (form.querySelector("[name=nome]")?.value || "").trim();
    if (!nome) {
      alert("O campo Nome é obrigatório.");
      return;
    }

    const telefone = (form.querySelector("[name=telefone]")?.value || "").trim();
    const endereco = (form.querySelector("[name=endereco]")?.value || "").trim();
    const temSiteCheck = form.querySelector("[name=temSite]");
    const temSite = temSiteCheck ? temSiteCheck.checked : false;
    const site = temSite ? (form.querySelector("[name=site]")?.value || "").trim() : "";

    if (state.isDuplicado(nichoAtivo, nome, telefone)) {
      alert("Já existe um cliente com este nome e telefone neste nicho.");
      return;
    }

    state.addCliente(nichoAtivo, {
      nome,
      telefone,
      endereco,
      site,
      temSite,
      status: "novo",
      observacoes: ""
    });

    close();
    if (typeof onSaved === "function") onSaved();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _setupTemSiteToggle);
  } else {
    _setupTemSiteToggle();
  }

  return {
    open,
    close,
    handleSubmit
  };
})();
