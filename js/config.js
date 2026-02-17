/**
 * Configuração do CRM Multi-Nicho
 */

const NICHOS = {
  psicologo: "Psicólogo",
  imobiliaria: "Imobiliária",
  curso_online: "Curso Online",
  dentista: "Dentista",
  clinica_estetica: "Clínica de Estética",
  barbearia: "Barbearia",
  empresa_limpeza: "Empresa de Limpeza",
  coach: "Coach",
  turismo_excursao: "Turismo e Excursão"
};

const STATUS_OPTS = [
  { value: "", label: "—" },
  { value: "novo", label: "Novo" },
  { value: "contatado", label: "Contatado" },
  { value: "interessado", label: "Interessado" },
  { value: "negociacao", label: "Negociação" },
  { value: "fechado", label: "Fechado" },
  { value: "recusado", label: "Recusado" }
];

const STORAGE_KEY = "crm-multinicho-data";
