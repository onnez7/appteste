import { UserIcon, CalendarIcon, ShoppingBagIcon, CreditCardIcon, QuestionMarkCircleIcon, DocumentTextIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

export default function AccountOptions() {
  const options = [
    { label: 'Perfil do Usuário', icon: <UserIcon className="w-5 h-5 text-gray-600" /> },
    { label: 'Minhas Consultas', icon: <CalendarIcon className="w-5 h-5 text-gray-600" /> },
    { label: 'Meus Pedidos', icon: <ShoppingBagIcon className="w-5 h-5 text-gray-600" /> },
    { label: 'Dados de Pagamento', icon: <CreditCardIcon className="w-5 h-5 text-gray-600" /> },
    { label: 'Ajuda e Suporte / FAQ', icon: <QuestionMarkCircleIcon className="w-5 h-5 text-gray-600" /> },
    { label: 'Termos e Políticas', icon: <DocumentTextIcon className="w-5 h-5 text-gray-600" /> },
  ];

  return (
    <div className="pt-4 flex-col justify-between">
      <div className="space-y-2">
        {options.map((option, idx) => (
          <button
            key={idx}
            className="flex items-center w-full bg-gray-200 p-4 rounded-2xl shadow-md hover:bg-gray-300 transition"
          >
            {option.icon}
            <span className="ml-3 text-gray-800">{option.label}</span>
          </button>
        ))}
      </div>
      <button className="mt-4 w-full flex items-center justify-center bg-secondary text-white p-4 rounded-2xl shadow-md hover:bg-opacity-80 transition">
        <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
        Sair da Conta
      </button>
    </div>
  );
}