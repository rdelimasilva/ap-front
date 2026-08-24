import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (clients: ImportedClient[]) => void;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string }>;
}

interface ImportedClient {
  id: string;
  name: string;
  email: string;
  document: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalLimit: number;
  usedLimit: number;
  availableLimit: number;
  collateralValue: number;
  status: 'pending';
}

interface ImportRow {
  cnpj?: string;
}

export const ImportClientsModal: React.FC<ImportClientsModalProps> = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
        setResult(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const validateClientData = (data: ImportRow, _rowIndex: number): { valid: boolean; error?: string } => {
    if (!data.cnpj || typeof data.cnpj !== 'string') {
      return { valid: false, error: 'CNPJ é obrigatório' };
    }
    return { valid: true };
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ImportRow>(worksheet);

      const errors: Array<{ row: number; error: string }> = [];
      const validClients: ImportedClient[] = [];

      jsonData.forEach((row, index: number) => {
        const validation = validateClientData(row, index + 2);

        if (!validation.valid) {
          errors.push({ row: index + 2, error: validation.error || 'Dados inválidos' });
        } else {
          const client = {
            id: `client-imported-${Date.now()}-${index}`,
            name: row.cnpj,
            email: '',
            document: row.cnpj,
            phone: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            totalLimit: 0,
            usedLimit: 0,
            availableLimit: 0,
            collateralValue: 0,
            status: 'pending',
          };
          validClients.push(client);
        }
      });

      setResult({
        success: validClients.length,
        errors: errors
      });

      if (validClients.length > 0 && onImport) {
        onImport(validClients);
      }
    } catch {
      setResult({
        success: 0,
        errors: [{ row: 0, error: 'Erro ao processar arquivo. Verifique se o formato está correto.' }]
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        cnpj: '12345678000190'
      },
      {
        cnpj: '98765432000110'
      },
      {
        cnpj: '11223344000155'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'template_importacao_cnpj.xlsx');
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setImporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Importar Clientes</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!result && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Formato do Arquivo</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      O arquivo deve conter apenas a coluna:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li><strong>cnpj</strong> (obrigatório)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Baixar Modelo de Importação</span>
                </button>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {!file ? (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 mb-2">
                      Arraste e solte o arquivo aqui ou
                    </p>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                        Selecionar Arquivo
                      </span>
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Formatos aceitos: .xlsx, .xls
                    </p>
                  </>
                ) : (
                  <div className="space-y-4">
                    <FileSpreadsheet className="w-12 h-12 text-green-600 mx-auto" />
                    <div>
                      <p className="text-gray-900 font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-700 text-sm transition-colors"
                    >
                      Remover arquivo
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {result && (
            <div className="space-y-4">
              {result.success > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-green-900">
                        {result.success} cliente(s) importado(s) com sucesso
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-900 mb-2">
                        {result.errors.length} erro(s) encontrado(s)
                      </h3>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {result.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-700">
                            Linha {error.row}: {error.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  Importar outro arquivo
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {result ? 'Fechar' : 'Cancelar'}
            </button>
            {!result && file && (
              <button
                onClick={handleImport}
                disabled={importing}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {importing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
                {importing ? 'Importando...' : 'Importar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
