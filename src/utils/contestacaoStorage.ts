const CONTESTACAO_SUFFIX = 'contestacao';

export function getContestacaoKey(urId: string): string {
  return urId + CONTESTACAO_SUFFIX;
}

export function saveContestacao(urId: string, motivo: string): void {
  localStorage.setItem(getContestacaoKey(urId), motivo);
}

export function getContestacaoMotivo(urId: string): string | null {
  return localStorage.getItem(getContestacaoKey(urId));
}

export function hasContestacao(urId: string): boolean {
  return !!getContestacaoMotivo(urId);
}
