import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Calendar,
  DollarSign,
  Building2,
  CreditCard,
  FileText,
  CheckCircle,
  Clock
} from 'lucide-react';

interface ScheduleItem {
  id: string;
  documentoRecebedor: string;
  nomeRecebedor: string;
  dataVencimento: Date;
  valorBruto: number;
  valorLiquido: number;
  status: 'CONSTITUIDA' | 'A_CONSTITUIR';
  credenciadoraCNPJ: string;
  credenciadoraNome: string;
  codigoArranjoPagamento: string;
  descricaoArranjoPagamento: string;
  efeitoContrato: string;
  idContrato: string;
  prioridadeContrato: number;
  idUR: string;
  dataConstituicao?: Date;
  dataRegistroEfeito?: Date;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
}

type SortField = keyof ScheduleItem | 'none';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  search: string;
  status: string;
  credenciadora: string;
  arranjo: string;
  minValue: string;
  maxValue: string;
  dateFrom: string;
  dateTo: string;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  clientName
}) => {
  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const [sortField, setSortField] = useState<SortField>('dataVencimento');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    credenciadora: '',
    arranjo: '',
    minValue: '',
    maxValue: '',
    dateFrom: '',
    dateTo: '',
  });

  // Mock data baseado no arquivo CSV fornecido
  const scheduleData: ScheduleItem[] = useMemo(() => [
    {
      id: '1',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-02-11'),
      valorBruto: 100.00,
      valorLiquido: 95.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '35688153000158',
      credenciadoraNome: 'Dock',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '115',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '2',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2024-12-30'),
      valorBruto: 20.00,
      valorLiquido: 19.00,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '34892366000134',
      credenciadoraNome: 'Cielo',
      codigoArranjoPagamento: 'MASTERCARD',
      descricaoArranjoPagamento: 'Mastercard Crédito',
      efeitoContrato: 'CESSAO_FIDUCIARIA',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '2067',
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '3',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-03-11'),
      valorBruto: 100.00,
      valorLiquido: 95.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '45597546000100',
      credenciadoraNome: 'PagSeguro',
      codigoArranjoPagamento: 'ELO',
      descricaoArranjoPagamento: 'Elo Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '308',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '4',
      documentoRecebedor: '00185368000171',
      nomeRecebedor: 'XYZ Indústria Ltda.',
      dataVencimento: new Date('2025-05-02'),
      valorBruto: 6000.00,
      valorLiquido: 5700.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '00185368000171',
      credenciadoraNome: 'Stone',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Débito',
      efeitoContrato: 'PROMESSA_CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '3010',
      dataConstituicao: new Date('2024-11-22'),
      dataRegistroEfeito: new Date('2024-11-22')
    },
    {
      id: '5',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-07-05'),
      valorBruto: 2000.00,
      valorLiquido: 1900.00,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '34892366000134',
      credenciadoraNome: 'Cielo',
      codigoArranjoPagamento: 'MASTERCARD',
      descricaoArranjoPagamento: 'Mastercard Crédito',
      efeitoContrato: 'CESSAO_FIDUCIARIA',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '2025',
      dataRegistroEfeito: new Date('2024-11-22')
    },
    {
      id: '6',
      documentoRecebedor: '12586135000160',
      nomeRecebedor: 'Tech Solutions Brasil',
      dataVencimento: new Date('2025-06-01'),
      valorBruto: 10000.00,
      valorLiquido: 9500.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '12586135000160',
      credenciadoraNome: 'Rede',
      codigoArranjoPagamento: 'ELO',
      descricaoArranjoPagamento: 'Elo Débito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 3,
      idUR: '501',
      dataConstituicao: new Date('2024-11-22'),
      dataRegistroEfeito: new Date('2024-11-22')
    },
    {
      id: '7',
      documentoRecebedor: '33268302000102',
      nomeRecebedor: 'Varejo Prime Ltda.',
      dataVencimento: new Date('2025-01-28'),
      valorBruto: 800000.00,
      valorLiquido: 760000.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '33268302000102',
      credenciadoraNome: 'GetNet',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '501',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '8',
      documentoRecebedor: '49494244000167',
      nomeRecebedor: 'Empresa Exemplo Ltda.',
      dataVencimento: new Date('2024-11-25'),
      valorBruto: 72.00,
      valorLiquido: 68.40,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '49494244000167',
      credenciadoraNome: 'Safrapay',
      codigoArranjoPagamento: 'HIPERCARD',
      descricaoArranjoPagamento: 'Hipercard Crédito',
      efeitoContrato: 'PROMESSA_CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '29',
      dataRegistroEfeito: new Date('2024-11-22')
    },
    {
      id: '9',
      documentoRecebedor: '47944547000109',
      nomeRecebedor: 'Comércio Digital S.A.',
      dataVencimento: new Date('2024-11-25'),
      valorBruto: 100.00,
      valorLiquido: 95.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '47944547000109',
      credenciadoraNome: 'Mercado Pago',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '1551',
      dataConstituicao: new Date('2024-11-22'),
      dataRegistroEfeito: new Date('2024-11-22')
    },
    {
      id: '10',
      documentoRecebedor: '05940203000181',
      nomeRecebedor: 'Serviços Financeiros Ltda.',
      dataVencimento: new Date('2024-11-25'),
      valorBruto: 1000.00,
      valorLiquido: 950.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '05940203000181',
      credenciadoraNome: 'Dock',
      codigoArranjoPagamento: 'MASTERCARD',
      descricaoArranjoPagamento: 'Mastercard Débito',
      efeitoContrato: 'CESSAO_FIDUCIARIA',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '1828',
      dataConstituicao: new Date('2024-11-22'),
      dataRegistroEfeito: new Date('2024-11-22')
    },
    {
      id: '11',
      documentoRecebedor: '33268302000102',
      nomeRecebedor: 'Varejo Prime Ltda.',
      dataVencimento: new Date('2025-01-28'),
      valorBruto: 800000.00,
      valorLiquido: 760000.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '33268302000102',
      credenciadoraNome: 'GetNet',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '501',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '12',
      documentoRecebedor: '49494244000167',
      nomeRecebedor: 'Empresa Exemplo Ltda.',
      dataVencimento: new Date('2024-11-25'),
      valorBruto: 72.00,
      valorLiquido: 68.40,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '49494244000167',
      credenciadoraNome: 'Safrapay',
      codigoArranjoPagamento: 'HIPERCARD',
      descricaoArranjoPagamento: 'Hipercard Crédito',
      efeitoContrato: 'PROMESSA_CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '29',
      dataRegistroEfeito: new Date('2024-11-22')
    },
    {
      id: '13',
      documentoRecebedor: '47944547000109',
      nomeRecebedor: 'Comércio Digital S.A.',
      dataVencimento: new Date('2024-11-25'),
      valorBruto: 100.00,
      valorLiquido: 95.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '47944547000109',
      credenciadoraNome: 'Mercado Pago',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '1551',
      dataConstituicao: new Date('2024-11-22'),
      dataRegistroEfeito: new Date('2024-11-22')
    },
    {
      id: '14',
      documentoRecebedor: '12202612000146',
      nomeRecebedor: 'Empresa Comercial Ltda.',
      dataVencimento: new Date('2024-11-22'),
      valorBruto: 1000.00,
      valorLiquido: 950.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '12202612000146',
      credenciadoraNome: 'Rede',
      codigoArranjoPagamento: 'MASTERCARD',
      descricaoArranjoPagamento: 'Mastercard Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 3,
      idUR: '1310',
      dataConstituicao: new Date('2024-11-22'),
      dataRegistroEfeito: new Date('2024-11-22')
    },
    {
      id: '15',
      documentoRecebedor: '11392069000124',
      nomeRecebedor: 'Soluções Empresariais S.A.',
      dataVencimento: new Date('2024-11-25'),
      valorBruto: 1150.00,
      valorLiquido: 1092.50,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '45181802000183',
      credenciadoraNome: 'Dock',
      codigoArranjoPagamento: 'ELO',
      descricaoArranjoPagamento: 'Elo Débito',
      efeitoContrato: 'CESSAO_FIDUCIARIA',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '1525',
      dataRegistroEfeito: new Date('2024-11-22')
    },
    {
      id: '16',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-01-02'),
      valorBruto: 100.00,
      valorLiquido: 95.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '35688153000158',
      credenciadoraNome: 'Dock',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '172',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '17',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-01-02'),
      valorBruto: 2000.00,
      valorLiquido: 1900.00,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '34892366000134',
      credenciadoraNome: 'Cielo',
      codigoArranjoPagamento: 'MASTERCARD',
      descricaoArranjoPagamento: 'Mastercard Crédito',
      efeitoContrato: 'CESSAO_FIDUCIARIA',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '2475',
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '18',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-01-02'),
      valorBruto: 100.00,
      valorLiquido: 95.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '45597546000100',
      credenciadoraNome: 'PagSeguro',
      codigoArranjoPagamento: 'ELO',
      descricaoArranjoPagamento: 'Elo Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '254',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '19',
      documentoRecebedor: '00185368000171',
      nomeRecebedor: 'XYZ Indústria Ltda.',
      dataVencimento: new Date('2025-01-02'),
      valorBruto: 6000.00,
      valorLiquido: 5700.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '00185368000171',
      credenciadoraNome: 'Stone',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Débito',
      efeitoContrato: 'PROMESSA_CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '3212',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '20',
      documentoRecebedor: '12586135000160',
      nomeRecebedor: 'Tech Solutions Brasil',
      dataVencimento: new Date('2025-01-02'),
      valorBruto: 10000.00,
      valorLiquido: 9500.00,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '12586135000160',
      credenciadoraNome: 'Rede',
      codigoArranjoPagamento: 'ELO',
      descricaoArranjoPagamento: 'Elo Débito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 3,
      idUR: '605',
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '21',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-01-05'),
      valorBruto: 100.00,
      valorLiquido: 95.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '35688153000158',
      credenciadoraNome: 'Dock',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '88',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '22',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-01-05'),
      valorBruto: 2000.00,
      valorLiquido: 1900.00,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '34892366000134',
      credenciadoraNome: 'Cielo',
      codigoArranjoPagamento: 'MASTERCARD',
      descricaoArranjoPagamento: 'Mastercard Crédito',
      efeitoContrato: 'CESSAO_FIDUCIARIA',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '2440',
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '23',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-01-05'),
      valorBruto: 100.00,
      valorLiquido: 95.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '35688153000158',
      credenciadoraNome: 'Dock',
      codigoArranjoPagamento: 'ELO',
      descricaoArranjoPagamento: 'Elo Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '469',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '24',
      documentoRecebedor: '00185368000171',
      nomeRecebedor: 'XYZ Indústria Ltda.',
      dataVencimento: new Date('2025-01-05'),
      valorBruto: 6000.00,
      valorLiquido: 5700.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '00185368000171',
      credenciadoraNome: 'Stone',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Débito',
      efeitoContrato: 'PROMESSA_CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '3147',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '25',
      documentoRecebedor: '12586135000160',
      nomeRecebedor: 'Tech Solutions Brasil',
      dataVencimento: new Date('2025-01-05'),
      valorBruto: 10000.00,
      valorLiquido: 9500.00,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '12586135000160',
      credenciadoraNome: 'Rede',
      codigoArranjoPagamento: 'ELO',
      descricaoArranjoPagamento: 'Elo Débito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 3,
      idUR: '645',
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '26',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-01-06'),
      valorBruto: 50.00,
      valorLiquido: 47.50,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '34892366000134',
      credenciadoraNome: 'Cielo',
      codigoArranjoPagamento: 'MASTERCARD',
      descricaoArranjoPagamento: 'Mastercard Crédito',
      efeitoContrato: 'CESSAO_FIDUCIARIA',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '1020',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '27',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-01-06'),
      valorBruto: 100.00,
      valorLiquido: 95.00,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '45597546000100',
      credenciadoraNome: 'PagSeguro',
      codigoArranjoPagamento: 'ELO',
      descricaoArranjoPagamento: 'Elo Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '302',
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '28',
      documentoRecebedor: '00185368000171',
      nomeRecebedor: 'XYZ Indústria Ltda.',
      dataVencimento: new Date('2025-01-06'),
      valorBruto: 6000.00,
      valorLiquido: 5700.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '00185368000171',
      credenciadoraNome: 'Stone',
      codigoArranjoPagamento: 'VISA',
      descricaoArranjoPagamento: 'Visa Débito',
      efeitoContrato: 'PROMESSA_CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 1,
      idUR: '3146',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '29',
      documentoRecebedor: '45181802000183',
      nomeRecebedor: 'ABC Comércio S.A.',
      dataVencimento: new Date('2025-01-07'),
      valorBruto: 100.00,
      valorLiquido: 95.00,
      status: 'CONSTITUIDA',
      credenciadoraCNPJ: '45597546000100',
      credenciadoraNome: 'PagSeguro',
      codigoArranjoPagamento: 'ELO',
      descricaoArranjoPagamento: 'Elo Crédito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 2,
      idUR: '198',
      dataConstituicao: new Date('2024-12-12'),
      dataRegistroEfeito: new Date('2024-12-12')
    },
    {
      id: '30',
      documentoRecebedor: '12586135000160',
      nomeRecebedor: 'Tech Solutions Brasil',
      dataVencimento: new Date('2025-01-07'),
      valorBruto: 10000.00,
      valorLiquido: 9500.00,
      status: 'A_CONSTITUIR',
      credenciadoraCNPJ: '12586135000160',
      credenciadoraNome: 'Rede',
      codigoArranjoPagamento: 'ELO',
      descricaoArranjoPagamento: 'Elo Débito',
      efeitoContrato: 'CESSAO',
      idContrato: '44696520000156_CARTEIRA_PADRAO',
      prioridadeContrato: 3,
      idUR: '597',
      dataRegistroEfeito: new Date('2024-12-12')
    }
  ], []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'CONSTITUIDA': return 'bg-green-100 text-green-800';
      case 'A_CONSTITUIR': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'CONSTITUIDA': return <CheckCircle className="w-4 h-4" />;
      case 'A_CONSTITUIR': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'CONSTITUIDA': return 'Constituída';
      case 'A_CONSTITUIR': return 'A Constituir';
      default: return 'Desconhecido';
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      credenciadora: '',
      arranjo: '',
      minValue: '',
      maxValue: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  // Get unique values for filter dropdowns
  const uniqueCredenciadoras = [...new Set(scheduleData.map(r => r.credenciadoraNome))].sort();
  const uniqueArranjos = [...new Set(scheduleData.map(r => r.codigoArranjoPagamento))].sort();

  const filteredAndSortedData = useMemo(() => {
    const filtered = scheduleData.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          item.nomeRecebedor.toLowerCase().includes(searchLower) ||
          item.documentoRecebedor.includes(filters.search) ||
          item.credenciadoraNome.toLowerCase().includes(searchLower) ||
          item.idUR.toLowerCase().includes(searchLower) ||
          item.codigoArranjoPagamento.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && item.status !== filters.status) {
        return false;
      }

      // Credenciadora filter
      if (filters.credenciadora && item.credenciadoraNome !== filters.credenciadora) {
        return false;
      }

      // Arranjo filter
      if (filters.arranjo && item.codigoArranjoPagamento !== filters.arranjo) {
        return false;
      }

      // Value filters
      if (filters.minValue && item.valorBruto < parseFloat(filters.minValue)) {
        return false;
      }
      if (filters.maxValue && item.valorBruto > parseFloat(filters.maxValue)) {
        return false;
      }

      // Date filters
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (item.dataVencimento < fromDate) {
          return false;
        }
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (item.dataVencimento > toDate) {
          return false;
        }
      }

      return true;
    });

    // Sort
    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        const aValue = a[sortField] as unknown;
        const bValue = b[sortField] as unknown;

        if (aValue instanceof Date && bValue instanceof Date) {
          const cmp = aValue.getTime() - bValue.getTime();
          return sortDirection === 'asc' ? cmp : -cmp;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const cmp = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          return sortDirection === 'asc' ? cmp : -cmp;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const cmp = aValue - bValue;
          return sortDirection === 'asc' ? cmp : -cmp;
        }

        return 0;
      });
    }

    return filtered;
  }, [scheduleData, filters, sortField, sortDirection]);

  // Calculate summary statistics
  const stats = {
    total: filteredAndSortedData.length,
    totalValueBruto: filteredAndSortedData.reduce((sum, r) => sum + r.valorBruto, 0),
    totalValueLiquido: filteredAndSortedData.reduce((sum, r) => sum + r.valorLiquido, 0),
    constituidas: filteredAndSortedData.filter(r => r.status === 'CONSTITUIDA').length,
    aConstituir: filteredAndSortedData.filter(r => r.status === 'A_CONSTITUIR').length,
  };

  const handleExport = () => {
    // Export functionality
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Agenda de Recebíveis</h2>
            <p className="text-gray-600">Cliente: {clientName}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="flex items-center justify-center space-x-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors h-8 text-sm font-normal"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors h-8 flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total de URs</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Valor Bruto Total</p>
                  <p className="text-lg font-bold text-green-900">{formatCurrency(stats.totalValueBruto)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Valor Líquido Total</p>
                  <p className="text-lg font-bold text-purple-900">{formatCurrency(stats.totalValueLiquido)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Constituídas</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.constituidas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">A Constituir</p>
                  <p className="text-2xl font-bold text-amber-900">{stats.aConstituir}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por recebedor, documento, credenciadora, UR..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-96"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center space-x-2 px-4 rounded-lg border transition-colors h-8 text-sm font-normal ${
                  showFilters || hasActiveFilters
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                    {Object.values(filters).filter(v => v !== '').length}
                  </span>
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center space-x-2 px-3 text-gray-600 hover:text-gray-800 transition-colors h-8 text-sm font-normal"
                >
                  <X className="w-4 h-4" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {filteredAndSortedData.length} de {scheduleData.length} recebíveis
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="CONSTITUIDA">Constituída</option>
                  <option value="A_CONSTITUIR">A Constituir</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credenciadora</label>
                <select
                  value={filters.credenciadora}
                  onChange={(e) => setFilters(prev => ({ ...prev, credenciadora: e.target.value }))}
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
                >
                  <option value="">Todas</option>
                  {uniqueCredenciadoras.map(credenciadora => (
                    <option key={credenciadora} value={credenciadora}>{credenciadora}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arranjo</label>
                <select
                  value={filters.arranjo}
                  onChange={(e) => setFilters(prev => ({ ...prev, arranjo: e.target.value }))}
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
                >
                  <option value="">Todos</option>
                  {uniqueArranjos.map(arranjo => (
                    <option key={arranjo} value={arranjo}>{arranjo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minValue}
                  onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máximo</label>
                <input
                  type="number"
                  placeholder="999999"
                  value={filters.maxValue}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('nomeRecebedor')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    title="Nome empresarial ou nome do usuário recebedor"
                  >
                    <span>Recebedor</span>
                    {getSortIcon('nomeRecebedor')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('dataVencimento')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    title="Data de vencimento da Unidade de Recebível (UR)"
                  >
                    <span>Vencimento</span>
                    {getSortIcon('dataVencimento')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('valorBruto')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    title="Valor bruto da UR"
                  >
                    <span>Valor Bruto</span>
                    {getSortIcon('valorBruto')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('valorLiquido')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    title="Valor líquido da UR após taxas, encargos ou descontos"
                  >
                    <span>Valor Líquido</span>
                    {getSortIcon('valorLiquido')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    title="Status da UR: CONSTITUIDA ou A_CONSTITUIR"
                  >
                    <span>Status</span>
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('credenciadoraNome')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    title="Nome da credenciadora responsável pelo registro da UR"
                  >
                    <span>Credenciadora</span>
                    {getSortIcon('credenciadoraNome')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('codigoArranjoPagamento')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    title="Código da bandeira/arranjo (ex: VISA, MASTERCARD, etc.)"
                  >
                    <span>Arranjo</span>
                    {getSortIcon('codigoArranjoPagamento')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('efeitoContrato')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    title="Tipo de efeito vigente: CESSAO, CESSAO_FIDUCIARIA, PROMESSA_CESSAO, etc."
                  >
                    <span>Efeito</span>
                    {getSortIcon('efeitoContrato')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('idUR')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    title="Identificador único da UR e informações do contrato"
                  >
                    <span>ID UR</span>
                    {getSortIcon('idUR')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.nomeRecebedor}</div>
                      <div className="text-xs text-gray-500" title="CNPJ/CPF do usuário final recebedor (EC - estabelecimento comercial)">
                        {item.documentoRecebedor}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{formatDate(item.dataVencimento)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.valorBruto)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.valorLiquido)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">{getStatusLabel(item.status)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.credenciadoraNome}</div>
                        <div className="text-xs text-gray-500" title="CNPJ da credenciadora responsável pelo registro da UR">
                          {item.credenciadoraCNPJ}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900" title="Código da bandeira/arranjo">
                        {item.codigoArranjoPagamento}
                      </div>
                      <div className="text-xs text-gray-500" title="Nome descritivo da bandeira (ex: 'Visa Crédito')">
                        {item.descricaoArranjoPagamento}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full" title="Tipo de efeito vigente no contrato">
                      {item.efeitoContrato.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900" title="Identificador único da UR">
                        {item.idUR}
                      </div>
                      <div className="text-xs text-gray-500" title="Ordem de prioridade do contrato na agenda">
                        Prioridade: {item.prioridadeContrato}
                      </div>
                      {item.dataConstituicao && (
                        <div className="text-xs text-gray-500" title="Data de constituição da UR (se CONSTITUIDA)">
                          Constituição: {formatDate(item.dataConstituicao)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500" title="Identificador do contrato vinculado à UR">
                        Contrato: {item.idContrato}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAndSortedData.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">Nenhum recebível encontrado</div>
              <div className="text-sm text-gray-400">
                Tente ajustar os filtros ou termos de busca
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {filteredAndSortedData.length > 0 && (
          <div className="bg-blue-50 border-t-2 border-blue-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-800">Total Filtrado:</span>
                <span className="font-bold text-blue-900">{stats.total} URs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-800">Valor Bruto:</span>
                <span className="font-bold text-blue-900">{formatCurrency(stats.totalValueBruto)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-800">Valor Líquido:</span>
                <span className="font-bold text-blue-900">{formatCurrency(stats.totalValueLiquido)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-800">Taxa Média:</span>
                <span className="font-bold text-blue-900">
                  {((1 - stats.totalValueLiquido / stats.totalValueBruto) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
