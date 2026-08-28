import type { CriarContratoPayload } from '../services/contratosApi';

/**
 * Espelha apenas as regras de apps/contratos/validation.py (SPEC-02 §9)
 * que são puramente locais — sem dependência de dado de referência que o
 * front não tem acesso: C11 (único documento na definição — trivial aqui,
 * o formulário só permite 1 documento por campo), C13 (sobreposição entre
 * garantias — só existe com múltiplas garantias, fora do escopo v1), C14
 * (lista de participantes do SLC), C17 (só se aplica a atualização,
 * tipoOperacao=A, fora do escopo), C19 (domínio de arranjos sincronizado),
 * C20 (contagem de efeitos já aplicados numa UR). Essas seis regras
 * continuam validadas pelo backend — o 422 delas aparece como erro geral,
 * não campo a campo.
 */
export class ValidacaoError extends Error {
  campo: string;

  constructor(campo: string, mensagem: string) {
    super(mensagem);
    this.campo = campo;
  }
}

export function normalizarDocumento(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) throw new ValidacaoError('documento', 'documento vazio');
  if (digits.length <= 8) return digits.padStart(8, '0');
  if (digits.length <= 11) return digits.padStart(11, '0');
  return digits.padStart(14, '0');
}

export function tipoDocumento(documento: string): 'CNPJ_RAIZ' | 'CPF' | 'CNPJ' {
  if (documento.length === 8) return 'CNPJ_RAIZ';
  if (documento.length === 11) return 'CPF';
  if (documento.length === 14) return 'CNPJ';
  throw new ValidacaoError('documento', `documento com tamanho inválido: ${documento.length}`);
}

function digitoVerificador(base: string, pesos: number[]): string {
  const soma = base.split('').reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? '0' : String(11 - resto);
}

function validarCpf(cpf: string): boolean {
  if (cpf === cpf[0].repeat(11)) return false;
  const dv1 = digitoVerificador(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = digitoVerificador(cpf.slice(0, 9) + dv1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cpf.slice(-2) === dv1 + dv2;
}

function validarCnpj(cnpj: string): boolean {
  if (cnpj === cnpj[0].repeat(14)) return false;
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv1 = digitoVerificador(cnpj.slice(0, 12), pesos1);
  const dv2 = digitoVerificador(cnpj.slice(0, 12) + dv1, pesos2);
  return cnpj.slice(-2) === dv1 + dv2;
}

export function validarC01Documento(raw: string, campo: string): string {
  let documento: string;
  try {
    documento = normalizarDocumento(raw);
  } catch (e) {
    if (e instanceof ValidacaoError) {
      throw new ValidacaoError(campo, e.message);
    }
    throw e;
  }

  let tipo: 'CNPJ_RAIZ' | 'CPF' | 'CNPJ';
  try {
    tipo = tipoDocumento(documento);
  } catch (e) {
    if (e instanceof ValidacaoError) {
      throw new ValidacaoError(campo, e.message);
    }
    throw e;
  }

  if (tipo === 'CPF' && !validarCpf(documento)) throw new ValidacaoError(campo, 'dígito verificador de CPF inválido');
  if (tipo === 'CNPJ' && !validarCnpj(documento)) throw new ValidacaoError(campo, 'dígito verificador de CNPJ inválido');
  return documento;
}

export function validarC02Repactuacao(repactuacao: '0' | '1', identificacaoContratosAnteriores: string[]): void {
  if (repactuacao === '1' && identificacaoContratosAnteriores.length === 0) {
    throw new ValidacaoError('identificacaoContratosAnteriores', 'repactuação exige ao menos um contrato anterior');
  }
}

export function validarC03RepactuacaoSemGarantias(repactuacao: '0' | '1', temGarantia: boolean): void {
  if (repactuacao === '1' && temGarantia) {
    throw new ValidacaoError('garantias', 'repactuação não pode ter garantia especificada');
  }
}

export function validarC04ValorMonetario(valor: number, campo: string): void {
  if (Number.isNaN(valor) || valor < 0.01) throw new ValidacaoError(campo, `${campo} deve ser maior ou igual a 0,01`);
}

export function validarC05ModalidadeParcelado(modalidadeOperacao: string, parcelas: unknown[]): void {
  if (modalidadeOperacao === '2' && parcelas.length === 0) {
    throw new ValidacaoError('parcelas', 'modalidade parcelado exige ao menos uma parcela');
  }
}

export function validarC06TipoDistribuicao(tipoDistribuicao: string, gestaoEntidadeRegistradora: string): void {
  const gestaoRegistradora = gestaoEntidadeRegistradora === '1';
  if (tipoDistribuicao && !gestaoRegistradora) {
    throw new ValidacaoError('tipoDistribuicao', 'só pode ser informado quando a gestão é da entidade registradora');
  }
  if (gestaoRegistradora && !tipoDistribuicao) {
    throw new ValidacaoError('tipoDistribuicao', 'obrigatório quando a gestão é da entidade registradora');
  }
}

export function validarC07RegraDivisaoPercentual(regrasDivisao: '1' | '2', valorAOnerar: number): void {
  if (regrasDivisao === '2' && valorAOnerar > 100) {
    throw new ValidacaoError('valorAOnerar', 'percentual não pode exceder 100');
  }
}

export function validarC08DataInicioFutura(dataInicio: string, hoje: string): void {
  if (dataInicio < hoje) throw new ValidacaoError('definicaoDataInicio', 'não pode ser no passado');
}

export function validarC09OrdemDatas(dataInicio: string, dataFim: string): void {
  if (dataFim < dataInicio) throw new ValidacaoError('definicaoDataFim', 'não pode ser anterior à data de início');
}

export function validarC10RaizTitularIgualUfr(documentoTitular: string, documentoUfr: string, ehRaiz: boolean): void {
  if (ehRaiz && documentoTitular !== documentoUfr) {
    throw new ValidacaoError('definicaoDocumentoTitular', 'CNPJ raiz exige documentoTitular igual a documentoUsuarioFinalRecebedor');
  }
}

export function validarC12ReferenciaGarantiaUnica(referencias: string[]): void {
  if (new Set(referencias).size !== referencias.length) {
    throw new ValidacaoError('garantiaReferenciaExterna', 'referência de garantia duplicada no mesmo contrato');
  }
}

export function validarC15NumeroConta(tipoConta: string, numeroConta: string): void {
  const temHifen = numeroConta.includes('-');
  if (['CC', 'CD', 'PP'].includes(tipoConta) && !temHifen) {
    throw new ValidacaoError('domicilioNumeroConta', `conta ${tipoConta} exige dígito verificador separado por hífen`);
  }
  if (tipoConta === 'PG' && temHifen) {
    throw new ValidacaoError('domicilioNumeroConta', 'conta PG não deve ter hífen');
  }
}

export function validarC16DomicilioFormatos(ispb: string, compe: string, agencia: string): void {
  if (!(ispb.length === 8 && /^\d+$/.test(ispb))) throw new ValidacaoError('domicilioIspb', 'deve ter exatamente 8 dígitos');
  if (compe && !(compe.length === 3 && /^\d+$/.test(compe))) throw new ValidacaoError('domicilioCompe', 'deve ter exatamente 3 dígitos');
  if (!(agencia && /^\d+$/.test(agencia) && agencia.length <= 8)) throw new ValidacaoError('domicilioAgencia', 'deve ter até 8 dígitos, sem dígito verificador');
}

export function validarC18BloqueioJudicial(tipoEfeito: string, identificadorContrato: string): void {
  if (tipoEfeito === '4' && !identificadorContrato) {
    throw new ValidacaoError('identificadorContrato', 'bloqueio judicial exige o número do processo judicial');
  }
}

export type ErrosPorCampo = Record<string, string>;

export function validarPayloadContrato(payload: CriarContratoPayload, hoje: string): ErrosPorCampo {
  const erros: ErrosPorCampo = {};
  const registrar = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      if (e instanceof ValidacaoError) erros[e.campo] = e.message;
      else throw e;
    }
  };

  registrar(() => validarC01Documento(payload.documentoContratante, 'documentoContratante'));
  registrar(() => validarC01Documento(payload.cnpjDetentor, 'cnpjDetentor'));
  registrar(() => validarC02Repactuacao(payload.repactuacao, payload.identificacaoContratosAnteriores ?? []));
  registrar(() => validarC03RepactuacaoSemGarantias(payload.repactuacao, payload.garantias.length > 0));
  registrar(() => validarC04ValorMonetario(payload.saldoDevedor, 'saldoDevedor'));
  registrar(() => validarC04ValorMonetario(payload.limiteOperacaoGarantida, 'limiteOperacaoGarantida'));
  registrar(() => validarC04ValorMonetario(payload.valorMantido, 'valorMantido'));
  registrar(() => validarC05ModalidadeParcelado(payload.modalidadeOperacao, payload.parcelas ?? []));
  registrar(() => validarC18BloqueioJudicial(payload.tipoEfeito, payload.identificadorContrato));

  payload.garantias.forEach((g) => {
    registrar(() => validarC06TipoDistribuicao(g.tipoDistribuicao ?? '', payload.identificacaoGestaoEntidadeRegistradora));
    registrar(() => validarC07RegraDivisaoPercentual(g.regrasDivisao, g.valorAOnerar));
    registrar(() => validarC08DataInicioFutura(g.definicaoUnidadeRecebivel.dataInicio, hoje));
    registrar(() => validarC09OrdemDatas(g.definicaoUnidadeRecebivel.dataInicio, g.definicaoUnidadeRecebivel.dataFim));
    const ehRaiz = (g.definicaoUnidadeRecebivel.documentoUsuarioFinalRecebedor ?? '').length === 8;
    registrar(() => validarC10RaizTitularIgualUfr(
      g.definicaoUnidadeRecebivel.documentoTitular ?? '',
      g.definicaoUnidadeRecebivel.documentoUsuarioFinalRecebedor ?? '',
      ehRaiz,
    ));
    registrar(() => validarC15NumeroConta(g.domicilioPagamento.tipoConta, g.domicilioPagamento.numeroConta));
    registrar(() => validarC16DomicilioFormatos(g.domicilioPagamento.ispb, g.domicilioPagamento.compe ?? '', g.domicilioPagamento.agencia));
  });
  registrar(() => validarC12ReferenciaGarantiaUnica(payload.garantias.map(g => g.referenciaExterna)));

  return erros;
}
