import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  CreditCard,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Zap,
  HelpCircle,
  X
} from 'lucide-react';
import { CreditRecoveryJourney } from './CreditRecoveryJourney';
import { GuaranteesJourney } from './GuaranteesJourney';
import { PrepaymentJourney } from './PrepaymentJourney';
import { AntecipationJourney } from './AntecipationJourney';
import { OwnershipTransferJourney } from './OwnershipTransferJourney';
import { PreContractedAntecipationJourney } from './PreContractedAntecipationJourney';

const helpTexts: Record<string, { title: string; description: string }> = {
  recovery: {
    title: 'Recuperação de Crédito',
    description: 'Utilize para recuperar valores de clientes inadimplentes. O fluxo consiste em selecionar clientes, confirmar opt-in e anuência contratual, e configurar uma automação com volume-alvo de busca que captura recebíveis disponíveis automaticamente até atingir o valor desejado.',
  },
  guarantees: {
    title: 'Garantias',
    description: 'Utilize para constituir garantias sobre recebíveis de clientes. O fluxo consiste em selecionar clientes, confirmar opt-in e anuência, verificar as agendas de recebíveis no radar do cliente, e registrar a operação de trava de garantia sobre as URs selecionadas.',
  },
  prepayment: {
    title: 'Pré-pagamentos',
    description: 'Utilize um recebível de cartão para realizar um pagamento antecipado e gerar crédito. O estabelecimento comercial pode usar seus recebíveis futuros como forma de pagamento adiantado, convertendo agendas em crédito disponível.',
  },
  anticipation: {
    title: 'Antecipação',
    description: 'Utilize para antecipar recebíveis de clientes. Diferente do pré-pagamento, a antecipação transfere a titularidade dos recebíveis futuros, permitindo ao cliente receber os valores de forma adiantada com desconto.',
  },
  ownershipTransfer: {
    title: 'Troca de Titularidade Automática',
    description: 'Realize a troca automática de titularidade de recebíveis entre participantes. O fluxo permite selecionar as unidades de recebíveis, definir o novo titular e executar a transferência de forma automatizada, garantindo conformidade regulatória e rastreabilidade completa.',
  },
  preContractedAntecipation: {
    title: 'Antecipação Automática Pré Contratada',
    description: 'Configure antecipações automáticas de recebíveis com base em contratos pré-definidos. Defina frequência (diária, semanal ou mensal), percentual ou valor alvo, faixas de desconto e filtros por credenciadora. O sistema executa as antecipações automaticamente conforme as regras contratadas.',
  },
};

export const OverviewModule: React.FC = () => {
  const [isCreditRecoveryOpen, setIsCreditRecoveryOpen] = useState(false);
  const [isGuaranteesOpen, setIsGuaranteesOpen] = useState(false);
  const [isPrepaymentOpen, setIsPrepaymentOpen] = useState(false);
  const [isAntecipationOpen, setIsAntecipationOpen] = useState(false);
  const [isOwnershipTransferOpen, setIsOwnershipTransferOpen] = useState(false);
  const [isPreContractedAntecipationOpen, setIsPreContractedAntecipationOpen] = useState(false);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

  const handleHelpClick = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveHelp(activeHelp === key ? null : key);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Recuperação de Crédito */}
        <div className="relative">
          <button
            onClick={() => setIsCreditRecoveryOpen(true)}
            className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleHelpClick('recovery', e)}
                  className="p-1.5 rounded-full hover:bg-blue-100 transition-colors text-gray-400 hover:text-blue-600 z-10"
                  title="O que é?"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Recuperação de Crédito</h3>
            <p className="text-sm text-gray-600">Gerencie processos de recuperação e inadimplência</p>
          </button>
          {activeHelp === 'recovery' && (
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">{helpTexts.recovery.title}</h4>
                  <p className="text-xs text-blue-800 leading-relaxed">{helpTexts.recovery.description}</p>
                </div>
                <button onClick={(e) => handleHelpClick('recovery', e)} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Garantias */}
        <div className="relative">
          <button
            onClick={() => setIsGuaranteesOpen(true)}
            className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleHelpClick('guarantees', e)}
                  className="p-1.5 rounded-full hover:bg-green-100 transition-colors text-gray-400 hover:text-green-600 z-10"
                  title="O que é?"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Garantias</h3>
            <p className="text-sm text-gray-600">Monitore e gerencie garantias de contratos</p>
          </button>
          {activeHelp === 'guarantees' && (
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-green-900 mb-1">{helpTexts.guarantees.title}</h4>
                  <p className="text-xs text-green-800 leading-relaxed">{helpTexts.guarantees.description}</p>
                </div>
                <button onClick={(e) => handleHelpClick('guarantees', e)} className="text-green-400 hover:text-green-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pré-pagamentos */}
        <div className="relative">
          <button
            onClick={() => setIsPrepaymentOpen(true)}
            className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-teal-300 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                <DollarSign className="w-8 h-8 text-teal-600" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleHelpClick('prepayment', e)}
                  className="p-1.5 rounded-full hover:bg-teal-100 transition-colors text-gray-400 hover:text-teal-600 z-10"
                  title="O que é?"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pré-pagamentos</h3>
            <p className="text-sm text-gray-600">Controle solicitações de antecipação e pré-pagamentos</p>
          </button>
          {activeHelp === 'prepayment' && (
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-teal-50 border border-teal-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-teal-900 mb-1">{helpTexts.prepayment.title}</h4>
                  <p className="text-xs text-teal-800 leading-relaxed">{helpTexts.prepayment.description}</p>
                </div>
                <button onClick={(e) => handleHelpClick('prepayment', e)} className="text-teal-400 hover:text-teal-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Antecipação */}
        <div className="relative">
          <button
            onClick={() => setIsAntecipationOpen(true)}
            className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-orange-300 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleHelpClick('anticipation', e)}
                  className="p-1.5 rounded-full hover:bg-orange-100 transition-colors text-gray-400 hover:text-orange-600 z-10"
                  title="O que é?"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Antecipação</h3>
            <p className="text-sm text-gray-600">Antecipe recebíveis e melhore seu fluxo de caixa</p>
          </button>
          {activeHelp === 'anticipation' && (
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-orange-900 mb-1">{helpTexts.anticipation.title}</h4>
                  <p className="text-xs text-orange-800 leading-relaxed">{helpTexts.anticipation.description}</p>
                </div>
                <button onClick={(e) => handleHelpClick('anticipation', e)} className="text-orange-400 hover:text-orange-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Troca de Titularidade Automática */}
        <div className="relative">
          <button
            onClick={() => setIsOwnershipTransferOpen(true)}
            className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <RefreshCw className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleHelpClick('ownershipTransfer', e)}
                  className="p-1.5 rounded-full hover:bg-purple-100 transition-colors text-gray-400 hover:text-purple-600 z-10"
                  title="O que é?"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Troca de Titularidade Automática</h3>
            <p className="text-sm text-gray-600">Transfira a titularidade de recebíveis de forma automatizada</p>
          </button>
          {activeHelp === 'ownershipTransfer' && (
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 mb-1">{helpTexts.ownershipTransfer.title}</h4>
                  <p className="text-xs text-purple-800 leading-relaxed">{helpTexts.ownershipTransfer.description}</p>
                </div>
                <button onClick={(e) => handleHelpClick('ownershipTransfer', e)} className="text-purple-400 hover:text-purple-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Antecipação Automática Pré Contratada */}
        <div className="relative">
          <button
            onClick={() => setIsPreContractedAntecipationOpen(true)}
            className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-rose-300 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                <Zap className="w-8 h-8 text-rose-600" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleHelpClick('preContractedAntecipation', e)}
                  className="p-1.5 rounded-full hover:bg-rose-100 transition-colors text-gray-400 hover:text-rose-600 z-10"
                  title="O que é?"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Antecipação Automática Pré Contratada</h3>
            <p className="text-sm text-gray-600">Configure antecipações automáticas com regras pré-contratadas</p>
          </button>
          {activeHelp === 'preContractedAntecipation' && (
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-rose-50 border border-rose-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-rose-900 mb-1">{helpTexts.preContractedAntecipation.title}</h4>
                  <p className="text-xs text-rose-800 leading-relaxed">{helpTexts.preContractedAntecipation.description}</p>
                </div>
                <button onClick={(e) => handleHelpClick('preContractedAntecipation', e)} className="text-rose-400 hover:text-rose-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreditRecoveryJourney
        isOpen={isCreditRecoveryOpen}
        onClose={() => setIsCreditRecoveryOpen(false)}
      />

      <GuaranteesJourney
        isOpen={isGuaranteesOpen}
        onClose={() => setIsGuaranteesOpen(false)}
      />

      <PrepaymentJourney
        isOpen={isPrepaymentOpen}
        onClose={() => setIsPrepaymentOpen(false)}
      />

      <AntecipationJourney
        isOpen={isAntecipationOpen}
        onClose={() => setIsAntecipationOpen(false)}
      />

      <OwnershipTransferJourney
        isOpen={isOwnershipTransferOpen}
        onClose={() => setIsOwnershipTransferOpen(false)}
      />

      <PreContractedAntecipationJourney
        isOpen={isPreContractedAntecipationOpen}
        onClose={() => setIsPreContractedAntecipationOpen(false)}
      />
    </div>
  );
};
