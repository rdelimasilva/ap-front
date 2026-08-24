export interface NonAcceptanceCriteria {
  termEnabled: boolean;
  minTerm: string;
  maxTerm: string;
  valueEnabled: boolean;
  minValue: string;
  maxValue: string;
}

export const STORAGE_PREFIX = 'nonAcceptanceCriteria_';
export const DEFAULT_CRITERIA_KEY = 'nonAcceptanceCriteria_default';

export const defaultCriteria: NonAcceptanceCriteria = {
  termEnabled: false,
  minTerm: '',
  maxTerm: '',
  valueEnabled: false,
  minValue: '',
  maxValue: '',
};

export const loadDefaultCriteria = (): NonAcceptanceCriteria => {
  const saved = localStorage.getItem(DEFAULT_CRITERIA_KEY);
  if (saved) {
    return { ...defaultCriteria, ...JSON.parse(saved) };
  }
  return defaultCriteria;
};

export const saveDefaultCriteria = (criteria: NonAcceptanceCriteria): void => {
  localStorage.setItem(DEFAULT_CRITERIA_KEY, JSON.stringify(criteria));
};

export const hasDefaultCriteria = (): boolean => {
  const saved = localStorage.getItem(DEFAULT_CRITERIA_KEY);
  if (!saved) return false;
  const criteria = JSON.parse(saved) as NonAcceptanceCriteria;
  return criteria.termEnabled || criteria.valueEnabled;
};

export const loadCriteria = (clientId: string): NonAcceptanceCriteria => {
  const saved = localStorage.getItem(STORAGE_PREFIX + clientId);
  if (saved) {
    return { ...defaultCriteria, ...JSON.parse(saved) };
  }
  return defaultCriteria;
};

export const hasClientCriteria = (clientId: string): boolean => {
  const saved = localStorage.getItem(STORAGE_PREFIX + clientId);
  if (!saved) return false;
  const criteria = JSON.parse(saved) as NonAcceptanceCriteria;
  return criteria.termEnabled || criteria.valueEnabled;
};

/** Retorna os critérios efetivos para o cliente: usa a regra específica se existir, senão usa a padrão */
export const getEffectiveCriteria = (clientId: string): { criteria: NonAcceptanceCriteria; source: 'client' | 'default' | 'none' } => {
  if (hasClientCriteria(clientId)) {
    return { criteria: loadCriteria(clientId), source: 'client' };
  }
  if (hasDefaultCriteria()) {
    return { criteria: loadDefaultCriteria(), source: 'default' };
  }
  return { criteria: defaultCriteria, source: 'none' };
};
