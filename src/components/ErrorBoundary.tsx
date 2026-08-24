import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Algo deu errado
            </h1>

            <p className="text-gray-600 text-center mb-6">
              Ocorreu um erro inesperado na aplicação. Isso já foi registrado e nossa equipe
              está trabalhando para resolver.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Recarregar página</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="w-5 h-5" />
                <span>Voltar ao início</span>
              </button>
            </div>

            {this.state.error && (
              <div className="mt-6">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-center space-x-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span>Detalhes técnicos</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {this.state.showDetails && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2">
                    <p className="text-xs text-gray-700 font-mono break-all">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-gray-500 text-center mt-6">
              Se o problema persistir, entre em contato com o suporte técnico.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
