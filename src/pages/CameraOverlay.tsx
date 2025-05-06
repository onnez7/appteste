import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';

export default function CameraOverlay() {
  const navigate = useNavigate();

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* Câmera em tela cheia */}
      <Webcam
        className="w-full h-full object-cover"
        videoConstraints={{ facingMode: 'user' }}
      />

      {/* Overlay do cartão (retângulo para alinhar o cartão) */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-64 h-40 border-2 border-dashed border-primary bg-opacity-20 bg-primary flex items-center justify-center">
        <p className="text-white text-sm text-center">Alinhe o cartão (85.6mm x 53.98mm) aqui</p>
      </div>

      {/* Overlay do rosto (retângulo para alinhar o rosto) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-dashed border-secondary bg-opacity-20 bg-secondary flex items-center justify-center">
        <p className="text-white text-sm text-center">Alinhe seu rosto aqui</p>
      </div>

      {/* Botão Pronto */}
      <button
        onClick={() => navigate('/measurements')}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-full text-base hover:bg-opacity-80 transition"
      >
        Pronto
      </button>
    </div>
  );
}