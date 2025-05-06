import { BoltIcon } from '@heroicons/react/24/outline';

export default function HomeBanner() {
  return (
    <div className="px-4 py-2">
      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <div className="flex items-center mb-4">
          <BoltIcon className="w-6 h-6 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Próxima Consulta: Plano Essencial</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Utilização no período:</span>
            <span>2/ilimitado</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Consultas:</span>
            <span>1/2</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Descontos utilizados:</span>
            <span>1/ilimitado</span>
          </div>
        </div>
        <button className="mt-4 w-full bg-secondary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition">
          Ver o plano
        </button>
      </div>
    </div>
  );
}