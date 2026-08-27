import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Ban, ArrowDownCircle } from 'lucide-react';
import { showToast } from '../hooks/useToast';
import {
  getContrato,
  inativarContrato,
  baixarContrato,
  ContratosApiError,
  type ContratoDetalheDTO,
} from '../services/contratosApi';
import { ConfirmDialog } from './ConfirmDialog';

interface ContratoDetailModalProps {
  contratoId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

function formatarValor(v: number | null): string {
  if (v === null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export const ContratoDetailModal: React.FC<ContratoDetailModalProps> = ({ contratoId, onClose, onChanged }) => {
  const [contrato, setContrato] = useState<ContratoDetalheDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmacao, setConfirmacao] = useState<'inativar' | 'baixar' | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);

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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Referência externa</p><p className="font-medium text-gray-900">{contrato.referenciaExterna}</p></div>
                <div><p className="text-gray-500">Identificador</p><p className="font-medium text-gray-900">{contrato.identificadorContrato}</p></div>
                <div><p className="text-gray-500">Status</p><p className="font-medium text-gray-900">{contrato.status}</p></div>
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
