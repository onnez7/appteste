export default function HomeHighlights() {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Minhas Médicas:</h3>
      <div className="bg-secondary h-24 rounded-2xl mb-6"></div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Armações Disponíveis:</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-secondary h-24 rounded-2xl"></div>
        <div className="bg-secondary h-24 rounded-2xl"></div>
        <div className="bg-secondary h-24 rounded-2xl"></div>
      </div>
    </div>
  );
}