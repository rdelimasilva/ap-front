/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Receivable, Contract, Client } from '../types';
import type { ContaCorrenteEntry } from '../types/contaCorrente';
import type { LiquidationProblemUr } from '../data/csvLoader';
import { loadDataFromCsv } from '../data/csvLoader';
import {
  mockReceivables,
  mockContracts,
} from '../data/mockData';
import { mockContaCorrenteEntries } from '../data/contaCorrenteMockData';
import { listClientes, updateCliente, type ClienteDTO } from '../services/optinApi';

function clienteDtoParaClient(dto: ClienteDTO): Client {
  return {
    id: dto.id,
    name: dto.nome,
    document: dto.documento,
    email: dto.email ?? '',
    phone: dto.telefone ?? '',
    status: dto.status,
    totalLimit: 0,
    usedLimit: 0,
    availableLimit: 0,
    collateralValue: 0,
    createdAt: new Date(dto.criadoEm),
    updatedAt: new Date(dto.atualizadoEm),
  };
}
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
  updateClient: (clientId: string, data: Partial<Client>) => Promise<void>;
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
  const [clients, setClients] = useState<Client[]>([]);
  const [contaCorrenteEntries, setContaCorrenteEntries] = useState<ContaCorrenteEntry[]>(mockContaCorrenteEntries);
  const [liquidationProblems, setLiquidationProblems] = useState<LiquidationProblemUr[]>(mockLiquidationProblems);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useCsv, setUseCsv] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, clientesApi] = await Promise.all([
        loadDataFromCsv(),
        listClientes(),
      ]);
      setReceivables(data.receivables);
      setContracts(normalizeContracts(data.contracts));
      setClients(clientesApi.map(clienteDtoParaClient));
      setContaCorrenteEntries(data.contaCorrenteEntries);
      setLiquidationProblems(data.liquidationProblems);
      setUseCsv(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
      setUseCsv(false);
      setReceivables(mockReceivables);
      setContracts(normalizeContracts(mockContracts));
      try {
        setClients((await listClientes()).map(clienteDtoParaClient));
      } catch {
        setClients([]);
      }
      setContaCorrenteEntries(mockContaCorrenteEntries);
      setLiquidationProblems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateClient = useCallback(async (clientId: string, data: Partial<Client>) => {
    const payloadCadastro: { nome?: string; email?: string; telefone?: string; status?: string } = {};
    if (data.name !== undefined) payloadCadastro.nome = data.name;
    if (data.email !== undefined) payloadCadastro.email = data.email;
    if (data.phone !== undefined) payloadCadastro.telefone = data.phone;
    if (data.status !== undefined) payloadCadastro.status = data.status;

    let atualizadoViaApi: Partial<Client> = {};
    if (Object.keys(payloadCadastro).length > 0) {
      const dto = await updateCliente(clientId, payloadCadastro);
      atualizadoViaApi = {
        name: dto.nome,
        email: dto.email ?? '',
        phone: dto.telefone ?? '',
        status: dto.status,
      };
    }

    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      return { ...c, ...atualizadoViaApi, ...data, updatedAt: new Date() };
    }));
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
