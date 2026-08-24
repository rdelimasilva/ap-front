import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, CheckCircle, Loader2, AlertTriangle, User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { showToast } from '../hooks/useToast';

interface OptInData {
  id: string;
  client_name: string;
  client_document: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  status: string;
  expiry_date: string;
  created_at: string;
}

export const OptInSignature: React.FC = () => {
  const [optInData, setOptInData] = useState<OptInData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [success, setSuccess] = useState(false);

  const token = window.location.pathname.split('/').pop();

  const loadOptInData = useCallback(async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/opt_in_requests?signature_token=eq.${token}&select=*`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar dados do opt-in');
      }

      const data = await response.json();

      if (data.length === 0) {
        throw new Error('Opt-in não encontrado');
      }

      const optIn = data[0];

      if (optIn.status === 'signed') {
        setSuccess(true);
      } else if (optIn.status === 'expired') {
        throw new Error('Este opt-in expirou');
      } else if (optIn.status === 'cancelled') {
        throw new Error('Este opt-in foi cancelado');
      }

      setOptInData(optIn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOptInData();
  }, [loadOptInData]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSignatureData(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const handleSign = async () => {
    if (!signatureData) {
      showToast('warning', 'Assinatura necessária', 'Por favor, assine no campo acima.');
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/opt_in_requests?signature_token=eq.${token}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: 'pending_registry',
          signed_at: new Date().toISOString(),
          signature_data: { signature: signatureData },
          signature_ip: 'client'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao assinar documento');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsSigning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Documento Assinado!</h2>
          <p className="text-gray-600 mb-6">
            Seu termo de consentimento foi assinado com sucesso.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
            <p className="text-gray-700">
              <strong>Cliente:</strong> {optInData?.client_name}
            </p>
            <p className="text-gray-700">
              <strong>Documento:</strong> {optInData?.client_document}
            </p>
            <p className="text-gray-700">
              <strong>Data da Assinatura:</strong> {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Termo de Consentimento Opt-In</h1>
            </div>
            <p className="text-blue-100">
              Leia atentamente e assine digitalmente este documento
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Cliente</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="text-gray-900 font-medium">{optInData?.client_name}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">CNPJ/CPF</p>
                    <p className="text-gray-900 font-medium">{optInData?.client_document}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">E-mail</p>
                    <p className="text-gray-900 font-medium">{optInData?.client_email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="text-gray-900 font-medium">{optInData?.client_phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Endereço</p>
                    <p className="text-gray-900 font-medium">{optInData?.client_address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Validade</p>
                    <p className="text-gray-900 font-medium">
                      {optInData ? formatDate(optInData.expiry_date) : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Termos do Consentimento</h3>
              <div className="prose prose-sm text-gray-700 space-y-3">
                <p>
                  Pelo presente instrumento, eu, <strong>{optInData?.client_name}</strong>,
                  inscrito no CNPJ/CPF sob o número <strong>{optInData?.client_document}</strong>,
                  autorizo expressamente:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    O uso de meus recebíveis de cartão de crédito e débito como garantia
                    para operações financeiras.
                  </li>
                  <li>
                    A consulta, análise e processamento de minhas informações financeiras
                    junto às adquirentes e registradoras.
                  </li>
                  <li>
                    A oneração e transferência de titularidade dos recebíveis quando
                    necessário para as operações contratadas.
                  </li>
                  <li>
                    O compartilhamento dessas informações com parceiros comerciais
                    autorizados para fins de análise de crédito e gestão de garantias.
                  </li>
                </ul>
                <p>
                  Este consentimento é válido até <strong>
                    {optInData ? formatDate(optInData.expiry_date) : ''}
                  </strong> e pode ser revogado a qualquer momento mediante comunicação formal.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Assinatura Digital</h3>
                <button
                  onClick={clearSignature}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpar
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Assine com o mouse ou toque na tela no espaço abaixo:
              </p>
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
                style={{ touchAction: 'none' }}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Segurança e Privacidade
                  </h4>
                  <p className="text-sm text-blue-700">
                    Sua assinatura é criptografada e armazenada de forma segura.
                    Este documento possui validade jurídica conforme a legislação vigente.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center pt-4">
              <button
                onClick={handleSign}
                disabled={isSigning || !signatureData}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Confirmar Assinatura</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Documento gerado em {optInData ? formatDate(optInData.created_at) : ''}</p>
        </div>
      </div>
    </div>
  );
};
