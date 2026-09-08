// Peças compartilhadas da jornada de contratos CERC (AP007). Estavam
// duplicadas entre a lista (ContratosCercList) e o modal de detalhe
// (ContratoDetailModal), que ficam a um clique de distância: o mesmo contrato
// aparecia como "Registrado" na lista e "REGISTRADO" no modal.

export const STATUS_LABEL: Record<string, string> = {
  ENVIANDO: 'Enviando',
  AGUARDANDO_WEBHOOK: 'Aguardando confirmação',
  REJEITADO_ESTRUTURAL: 'Rejeitado (estrutural)',
  REGISTRADO: 'Registrado',
  REJEITADO: 'Rejeitado',
  PENDENTE_CONCILIACAO: 'Pendente de conciliação',
  ATUALIZANDO: 'Atualizando',
  INATIVANDO: 'Inativando',
  BAIXANDO: 'Baixando',
  RESILINDO_PARCIAL: 'Resilindo (parcial)',
  RESILINDO_TOTAL: 'Resilindo (total)',
  INATIVADO: 'Inativado',
  BAIXADO: 'Baixado',
  RESILIDO_PARCIAL: 'Resilido (parcial)',
  RESILIDO_TOTAL: 'Resilido (total)',
};

export const STATUS_COLOR: Record<string, string> = {
  ENVIANDO: 'bg-gray-100 text-gray-700',
  AGUARDANDO_WEBHOOK: 'bg-yellow-100 text-yellow-800',
  REJEITADO_ESTRUTURAL: 'bg-red-100 text-red-800',
  REGISTRADO: 'bg-green-100 text-green-800',
  REJEITADO: 'bg-red-100 text-red-800',
  PENDENTE_CONCILIACAO: 'bg-orange-100 text-orange-800',
  ATUALIZANDO: 'bg-yellow-100 text-yellow-800',
  INATIVANDO: 'bg-yellow-100 text-yellow-800',
  BAIXANDO: 'bg-yellow-100 text-yellow-800',
  RESILINDO_PARCIAL: 'bg-yellow-100 text-yellow-800',
  RESILINDO_TOTAL: 'bg-yellow-100 text-yellow-800',
  INATIVADO: 'bg-gray-200 text-gray-700',
  BAIXADO: 'bg-gray-200 text-gray-700',
  RESILIDO_PARCIAL: 'bg-gray-200 text-gray-700',
  RESILIDO_TOTAL: 'bg-gray-200 text-gray-700',
};

// Um status novo no backend (a máquina de estados tem transições sem endpoint
// ainda) cai no cru em vez de sumir da tela.
export function rotuloStatus(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

export function classeBadgeStatus(status: string): string {
  return `inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-700'}`;
}

export function formatarData(iso: string | null): string {
  if (!iso) return '—';
  // Datas "só data" (YYYY-MM-DD, sem T) são interpretadas como UTC pelo
  // Date nativo — em fusos negativos (ex.: America/Sao_Paulo) isso exibia
  // um dia a menos. Forçar meia-noite local quando não há componente de hora.
  const data = iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(data);
}

export function formatarValor(v: number | null): string {
  if (v === null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

// Regra da spec §9: acima disto a lista de credenciadoras/arranjos deixa de
// ser um recorte útil e vira ruído, e o formulário cai para a sentinela
// "todas" (99T). Vale nas duas pontas — quem monta o contexto no radar
// (ScheduleView) e quem semeia o formulário a partir dele (NewContratoModal)
// —, e por isso mora aqui: dois valores separados podiam divergir em silêncio.
export const LIMITE_LISTA_CONTEXTO = 10;
