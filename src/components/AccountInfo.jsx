import { PencilIcon, BellIcon } from '@heroicons/react/24/outline';

export default function AccountInfo() {
  return (
    <div className="relative p-6 bg-secondary text-white rounded-2xl shadow-lg">
      <PencilIcon className="absolute top-4 left-4 w-5 h-5 text-white" />
      <BellIcon className="absolute top-4 right-4 w-5 h-5 text-white" />
      <div className="flex flex-col items-center mt-4">
        <img className="w-20 h-20 bg-white rounded-full mb-4" src="src\assets\perfil.jpg" alt="" />
        <h2 className="text-xl font-bold">Jerferson Felipe</h2>
        <p className="text-sm mt-1">@jerferson</p>
      </div>
    </div>
  );
}