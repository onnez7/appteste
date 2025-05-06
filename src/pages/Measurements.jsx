import React, { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import WebcamCapture from '../components/WebcamCapture';
import FaceOverlay from '../components/FaceOverlay';
import MeasurementDisplay from '../components/MeasurementDisplay';
import BottomNavBar from '../components/BottomNavBar';

export default function Measurements() {
  const [measurements, setMeasurements] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [savedMeasurements, setSavedMeasurements] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pixelScale, setPixelScale] = useState(1);
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleCapture = (newMeasurements, imageSrc, scale) => {
    setMeasurements(newMeasurements);
    setCapturedImage(imageSrc);
    setPixelScale(scale);
    setSavedMeasurements(newMeasurements);
    setError(null);
    setShowCamera(false);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleRedo = () => {
    setMeasurements(null);
    setCapturedImage(null);
    setPixelScale(1);
    setShowCamera(true);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Realizar Medições com IA</h2>
      {error && (
        <p className="text-sm text-red-600 mb-2">
          {error} Tente reposicionar o rosto ou use outro dispositivo.
        </p>
      )}
      <div className="relative">
        <WebcamCapture
          onCapture={handleCapture}
          onError={handleError}
          showCamera={showCamera}
          onShowCamera={setShowCamera}
        />
        <FaceOverlay showCamera={showCamera} />
      </div>

      <MeasurementDisplay
        measurements={measurements}
        capturedImage={capturedImage}
        scale={pixelScale}
        onRedo={handleRedo}
        savedMeasurements={savedMeasurements}
      />

      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-white p-4 rounded-2xl shadow-md hover:bg-gray-100 transition"
      >
        <InformationCircleIcon className="w-5 h-5 text-primary mr-2 inline" /> Entenda suas Medidas
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Entenda suas Medidas</h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Distância Pupilar (DP):</strong> A distância entre o centro das pupilas.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Largura do rosto:</strong> Medida total do rosto.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Altura da lente:</strong> Altura necessária para a lente.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Largura entre as têmporas:</strong> Distância entre as têmporas.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Comprimento do nariz:</strong> Distância entre a ponta do nariz e a boca.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Instruções:</strong> Use a câmera frontal, posicione seu rosto dentro do oval, olhe fixamente para a câmera e mova a cabeça levemente.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-primary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
}