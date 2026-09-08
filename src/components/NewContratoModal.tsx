import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { showToast } from '../hooks/useToast';
import {
  criarContrato,
  ContratosApiError,
  type CriarContratoPayload,
  type GarantiaPayload,
} from '../services/contratosApi';
import { validarPayloadContrato, type ErrosPorCampo } from '../utils/contratoValidation';
import { LIMITE_LISTA_CONTEXTO } from '../utils/contratoCerc';

// Semeia o formulário a partir de onde o usuário veio (radar de URs de um
// cliente, ou a ficha do cliente). Todo campo semeado continua editável.
export interface ContextoTrava {
  documentoContratante?: string;
  documentoUsuarioFinalRecebedor?: string;
  listaCnpjCredenciadora?: string[];
  listaCodigoArranjoPagamento?: string[];
  dataInicio?: string;
  dataFim?: string;
}

interface NewContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  contextoInicial?: ContextoTrava;
}

interface ParcelaForm {
  vencimento: string;
  valor: string;
}

interface FormState {
  referenciaExterna: string;
  identificadorContrato: string;
  documentoContratante: string;
  repactuacao: '0' | '1';
  identificacaoContratosAnterioresRaw: string;
  cnpjDetentor: string;
  tipoEfeito: '1' | '2' | '3' | '4';
  saldoDevedor: string;
  limiteOperacaoGarantida: string;
  valorMantido: string;
  dataAssinatura: string;
  dataVencimento: string;
  identificacaoGestaoEntidadeRegistradora: '1' | '2' | '3';
  modalidadeOperacao: '1' | '2' | '3';
  carteira: string;
  tipoAvaliacao: string;
  garantiaReferenciaExterna: string;
  domicilioNumeroDocumentoTitular: string;
  domicilioNomeTitular: string;
  domicilioTipoConta: 'CC' | 'CD' | 'PG' | 'PP';
  domicilioCompe: string;
  domicilioIspb: string;
  domicilioAgencia: string;
  domicilioNumeroConta: string;
  definicaoDocumentoUfr: string;
  definicaoDocumentoTitular: string;
  definicaoDataInicio: string;
  definicaoDataFim: string;
  regrasDivisao: '1' | '2';
  valorAOnerar: string;
  tipoDistribuicao: '' | 'padrao_empilhamento_ap' | 'padrao_pro_rata_ap';
}

const ESTADO_INICIAL: FormState = {
  referenciaExterna: '', identificadorContrato: '', documentoContratante: '',
  repactuacao: '0', identificacaoContratosAnterioresRaw: '', cnpjDetentor: '',
  tipoEfeito: '2', saldoDevedor: '', limiteOperacaoGarantida: '', valorMantido: '',
  dataAssinatura: '', dataVencimento: '', identificacaoGestaoEntidadeRegistradora: '2',
  modalidadeOperacao: '1', carteira: '', tipoAvaliacao: '',
  garantiaReferenciaExterna: '', domicilioNumeroDocumentoTitular: '', domicilioNomeTitular: '',
  domicilioTipoConta: 'CC', domicilioCompe: '', domicilioIspb: '', domicilioAgencia: '',
  domicilioNumeroConta: '', definicaoDocumentoUfr: '', definicaoDocumentoTitular: '',
  definicaoDataInicio: '', definicaoDataFim: '', regrasDivisao: '1', valorAOnerar: '',
  tipoDistribuicao: '',
};

// Só os campos que a origem (radar de URs ou ficha do cliente) sabe de
// antemão. saldoDevedor, limiteOperacaoGarantida, valorMantido e valorAOnerar
// ficam de fora por decisão de produto, não por esquecimento: derivar o valor
// de uma trava a partir de um filtro visual (o recorte de URs que o usuário
// tinha na tela) onera recebíveis que ele não escolheu onerar. Esses quatro
// valores vêm do contrato de crédito e são digitados; quem for "melhorar" o
// pré-preenchimento precisa ler isto antes.
function comContexto(contexto?: ContextoTrava): FormState {
  if (!contexto) return ESTADO_INICIAL;
  return {
    ...ESTADO_INICIAL,
    documentoContratante: contexto.documentoContratante ?? '',
    definicaoDocumentoUfr: contexto.documentoUsuarioFinalRecebedor ?? '',
    definicaoDataInicio: contexto.dataInicio ?? '',
    definicaoDataFim: contexto.dataFim ?? '',
  };
}

const TIPOS_EFEITO: Array<{ value: FormState['tipoEfeito']; label: string }> = [
  { value: '1', label: '1 — Troca de titularidade' },
  { value: '2', label: '2 — Ônus cessão fiduciária' },
  { value: '3', label: '3 — Ônus outros' },
  { value: '4', label: '4 — Bloqueio judicial' },
];

const TIPOS_GESTAO: Array<{ value: FormState['identificacaoGestaoEntidadeRegistradora']; label: string }> = [
  { value: '1', label: '1 — Gestão pela entidade registradora (GCAP)' },
  { value: '2', label: '2 — Gestão do financiador' },
  { value: '3', label: '3 — Gestão do financiador com monitoramento e alertas CERC' },
];

const MODALIDADES: Array<{ value: FormState['modalidadeOperacao']; label: string }> = [
  { value: '1', label: '1 — Rotativo' },
  { value: '2', label: '2 — Parcelado' },
  { value: '3', label: '3 — Cessão' },
];

const TIPOS_CONTA: Array<{ value: FormState['domicilioTipoConta']; label: string }> = [
  { value: 'CC', label: 'CC — Corrente' },
  { value: 'CD', label: 'CD — Depósito' },
  { value: 'PG', label: 'PG — Pagamento' },
  { value: 'PP', label: 'PP — Poupança' },
];

function paraNumero(valor: string): number {
  return Number(valor.replace(',', '.'));
}

function listaDeTexto(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function montarPayload(
  form: FormState,
  todasCredenciadoras: boolean,
  credenciadorasRaw: string,
  todosArranjos: boolean,
  arranjosRaw: string,
  parcelas: ParcelaForm[],
): CriarContratoPayload {
  const repactuado = form.repactuacao === '1';

  const garantia: GarantiaPayload = {
    referenciaExterna: form.garantiaReferenciaExterna,
    domicilioPagamento: {
      numeroDocumentoTitular: form.domicilioNumeroDocumentoTitular,
      nomeTitular: form.domicilioNomeTitular || undefined,
      tipoConta: form.domicilioTipoConta,
      compe: form.domicilioCompe || undefined,
      ispb: form.domicilioIspb,
      agencia: form.domicilioAgencia,
      numeroConta: form.domicilioNumeroConta,
    },
    definicaoUnidadeRecebivel: {
      listaCnpjCredenciadora: todasCredenciadoras ? ['99T'] : listaDeTexto(credenciadorasRaw),
      listaCodigoArranjoPagamento: todosArranjos ? ['99T'] : listaDeTexto(arranjosRaw),
      documentoUsuarioFinalRecebedor: form.definicaoDocumentoUfr || undefined,
      documentoTitular: form.definicaoDocumentoTitular || undefined,
      dataInicio: form.definicaoDataInicio,
      dataFim: form.definicaoDataFim,
    },
    regrasDivisao: form.regrasDivisao,
    valorAOnerar: paraNumero(form.valorAOnerar),
    tipoDistribuicao: form.identificacaoGestaoEntidadeRegistradora === '1' ? (form.tipoDistribuicao || undefined) : undefined,
  };

  return {
    tipoOperacao: 'C',
    referenciaExterna: form.referenciaExterna,
    identificadorContrato: form.identificadorContrato,
    documentoContratante: form.documentoContratante,
    repactuacao: form.repactuacao,
    identificacaoContratosAnteriores: repactuado ? listaDeTexto(form.identificacaoContratosAnterioresRaw) : undefined,
    cnpjDetentor: form.cnpjDetentor,
    tipoEfeito: form.tipoEfeito,
    saldoDevedor: paraNumero(form.saldoDevedor),
    limiteOperacaoGarantida: paraNumero(form.limiteOperacaoGarantida),
    valorMantido: paraNumero(form.valorMantido),
    dataAssinatura: form.dataAssinatura,
    dataVencimento: form.dataVencimento,
    identificacaoGestaoEntidadeRegistradora: form.identificacaoGestaoEntidadeRegistradora,
    modalidadeOperacao: form.modalidadeOperacao,
    parcelas: form.modalidadeOperacao === '2'
      ? parcelas.map(p => ({ vencimento: p.vencimento, valor: paraNumero(p.valor) }))
      : [],
    carteira: form.carteira || undefined,
    tipoAvaliacao: form.tipoAvaliacao || undefined,
    garantias: repactuado ? [] : [garantia],
  };
}

const Campo: React.FC<{ label: string; erro?: string; obrigatorio?: boolean; children: React.ReactNode }> = ({ label, erro, obrigatorio, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{obrigatorio && <span className="text-red-500"> *</span>}
    </label>
    {children}
    {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
  </div>
);

const inputClass = (temErro?: boolean) =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${temErro ? 'border-red-400' : 'border-gray-300'}`;

export const NewContratoModal: React.FC<NewContratoModalProps> = ({ isOpen, onClose, onCreated, contextoInicial }) => {
  const [form, setForm] = useState<FormState>(() => comContexto(contextoInicial));
  const [parcelas, setParcelas] = useState<ParcelaForm[]>([]);
  const [todasCredenciadoras, setTodasCredenciadoras] = useState(true);
  const [credenciadorasRaw, setCredenciadorasRaw] = useState('');
  const [todosArranjos, setTodosArranjos] = useState(true);
  const [arranjosRaw, setArranjosRaw] = useState('');
  const [erros, setErros] = useState<ErrosPorCampo>({});
  const [bannerErro, setBannerErro] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // "Última versão" de contextoInicial sem entrar no array de dependências do
  // efeito abaixo. Consumidores (ex.: a ficha do cliente) passam esse contexto
  // como objeto literal inline, recriado a cada render do pai; se o efeito
  // dependesse da identidade do objeto, qualquer re-render do pai com o modal
  // já aberto resetaria o formulário e apagaria o que o usuário digitou. Ref
  // é estável e não participa do array de deps — não precisa de disable.
  const contextoRef = useRef(contextoInicial);
  contextoRef.current = contextoInicial;

  // Reage à transição de fechado→aberto, não à identidade de contextoInicial:
  // lê o contexto vigente pela ref só no instante em que isOpen vira true, e
  // com o modal já aberto, novas referências da prop não têm mais efeito
  // algum sobre o formulário. Vale também para as duas listas, que ficam fora
  // do FormState e por isso não são cobertas por comContexto.
  useEffect(() => {
    if (!isOpen) return;
    const contexto = contextoRef.current;
    setForm(comContexto(contexto));
    setParcelas([]);
    setErros({});
    setBannerErro(null);

    const semear = (
      valores: string[] | undefined,
      setTodos: (v: boolean) => void,
      setRaw: (v: string) => void,
    ) => {
      if (!valores || valores.length === 0 || valores.length > LIMITE_LISTA_CONTEXTO) {
        setTodos(true);
        setRaw('');
        return;
      }
      setTodos(false);
      setRaw(valores.join(', '));
    };

    semear(contexto?.listaCnpjCredenciadora, setTodasCredenciadoras, setCredenciadorasRaw);
    semear(contexto?.listaCodigoArranjoPagamento, setTodosArranjos, setArranjosRaw);
  }, [isOpen]);

  if (!isOpen) return null;

  const set = <K extends keyof FormState>(campo: K, valor: FormState[K]) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const resetar = () => {
    setForm(ESTADO_INICIAL);
    setParcelas([]);
    setTodasCredenciadoras(true);
    setCredenciadorasRaw('');
    setTodosArranjos(true);
    setArranjosRaw('');
    setErros({});
    setBannerErro(null);
  };

  const fechar = () => {
    resetar();
    onClose();
  };

  const adicionarParcela = () => setParcelas(prev => [...prev, { vencimento: '', valor: '' }]);
  const removerParcela = (index: number) => setParcelas(prev => prev.filter((_, i) => i !== index));
  const atualizarParcela = (index: number, campo: keyof ParcelaForm, valor: string) => {
    setParcelas(prev => prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerErro(null);

    const payload = montarPayload(form, todasCredenciadoras, credenciadorasRaw, todosArranjos, arranjosRaw, parcelas);
    const hoje = new Date().toLocaleDateString('sv-SE');
    const errosValidacao = validarPayloadContrato(payload, hoje);
    setErros(errosValidacao);
    if (Object.keys(errosValidacao).length > 0) return;

    setIsSubmitting(true);
    try {
      const contrato = await criarContrato(payload);
      showToast('success', 'Contrato submetido', `Status: ${contrato.status}${contrato.protocolo ? ` — protocolo ${contrato.protocolo}` : ''}`);
      onCreated();
      fechar();
    } catch (err) {
      if (err instanceof ContratosApiError) {
        setBannerErro(`${err.codigo}: ${err.message}`);
      } else {
        setBannerErro('Falha ao comunicar com o serviço de contratos.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const repactuado = form.repactuacao === '1';

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Novo Contrato (CERC-AP007)</h2>
          <button onClick={fechar} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {bannerErro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {bannerErro}
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Dados do contrato</h3>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Referência externa" obrigatorio erro={erros.referenciaExterna}>
                <input required className={inputClass(!!erros.referenciaExterna)} value={form.referenciaExterna} onChange={e => set('referenciaExterna', e.target.value)} />
              </Campo>
              <Campo label="Identificador do contrato" obrigatorio erro={erros.identificadorContrato}>
                <input required className={inputClass(!!erros.identificadorContrato)} value={form.identificadorContrato} onChange={e => set('identificadorContrato', e.target.value)} />
              </Campo>
              <Campo label="Documento do contratante (CPF/CNPJ)" obrigatorio erro={erros.documentoContratante}>
                <input required className={inputClass(!!erros.documentoContratante)} value={form.documentoContratante} onChange={e => set('documentoContratante', e.target.value)} />
              </Campo>
              <Campo label="CNPJ do detentor" obrigatorio erro={erros.cnpjDetentor}>
                <input required className={inputClass(!!erros.cnpjDetentor)} value={form.cnpjDetentor} onChange={e => set('cnpjDetentor', e.target.value)} />
              </Campo>
              <Campo label="Tipo de efeito" obrigatorio erro={erros.tipoEfeito}>
                <select required className={inputClass()} value={form.tipoEfeito} onChange={e => set('tipoEfeito', e.target.value as FormState['tipoEfeito'])}>
                  {TIPOS_EFEITO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Campo>
              {form.tipoEfeito === '4' && (
                <Campo label="Nº do processo judicial" erro={erros.identificadorContrato}>
                  <p className="text-xs text-gray-500 pt-2">Bloqueio judicial: informe o número do processo no campo "Identificador do contrato" acima.</p>
                </Campo>
              )}
              <Campo label="Repactuação" obrigatorio>
                <select className={inputClass()} value={form.repactuacao} onChange={e => set('repactuacao', e.target.value as FormState['repactuacao'])}>
                  <option value="0">Não</option>
                  <option value="1">Sim</option>
                </select>
              </Campo>
              {repactuado && (
                <Campo label="Contratos anteriores (separados por vírgula)" obrigatorio erro={erros.identificacaoContratosAnteriores}>
                  <input required className={inputClass(!!erros.identificacaoContratosAnteriores)} value={form.identificacaoContratosAnterioresRaw} onChange={e => set('identificacaoContratosAnterioresRaw', e.target.value)} />
                </Campo>
              )}
              <Campo label="Saldo devedor" obrigatorio erro={erros.saldoDevedor}>
                <input required className={inputClass(!!erros.saldoDevedor)} value={form.saldoDevedor} onChange={e => set('saldoDevedor', e.target.value)} placeholder="150000.00" />
              </Campo>
              <Campo label="Limite da operação garantida" obrigatorio erro={erros.limiteOperacaoGarantida}>
                <input required className={inputClass(!!erros.limiteOperacaoGarantida)} value={form.limiteOperacaoGarantida} onChange={e => set('limiteOperacaoGarantida', e.target.value)} placeholder="200000.00" />
              </Campo>
              <Campo label="Valor mantido" obrigatorio erro={erros.valorMantido}>
                <input required className={inputClass(!!erros.valorMantido)} value={form.valorMantido} onChange={e => set('valorMantido', e.target.value)} placeholder="180000.00" />
              </Campo>
              <Campo label="Data de assinatura" obrigatorio>
                <input required type="date" className={inputClass()} value={form.dataAssinatura} onChange={e => set('dataAssinatura', e.target.value)} />
              </Campo>
              <Campo label="Data de vencimento" obrigatorio>
                <input required type="date" className={inputClass()} value={form.dataVencimento} onChange={e => set('dataVencimento', e.target.value)} />
              </Campo>
              <Campo label="Gestão da entidade registradora" obrigatorio>
                <select required className={inputClass()} value={form.identificacaoGestaoEntidadeRegistradora} onChange={e => set('identificacaoGestaoEntidadeRegistradora', e.target.value as FormState['identificacaoGestaoEntidadeRegistradora'])}>
                  {TIPOS_GESTAO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Campo>
              <Campo label="Modalidade da operação" obrigatorio>
                <select required className={inputClass()} value={form.modalidadeOperacao} onChange={e => set('modalidadeOperacao', e.target.value as FormState['modalidadeOperacao'])}>
                  {MODALIDADES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Campo>
              <Campo label="Carteira (opcional)">
                <input className={inputClass()} value={form.carteira} onChange={e => set('carteira', e.target.value)} />
              </Campo>
              <Campo label="Tipo de avaliação (opcional)">
                <select className={inputClass()} value={form.tipoAvaliacao} onChange={e => set('tipoAvaliacao', e.target.value)}>
                  <option value="">—</option>
                  <option value="avaliacao_agenda_basica_ap">Avaliação de agenda básica</option>
                  <option value="avaliacao_agenda_completa_ap">Avaliação de agenda completa</option>
                  <option value="avaliacao_contrato_basica_ap">Avaliação de contrato básica</option>
                  <option value="avaliacao_contrato_completa_ap">Avaliação de contrato completa</option>
                </select>
              </Campo>
            </div>

            {form.modalidadeOperacao === '2' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Parcelas {erros.parcelas && <span className="text-red-500 text-xs ml-2">{erros.parcelas}</span>}</p>
                  <button type="button" onClick={adicionarParcela} className="text-emerald-600 text-sm flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Adicionar parcela
                  </button>
                </div>
                {parcelas.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="date" className={inputClass()} value={p.vencimento} onChange={e => atualizarParcela(i, 'vencimento', e.target.value)} />
                    <input className={inputClass()} value={p.valor} onChange={e => atualizarParcela(i, 'valor', e.target.value)} placeholder="12500.00" />
                    <button type="button" onClick={() => removerParcela(i)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {!repactuado && (
            <section className="space-y-4 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Garantia</h3>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Referência externa da garantia" obrigatorio erro={erros.garantiaReferenciaExterna}>
                  <input required className={inputClass(!!erros.garantiaReferenciaExterna)} value={form.garantiaReferenciaExterna} onChange={e => set('garantiaReferenciaExterna', e.target.value)} />
                </Campo>
                <Campo label="Regra de divisão" obrigatorio>
                  <select required className={inputClass()} value={form.regrasDivisao} onChange={e => set('regrasDivisao', e.target.value as FormState['regrasDivisao'])}>
                    <option value="1">1 — Valor definido</option>
                    <option value="2">2 — Percentual</option>
                  </select>
                </Campo>
                <Campo label={form.regrasDivisao === '2' ? 'Percentual a onerar (até 100)' : 'Valor a onerar'} obrigatorio erro={erros.valorAOnerar}>
                  <input required className={inputClass(!!erros.valorAOnerar)} value={form.valorAOnerar} onChange={e => set('valorAOnerar', e.target.value)} />
                </Campo>
                {form.identificacaoGestaoEntidadeRegistradora === '1' && (
                  <Campo label="Tipo de distribuição" obrigatorio erro={erros.tipoDistribuicao}>
                    <select required className={inputClass(!!erros.tipoDistribuicao)} value={form.tipoDistribuicao} onChange={e => set('tipoDistribuicao', e.target.value as FormState['tipoDistribuicao'])}>
                      <option value="">—</option>
                      <option value="padrao_empilhamento_ap">Padrão empilhamento</option>
                      <option value="padrao_pro_rata_ap">Padrão pro-rata</option>
                    </select>
                  </Campo>
                )}
              </div>

              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Domicílio de pagamento</h4>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Documento do titular" obrigatorio erro={erros.domicilioNumeroDocumentoTitular}>
                  <input required className={inputClass(!!erros.domicilioNumeroDocumentoTitular)} value={form.domicilioNumeroDocumentoTitular} onChange={e => set('domicilioNumeroDocumentoTitular', e.target.value)} />
                </Campo>
                <Campo label="Nome do titular (opcional)">
                  <input className={inputClass()} value={form.domicilioNomeTitular} onChange={e => set('domicilioNomeTitular', e.target.value)} />
                </Campo>
                <Campo label="Tipo de conta" obrigatorio>
                  <select required className={inputClass()} value={form.domicilioTipoConta} onChange={e => set('domicilioTipoConta', e.target.value as FormState['domicilioTipoConta'])}>
                    {TIPOS_CONTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Campo>
                <Campo label="COMPE (3 dígitos, opcional)" erro={erros.domicilioCompe}>
                  <input className={inputClass(!!erros.domicilioCompe)} value={form.domicilioCompe} onChange={e => set('domicilioCompe', e.target.value)} maxLength={3} />
                </Campo>
                <Campo label="ISPB (8 dígitos)" obrigatorio erro={erros.domicilioIspb}>
                  <input required className={inputClass(!!erros.domicilioIspb)} value={form.domicilioIspb} onChange={e => set('domicilioIspb', e.target.value)} maxLength={8} />
                </Campo>
                <Campo label="Agência (até 8 dígitos, sem DV)" obrigatorio erro={erros.domicilioAgencia}>
                  <input required className={inputClass(!!erros.domicilioAgencia)} value={form.domicilioAgencia} onChange={e => set('domicilioAgencia', e.target.value)} maxLength={8} />
                </Campo>
                <Campo label="Número da conta (com DV/hífen se CC/CD/PP)" obrigatorio erro={erros.domicilioNumeroConta}>
                  <input required className={inputClass(!!erros.domicilioNumeroConta)} value={form.domicilioNumeroConta} onChange={e => set('domicilioNumeroConta', e.target.value)} placeholder="464561-6" />
                </Campo>
              </div>

              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filtro de unidades recebíveis</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={todasCredenciadoras} onChange={e => setTodasCredenciadoras(e.target.checked)} />
                  Todas as credenciadoras (99T)
                </label>
                {!todasCredenciadoras && (
                  <input className={inputClass()} value={credenciadorasRaw} onChange={e => setCredenciadorasRaw(e.target.value)} placeholder="CNPJs separados por vírgula" />
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={todosArranjos} onChange={e => setTodosArranjos(e.target.checked)} />
                  Todos os arranjos de pagamento (99T)
                </label>
                {!todosArranjos && (
                  <input className={inputClass()} value={arranjosRaw} onChange={e => setArranjosRaw(e.target.value)} placeholder="Códigos separados por vírgula" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Documento do usuário final recebedor (opcional)">
                  <input className={inputClass()} value={form.definicaoDocumentoUfr} onChange={e => set('definicaoDocumentoUfr', e.target.value)} />
                </Campo>
                <Campo label="Documento do titular (opcional)" erro={erros.definicaoDocumentoTitular}>
                  <input className={inputClass(!!erros.definicaoDocumentoTitular)} value={form.definicaoDocumentoTitular} onChange={e => set('definicaoDocumentoTitular', e.target.value)} />
                </Campo>
                <Campo label="Início da janela de liquidação" obrigatorio erro={erros.definicaoDataInicio}>
                  <input required type="date" className={inputClass(!!erros.definicaoDataInicio)} value={form.definicaoDataInicio} onChange={e => set('definicaoDataInicio', e.target.value)} />
                </Campo>
                <Campo label="Fim da janela de liquidação" obrigatorio erro={erros.definicaoDataFim}>
                  <input required type="date" className={inputClass(!!erros.definicaoDataFim)} value={form.definicaoDataFim} onChange={e => set('definicaoDataFim', e.target.value)} />
                </Campo>
              </div>
            </section>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={fechar} className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
              {isSubmitting ? 'Enviando...' : 'Criar contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
