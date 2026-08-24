/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Receivable, Contract, Client } from '../types';
import type { ContaCorrenteEntry } from '../types/contaCorrente';
import type { LiquidationProblemUr } from '../data/csvLoader';
import { loadDataFromCsv } from '../data/csvLoader';
import {
  mockReceivables,
  mockContracts,
  mockClients,
} from '../data/mockData';
import { mockContaCorrenteEntries } from '../data/contaCorrenteMockData';
export interface DataContextValue {
  receivables: Receivable[];
  contracts: Contract[];
  clients: Client[];
  contaCorrenteEntries: ContaCorrenteEntry[];
  liquidationProblems: LiquidationProblemUr[];
  isLoading: boolean;
  error: string | null;
  useCsv: boolean;
  retry: () => void;
  updateClient: (clientId: string, data: Partial<Client>) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const mockLiquidationProblems: LiquidationProblemUr[] = [];

/** Garante que contratos legados sem campos de aprovação recebam defaults */
function normalizeContracts(contracts: Contract[]): Contract[] {
  return contracts.map(c => ({
    ...c,
    requiredApprovals: c.requiredApprovals ?? 1,
    approvals: c.approvals ?? [],
  }));
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [receivables, setReceivables] = useState<Receivable[]>(mockReceivables);
  const [contracts, setContracts] = useState<Contract[]>(normalizeContracts(mockContracts));
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [contaCorrenteEntries, setContaCorrenteEntries] = useState<ContaCorrenteEntry[]>(mockContaCorrenteEntries);
  const [liquidationProblems, setLiquidationProblems] = useState<LiquidationProblemUr[]>(mockLiquidationProblems);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useCsv, setUseCsv] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadDataFromCsv();
      setReceivables(data.receivables);
      setContracts(normalizeContracts(data.contracts));
      setClients(data.clients);
      setContaCorrenteEntries(data.contaCorrenteEntries);
      setLiquidationProblems(data.liquidationProblems);
      setUseCsv(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar CSV');
      setUseCsv(false);
      setReceivables(mockReceivables);
      setContracts(normalizeContracts(mockContracts));
      setClients(mockClients);
      setContaCorrenteEntries(mockContaCorrenteEntries);
      setLiquidationProblems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateClient = useCallback((clientId: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...data, updatedAt: new Date() } : c));
  }, []);

  const value: DataContextValue = {
    receivables,
    contracts,
    clients,
    contaCorrenteEntries,
    liquidationProblems,
    isLoading,
    error,
    useCsv,
    retry: load,
    updateClient,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
