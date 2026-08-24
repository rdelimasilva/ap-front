import { useState } from 'react';
import { Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
}

export function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (!password.trim()) {
      setError('Por favor, informe sua senha.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      onLogin(email, password);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Bem-vindo</h1>
            <p className="text-gray-600">Entre com suas credenciais para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">Lembrar de mim</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setForgotEmail(email);
                  setForgotSent(false);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Não tem uma conta?</span>
            </div>
          </div>

          <button
            onClick={onSwitchToRegister}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Criar nova conta
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2025 Todos os direitos reservados</p>
        </div>
      </div>

      {showForgotPassword && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowForgotPassword(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {forgotSent ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">E-mail enviado!</h2>
                <p className="text-gray-600 text-sm">
                  Se o e-mail <strong>{forgotEmail}</strong> estiver cadastrado, você receberá
                  as instruções para redefinir sua senha em instantes.
                </p>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Voltar ao login
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Recuperar senha</h2>
                  <p className="text-gray-600 text-sm">
                    Informe seu e-mail e enviaremos instruções para redefinir sua senha.
                  </p>
                </div>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="seu@email.com"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!forgotEmail.trim() || forgotLoading}
                    onClick={() => {
                      setForgotLoading(true);
                      setTimeout(() => {
                        setForgotLoading(false);
                        setForgotSent(true);
                      }, 1500);
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
