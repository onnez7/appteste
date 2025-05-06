import { CheckCircleIcon,  } from '@heroicons/react/24/outline';
import BottomNavBar from '../components/BottomNavBar';

export default function SubscriptionDetails() {
  const plans = [
    {
      name: 'Visão+',
      label: 'Básico',
      badgeColor: 'bg-green-500',
      benefits: [
        '1 consulta oftalmológica por ano',
        '1 medição digital gratuita',
        'Acesso a armações básicas',
        'Suporte via WhatsApp',
      ],
      price: 'R$29,90/mês',
    },
    {
      name: 'Visão+',
      label: 'Essencial',
      badgeColor: 'bg-primary',
      benefits: [
        '2 consultas oftalmológicas por ano',
        '2 medições digitais gratuitas',
        'Acesso a armações premium',
        'Promoções exclusivas',
        'Suporte preferencial',
      ],
      price: 'R$49,90/mês',
    },
    {
      name: 'Visão+',
      label: 'Premium',
      badgeColor: 'bg-secondary',
      benefits: [
        'Consultas ilimitadas (com agendamento prévio)',
        'Medições ilimitadas',
        'Acesso completo a todas as armações',
        'Atendimento prioritário',
        'Lentes com proteção anti-reflexo inclusas',
      ],
      price: 'R$79,90/mês',
      showCrown: true,
    },
  ];

  return (
    <div className="p-4">
      <div>
      {plans.map((plan, idx) => (
        <div key={idx} className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{plan.name}</h3>
            <span className={`ml-2 ${plan.badgeColor} text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center`}>
              {plan.showCrown && <CheckCircleIcon className="w-4 h-4 mr-1" />}
              {plan.label}
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-800 mb-2">Benefícios do plano:</h4>
          <ul className="space-y-2 mb-4">
            {plan.benefits.map((benefit, benefitIdx) => (
              <li key={benefitIdx} className="flex items-center text-sm text-gray-600">
                <CheckCircleIcon className="w-5 h-5 text-primary mr-2" />
                {benefit}
              </li>
            ))}
          </ul>
          <p className="text-lg font-bold text-gray-800 mb-4">{plan.price}</p>
          <button className="w-full bg-secondary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition">
            Assinar Agora
          </button>
        </div>
      ))}
    </div>
    <div>
        <BottomNavBar />
    </div>
    </div>
    
  );
}