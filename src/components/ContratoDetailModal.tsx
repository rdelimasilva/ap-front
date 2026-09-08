import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Ban, ArrowDownCircle } from 'lucide-react';
import { showToast } from '../hooks/useToast';
import {
  getContrato,
  inativarContrato,
  baixarContrato,
  getEventosContrato,
  ContratosApiError,
  type ContratoDetalheDTO,
  type EventoContratoDTO,
} from '../services/contratosApi';
import { ConfirmDialog } from './ConfirmDialog';
import { classeBadgeStatus, formatarData, formatarValor, rotuloStatus } from '../utils/contratoCerc';

interface ContratoDetailModalProps {
  contratoId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

const EVENTO_LABEL: Record<string, string> = {
  webhook_recebido: 'Confirmação recebida da CERC',
  rejeicao_estrutural: 'Rejeitado pela CERC',
  ContratoSubgarantido: 'Contrato subgarantido',
  requisicao_cerc: 'Requisição à CERC',
  // Gravados por _operacao_pos_registro no backend, com o tipo da operação
  // sufixado (apps/contratos/views.py).
  operacao_pos_registro_I: 'Inativação submetida à CERC',
  operacao_pos_registro_B: 'Baixa submetida à CERC',
};

// Dois cuidados que a concatenação ingênua não tem. Quando o corpo do backend
// traz só `erro` e nenhuma `mensagem`, contratosApi preenche código e texto com
// a MESMA string, e "código: mensagem" saía repetido ("contrato não encontrado:
// contrato não encontrado"). E um erro de texto vazio precisa de fallback: o
// guarda do efeito de busca não repete a tentativa e o render trata '' como
// falso, então a aba ficaria em branco para sempre naquele contrato — sem
// mensagem e sem o botão de tentar de novo.
function textoDeErroDeEventos(err: unknown): string {
  if (err instanceof ContratosApiError) {
    const codigo = err.codigo.trim();
    const mensagem = err.message.trim();
    if (codigo && mensagem && codigo !== mensagem) return `${codigo}: ${mensagem}`;
    return codigo || mensagem || 'erro desconhecido';
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return 'erro desconhecido';
}

function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  // payload de evento é sempre semiestruturado (vem de webhook/JSON externo);
  // uma data ausente ou malformada não pode derrubar o modal inteiro.
  if (Number.isNaN(data.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(data);
}

// A rejeição estrutural é o único evento cujo payload interessa em texto: são
// os códigos que a CERC devolveu, hoje visíveis só no toast do momento da
// submissão. payload é `unknown` (vem direto do banco) — erros pode não ser
// array se o formato mudar do lado do backend.
function errosDoEvento(evento: EventoContratoDTO): string[] {
  const payload = evento.payload as { erros?: Array<{ codigo?: string; mensagem?: string }> } | null;
  if (!Array.isArray(payload?.erros)) return [];
  return payload.erros.map(e => [e.codigo, e.mensagem].filter(Boolean).join(' — '));
}

export const ContratoDetailModal: React.FC<ContratoDetailModalProps> = ({ contratoId, onClose, onChanged }) => {
  const [contrato, setContrato] = useState<ContratoDetalheDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmacao, setConfirmacao] = useState<'inativar' | 'baixar' | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);
  const [aba, setAba] = useState<'detalhe' | 'historico'>('detalhe');
  const [eventos, setEventos] = useState<EventoContratoDTO[] | null>(null);
  const [erroEventos, setErroEventos] = useState<string | null>(null);
  const [carregandoEventos, setCarregandoEventos] = useState(false);

  // Contrato diferente, timeline diferente. Feito durante a renderização (não
  // em efeito) porque o modal não desmonta ao trocar de contrato — quem o
  // monta (hoje, a seção de contratos CERC do ClientDetail) mantém uma única
  // instância e só troca o contratoId. Um efeito de reset
  // deixaria, entre o commit da nova prop e a passagem do próprio efeito, uma
  // renderização em que o efeito de busca abaixo veria contratoId novo com
  // aba/eventos ainda do contrato anterior (podendo iniciar uma busca não
  // pedida pelo usuário). Ajustar aqui garante que, quando o efeito de busca
  // rodar, o estado já está coerente com o contratoId atual.
  const [contratoIdCarregado, setContratoIdCarregado] = useState(contratoId);
  if (contratoId !== contratoIdCarregado) {
    setContratoIdCarregado(contratoId);
    setAba('detalhe');
    setEventos(null);
    setErroEventos(null);
    setCarregandoEventos(false);
  }

  // Só busca quando o usuário abre a aba (a maioria das visitas ao modal quer
  // o detalhe, e a timeline traz request/response inteiros) e só uma vez por
  // contrato: eventos/erroEventos não nulos significam que já houve uma
  // tentativa, e só "Tentar de novo" (que zera erroEventos) deve repeti-la.
  // Sem essa segunda condição, uma falha reabre a mesma corrida: eventos
  // continua null, o finally devolve carregandoEventos a false, e — se ele
  // estivesse nas dependências — o efeito dispararia de novo indefinidamente.
  //
  // O cancelamento segue o mesmo padrão de ContratosCercList.tsx: a flag
  // `cancelado` é local a cada execução do efeito, então uma resposta tardia
  // só pode afetar o fechamento que a originou. Trocar de contrato (ou de
  // aba) muda as dependências e aciona o cleanup dessa execução específica
  // antes de qualquer nova busca começar — não há estado compartilhado entre
  // execuções para uma delas sobrescrever por engano.
  useEffect(() => {
    if (!contratoId || aba !== 'historico' || eventos !== null || erroEventos !== null) return;
    let cancelado = false;
    const buscar = async () => {
      setCarregandoEventos(true);
      try {
        const dados = await getEventosContrato(contratoId);
        if (!cancelado) setEventos(dados);
      } catch (err) {
        if (!cancelado) setErroEventos(textoDeErroDeEventos(err));
      } finally {
        if (!cancelado) setCarregandoEventos(false);
      }
    };
    buscar();
    return () => { cancelado = true; };
  }, [contratoId, aba, eventos, erroEventos]);

  const tentarNovamenteEventos = () => setErroEventos(null);

  const carregar = async (id: string) => {
    setIsLoading(true);
    try {
      const dados = await getContrato(id);
      setContrato(dados);
    } catch (err) {
      console.error('Erro ao carregar detalhe do contrato:', err);
      showToast('error', 'Erro ao carregar detalhe do contrato');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contratoId) carregar(contratoId);
    else setContrato(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoId]);

  if (!contratoId) return null;

  const executarOperacao = async (tipo: 'inativar' | 'baixar') => {
    if (!contrato) return;
    setIsProcessando(true);
    try {
      const resultado = tipo === 'inativar'
        ? await inativarContrato(contrato.referenciaExterna)
        : await baixarContrato(contrato.referenciaExterna);
      showToast('success', tipo === 'inativar' ? 'Inativação submetida' : 'Baixa submetida', `Status: ${resultado.status}`);
      onChanged();
      // A operação acabou de gravar um evento (operacao_pos_registro_I/B). O
      // efeito da aba só busca quando eventos está nulo, então sem invalidar
      // aqui a timeline carregada antes da operação continuaria em cache e o
      // evento novo só apareceria ao fechar e reabrir o modal.
      setEventos(null);
      setErroEventos(null);
      await carregar(contrato.id);
    } catch (err) {
      if (err instanceof ContratosApiError) {
        showToast('error', `Falha ao ${tipo}`, `${err.codigo}: ${err.message}`);
      } else {
        showToast('error', `Falha ao ${tipo} contrato`);
      }
    } finally {
      setIsProcessando(false);
    }
  };

  const podeOperar = contrato?.status === 'REGISTRADO';

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Detalhe do contrato</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading && <p className="text-center text-gray-400 py-8">Carregando...</p>}

          {!isLoading && contrato && (
            <>
              {/* Dentro do mesmo gate do isLoading: antes do contrato carregar não há
                  o que exibir em nenhuma aba, e clicar em Histórico cedo demais não
                  pode disparar a busca de eventos contra um corpo vazio. */}
              <div className="flex gap-1 border-b border-gray-200 -mt-2">
                {([['detalhe', 'Detalhe'], ['historico', 'Histórico']] as const).map(([chave, rotulo]) => (
                  <button
                    key={chave}
                    onClick={() => setAba(chave)}
                    className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
                      aba === chave
                        ? 'border-emerald-600 text-emerald-700 font-medium'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>

              {aba === 'detalhe' && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-500">Referência externa</p><p className="font-medium text-gray-900">{contrato.referenciaExterna}</p></div>
                    <div><p className="text-gray-500">Identificador</p><p className="font-medium text-gray-900">{contrato.identificadorContrato}</p></div>
                    <div><p className="text-gray-500">Status</p><p><span className={classeBadgeStatus(contrato.status)}>{rotuloStatus(contrato.status)}</span></p></div>
                    <div><p className="text-gray-500">Protocolo CERC</p><p className="font-medium text-gray-900">{contrato.protocolo ?? '—'}</p></div>
                    <div><p className="text-gray-500">Saldo devedor</p><p className="font-medium text-gray-900">{formatarValor(contrato.saldoDevedor)}</p></div>
                    <div><p className="text-gray-500">Vencimento</p><p className="font-medium text-gray-900">{formatarData(contrato.dataVencimento)}</p></div>
                    <div><p className="text-gray-500">Resultado da distribuição</p><p className="font-medium text-gray-900">{contrato.resultadoDistribuicao ?? '—'}</p></div>
                    <div><p className="text-gray-500">Ind. sobrecolateral</p><p className="font-medium text-gray-900">{contrato.indSobrecolateral ?? '—'}</p></div>
                  </div>

                  {contrato.garantias.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Garantia</h3>
                      {contrato.garantias.map(g => (
                        <div key={g.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><p className="text-gray-500">Referência</p><p className="text-gray-900">{g.referenciaExterna}</p></div>
                            <div><p className="text-gray-500">Valor a onerar</p><p className="text-gray-900">{formatarValor(g.valorAOnerar)}</p></div>
                          </div>
                          {g.unidadesRecebiveisAlcancadas.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead className="text-gray-400 uppercase">
                                  <tr>
                                    <th className="text-left py-1">Credenciadora</th>
                                    <th className="text-left py-1">Arranjo</th>
                                    <th className="text-left py-1">Liquidação</th>
                                    <th className="text-right py-1">Valor onerado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {g.unidadesRecebiveisAlcancadas.map((ur, i) => (
                                    <tr key={i} className="border-t border-gray-50">
                                      <td className="py-1">{ur.cnpjCredenciadora}</td>
                                      <td className="py-1">{ur.codigoArranjoPagamento}</td>
                                      <td className="py-1">{formatarData(ur.dataLiquidacao)}</td>
                                      <td className="py-1 text-right">{formatarValor(ur.valorOnerado)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {contrato.indicadoresConsistencia.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Indicadores de consistência</h3>
                      <ul className="text-sm space-y-1">
                        {contrato.indicadoresConsistencia.map((ind, i) => (
                          <li key={i} className="flex justify-between border-b border-gray-50 py-1">
                            <span className="text-gray-600">{ind.indicador}</span>
                            <span className="text-gray-900">{ind.resultado ?? '—'} (criticidade {ind.criticidade ?? '—'})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {aba === 'historico' && (
                <div className="space-y-3">
                  {carregandoEventos && <p className="text-sm text-gray-400">Carregando histórico...</p>}
                  {erroEventos && (
                    <div className="text-sm">
                      <p className="text-red-600">Falha ao carregar o histórico: {erroEventos}</p>
                      <button onClick={tentarNovamenteEventos} className="mt-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                        Tentar de novo
                      </button>
                    </div>
                  )}
                  {eventos?.length === 0 && (
                    <p className="text-sm text-gray-400">
                      Nenhum evento registrado ainda. A confirmação da CERC chega por webhook.
                    </p>
                  )}
                  {eventos?.map((evento, i) => (
                    <div key={i} className="border-l-2 border-gray-200 pl-4 pb-3">
                      <p className="text-sm font-medium text-gray-900">{EVENTO_LABEL[evento.tipo] ?? evento.tipo}</p>
                      <p className="text-xs text-gray-500">{formatarDataHora(evento.ocorridoEm)}</p>
                      {errosDoEvento(evento).map((erro, j) => (
                        <p key={j} className="text-xs text-red-600 mt-1">{erro}</p>
                      ))}
                      {evento.requisicoes.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">Detalhe técnico</summary>
                          {evento.requisicoes.map((r, k) => (
                            <div key={k} className="mt-2 text-xs">
                              <p className="text-gray-600">{r.recurso} — HTTP {r.httpStatus ?? 'sem resposta'} (tentativa {r.tentativa})</p>
                              <pre className="bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(r.requestBody, null, 2)}</pre>
                              <pre className="bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(r.responseBody, null, 2)}</pre>
                            </div>
                          ))}
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  disabled={!podeOperar || isProcessando}
                  onClick={() => setConfirmacao('inativar')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  <Ban className="w-4 h-4" /> Inativar
                </button>
                <button
                  type="button"
                  disabled={!podeOperar || isProcessando}
                  onClick={() => setConfirmacao('baixar')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  <ArrowDownCircle className="w-4 h-4" /> Baixar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmacao !== null}
        title={confirmacao === 'inativar' ? 'Inativar contrato?' : 'Baixar contrato?'}
        message={`Esta operação é submetida à CERC e não é imediata — o contrato entra em '${confirmacao === 'inativar' ? 'INATIVANDO' : 'BAIXANDO'}' até a confirmação por webhook.`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        type="warning"
        onCancel={() => setConfirmacao(null)}
        onConfirm={() => confirmacao && executarOperacao(confirmacao)}
      />
    </div>,
    document.body,
  );
};
