export interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}

export const glossary: Record<string, GlossaryTerm> = {
  'opt-in': {
    term: 'Opt-in',
    definition: 'Autorização do cliente para que a instituição financeira possa acessar e consultar seus recebíveis junto aos adquirentes (maquininhas). É o primeiro passo obrigatório antes de criar qualquer operação.',
    category: 'Formalização'
  },
  'ur': {
    term: 'UR (Unidade de Recebível)',
    definition: 'Representa um título a receber futuro do cliente. Cada transação aprovada na maquininha gera uma UR que será liquidada na data prevista. É a menor unidade de um recebível.',
    category: 'Recebíveis'
  },
  'domicilio': {
    term: 'Domicílio de Liquidação',
    definition: 'Conta bancária onde os valores dos recebíveis serão depositados após a liquidação. Pode ser uma conta do cliente ou da instituição financeira, dependendo da operação.',
    category: 'Liquidação'
  },
  'antecipacao': {
    term: 'Antecipação',
    definition: 'Operação onde o cliente recebe antecipadamente valores que só seriam pagos no futuro, mediante o pagamento de uma taxa. É como um empréstimo garantido pelos recebíveis.',
    category: 'Operações'
  },
  'garantia': {
    term: 'Garantia Automática',
    definition: 'Colateral oferecido automaticamente para assegurar uma operação de crédito. No caso de recebíveis, os valores futuros a receber servem como garantia do empréstimo.',
    category: 'Operações'
  },
  'business-flow': {
    term: 'Business Flow',
    definition: 'Etapa atual do cliente no processo de formalização e ativação. Mostra em que fase do fluxo comercial o cliente se encontra (onboarding, análise, contrato, ativo).',
    category: 'Formalização'
  },
  'formalizacao': {
    term: 'Formalização',
    definition: 'Processo completo de criação, validação e assinatura de contratos entre a instituição financeira e o cliente. Inclui opt-in, análise de crédito e assinatura de documentos.',
    category: 'Formalização'
  },
  'liquidacao': {
    term: 'Liquidação',
    definition: 'Pagamento efetivo dos valores na data de vencimento. É quando o adquirente (maquininha) transfere o dinheiro para a conta de domicílio cadastrada.',
    category: 'Liquidação'
  },
  'reconciliacao': {
    term: 'Reconciliação',
    definition: 'Processo de conferência entre os valores esperados (URs registradas) e os valores efetivamente recebidos (liquidados). Identifica divergências e problemas.',
    category: 'Liquidação'
  },
  'ccb': {
    term: 'CCB (Cédula de Crédito Bancário)',
    definition: 'Título de crédito representativo de operação de crédito. É o contrato formal que documenta o empréstimo e suas condições (valor, taxa, prazo, garantias).',
    category: 'Contratos'
  },
  'adquirente': {
    term: 'Adquirente',
    definition: 'Empresa responsável pelo processamento de transações de cartão (Ex: Cielo, Rede, Stone, PagSeguro). É quem paga os recebíveis ao lojista.',
    category: 'Recebíveis'
  },
  'agenda': {
    term: 'Agenda de Recebíveis',
    definition: 'Cronograma detalhado de todos os valores a receber, com datas de liquidação, valores brutos e líquidos, taxas e adquirentes. É como um calendário financeiro.',
    category: 'Recebíveis'
  },
  'taxa-realizacao': {
    term: 'Taxa de Realização',
    definition: 'Percentual do valor já formalizado em relação ao valor alvo (meta) planejado para cada cliente. Indica o progresso da formalização.',
    category: 'Métricas'
  },
  'limite': {
    term: 'Limite de Crédito',
    definition: 'Valor máximo que o cliente pode utilizar em operações de antecipação ou garantia. É calculado com base na análise de crédito e volume de recebíveis.',
    category: 'Operações'
  },
  'settlement': {
    term: 'Settlement (Liquidação)',
    definition: 'Mesmo que liquidação. Termo em inglês usado no mercado financeiro para se referir ao processo de pagamento e quitação de valores.',
    category: 'Liquidação'
  },
  'onboarding': {
    term: 'Onboarding',
    definition: 'Processo inicial de cadastro e integração de um novo cliente. Inclui coleta de dados, documentação e configurações iniciais.',
    category: 'Formalização'
  },
  'credenciamento': {
    term: 'Credenciamento',
    definition: 'Processo de autorização e cadastro do cliente junto aos adquirentes e sistemas para possibilitar acesso aos recebíveis.',
    category: 'Formalização'
  },
  'tef': {
    term: 'TEF (Transferência Eletrônica de Fundos)',
    definition: 'Sistema que permite transferências bancárias automáticas. Usado para movimentar valores entre contas na liquidação.',
    category: 'Liquidação'
  },
  'spread': {
    term: 'Spread',
    definition: 'Diferença entre o valor bruto do recebível e o valor líquido que o cliente recebe. Representa o custo da operação (taxas + juros).',
    category: 'Operações'
  },
  'registro': {
    term: 'Registro de Garantia',
    definition: 'Processo de formalização da garantia nos sistemas dos adquirentes e registradoras, assegurando o direito sobre os recebíveis.',
    category: 'Operações'
  }
};

export const getTooltipText = (key: string): string => {
  const term = glossary[key.toLowerCase()];
  return term ? term.definition : '';
};

export const searchGlossary = (query: string): GlossaryTerm[] => {
  const lowerQuery = query.toLowerCase();
  return Object.values(glossary).filter(
    term =>
      term.term.toLowerCase().includes(lowerQuery) ||
      term.definition.toLowerCase().includes(lowerQuery)
  );
};
