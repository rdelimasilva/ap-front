import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useEscapeKey } from '../hooks/useKeyboardShortcuts';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'N'], description: 'Novo cliente', category: 'Geral' },
  { keys: ['Ctrl', 'K'], description: 'Busca global', category: 'Geral' },
  { keys: ['?'], description: 'Mostrar atalhos', category: 'Geral' },
  { keys: ['Esc'], description: 'Fechar modal/diálogo', category: 'Navegação' },
  { keys: ['↑', '↓'], description: 'Navegar em listas', category: 'Navegação' },
  { keys: ['Enter'], description: 'Selecionar item', category: 'Navegação' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEscapeKey(() => {
    if (isOpen) onClose();
  });

  if (!isOpen) return null;

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Keyboard className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Atalhos de Teclado</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 hover:bg-gray-50 rounded px-3"
                    >
                      <span className="text-gray-700">{shortcut.description}</span>
                      <div className="flex items-center space-x-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-gray-400 text-sm">+</span>
                            )}
                            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-700">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 text-sm text-gray-600">
          <p>
            💡 <strong>Dica:</strong> Pressione <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">?</kbd> a qualquer momento para ver esta lista
          </p>
        </div>
      </div>
    </div>
  );
};
