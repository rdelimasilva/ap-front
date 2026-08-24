import React, { useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, CheckSquare } from 'lucide-react';
import { NewPartnerModal } from './NewPartnerModal';
import { OptInModule } from './OptInModule';

interface Partner {
  id: string;
  name: string;
  document: string;
  type: 'client';
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'Empresa Cliente A',
    document: '12.345.678/0001-90',
    type: 'client',
    email: 'contato@clientea.com',
    phone: '(11) 98765-4321',
    status: 'active',
  },
  {
    id: '2',
    name: 'Empresa Cliente B',
    document: '98.765.432/0001-10',
    type: 'client',
    email: 'financeiro@clienteb.com',
    phone: '(11) 91234-5678',
    status: 'active',
  }
];

export const PartnerRegistrationModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clients' | 'opt-in'>('clients');
  const [isNewPartnerModalOpen, setIsNewPartnerModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [partners, setPartners] = useState<Partner[]>(mockPartners);

  const filteredPartners = partners.filter(
    partner =>
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.document.includes(searchTerm)
  );

  const handleNewPartner = () => {
    setIsNewPartnerModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'clients' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab('opt-in')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'opt-in' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Opt-in</span>
          </button>
        </div>

        {activeTab === 'clients' && (
          <button
            onClick={handleNewPartner}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Cliente</span>
          </button>
        )}
      </div>

      {activeTab === 'opt-in' ? (
        <OptInModule />
      ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {filteredPartners.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">
                Nenhum cliente encontrado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CNPJ</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Telefone</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((partner) => (
                      <tr key={partner.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{partner.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{partner.document}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{partner.email}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{partner.phone}</td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              partner.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {partner.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      <NewPartnerModal
        isOpen={isNewPartnerModalOpen}
        onClose={() => setIsNewPartnerModalOpen(false)}
        partnerType="client"
        onSave={(partnerData) => {
          setPartners(prev => [
            {
              id: `partner-${Date.now()}`,
              name: partnerData.name,
              document: partnerData.document,
              type: 'client',
              email: partnerData.email,
              phone: partnerData.phone,
              status: partnerData.status,
            },
            ...prev,
          ]);
          setIsNewPartnerModalOpen(false);
        }}
      />

    </div>
  );
};
