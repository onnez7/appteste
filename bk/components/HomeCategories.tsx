import { PhoneIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function HomeCategories() {
  return (
    <div className="px-4 py-2">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Próxima Consulta:</h3>
      
      <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center">
        <img src="" alt="" />
        <div className="w-16 h-26 bg-gray-300 rounded-5 mr-4"></div>
        
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">Dr. Joana Fernandes</p>
          
          <div className="flex gap-1">
          <MapPinIcon className="w-5 h-5"/>
          <p className="text-sm text-gray-600">Ótica Centro – Florianópolis</p>
          </div>

          <div className="flex gap-1">
          <CalendarIcon className="w-5 h-5"/>
          <p className="text-sm text-gray-600">20/05/2025 às 15:00</p>
          </div>

          <div className="flex gap-1">
          <PhoneIcon className="w-5 h-5"/>
          <p className="text-sm text-gray-600">(48) 99999-9999</p>
          </div>

          <div className="flex mt-2 space-x-2">
            <button className="text-secondary text-sm hover:underline">Ver Detalhes</button>
            <button className="bg-primary text-white px-4 py-1 rounded-full text-sm hover:bg-opacity-80 transition">
              Remarcar
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}