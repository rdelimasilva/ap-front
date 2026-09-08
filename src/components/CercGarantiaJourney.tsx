import React from 'react';
import { NewContratoModal, type ContextoTrava } from './NewContratoModal';

export type { ContextoTrava };

interface CercGarantiaJourneyProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  contexto?: ContextoTrava;
}

// Ponto de entrada único da jornada de registro de garantia CERC-AP007. Existe
// para que os dois lugares que a abrem (card "Garantias" do seletor de Nova
// Trava, e a seção de contratos dentro do cliente) dependam de uma interface
// só, sem conhecer o formulário por dentro.
export const CercGarantiaJourney: React.FC<CercGarantiaJourneyProps> = ({ isOpen, onClose, onCreated, contexto }) => (
  <NewContratoModal
    isOpen={isOpen}
    onClose={onClose}
    onCreated={onCreated}
    contextoInicial={contexto}
  />
);
