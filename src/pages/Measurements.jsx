import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { InformationCircleIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import BottomNavBar from '../components/BottomNavBar';

export default function Measurements() {
  const [showCamera, setShowCamera] = useState(false);
  const [measurements, setMeasurements] = useState({
    dp: 62,
    faceWidth: 140,
    lensHeight: 35,
    templeWidth: 130,
  });
  const [rulerPosition, setRulerPosition] = useState(50);
  const [savedMeasurements, setSavedMeasurements] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const webcamRef = useRef(null);

  const handleRulerAdjust = (e) => {
    const newPosition = Number(e.target.value);
    setRulerPosition(newPosition);
    setMeasurements({
      dp: 60 + Math.round(newPosition / 10),
      faceWidth: 130 + Math.round(newPosition / 5),
      lensHeight: 30 + Math.round(newPosition / 20),
      templeWidth: 125 + Math.round(newPosition / 10),
    });
  };

  const handleSave = () => {
    setSavedMeasurements(measurements);
    setShowCamera(false);
  };

  const handleRedo = () => {
    setShowCamera(false);
    setMeasurements({
      dp: 62,
      faceWidth: 140,
      lensHeight: 35,
      templeWidth: 130,
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        {showCamera && (
          <div className="relative">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full rounded-2xl"
              videoConstraints={{ facingMode: { exact: 'user' } }}
            />
            <div
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <div
                className="absolute w-full border-t-2 border-primary"
                style={{ top: `${rulerPosition}%` }}
              >
                <span className="absolute left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                  {rulerPosition}%
                </span>
              </div>
            </div>
          </div>
        )}
        <input
          type="range"
          min="0"
          max="100"
          value={rulerPosition}
          onChange={handleRulerAdjust}
          className="w-full mt-4"
        />
        <button
          onClick={() => setShowCamera(!showCamera)}
          className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition"
        >
          {showCamera ? 'Fechar Câmera' : 'Abrir Câmera'}
        </button>
      </div>

      {savedMeasurements && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Medições Salvas</h2>
          <div className="bg-white p-4 rounded-2xl shadow-md">
            <p className="text-sm text-gray-600">DP: {savedMeasurements.dp} mm</p>
            <p className="text-sm text-gray-600">Largura do rosto: {savedMeasurements.faceWidth} mm</p>
            <p className="text-sm text-gray-600">Altura da lente: {savedMeasurements.lensHeight} mm</p>
            <p className="text-sm text-gray-600">Largura entre as têmporas: {savedMeasurements.templeWidth} mm</p>
          </div>
          <button
            onClick={handleRedo}
            className="mt-4 w-full bg-white p-4 rounded-2xl shadow-md hover:bg-gray-100 transition"
          >
            <ArrowPathIcon className="w-5 h-5 text-primary mr-2 inline" /> Refazer
          </button>
        </div>
      )}

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
            <p className="text-sm text-gray-600 mb-2"><strong>Distância Pupilar (DP):</strong> A distância entre o centro das pupilas.</p>
            <p className="text-sm text-gray-600 mb-2"><strong>Largura do rosto:</strong> Medida total do rosto.</p>
            <p className="text-sm text-gray-600 mb-2"><strong>Altura da lente:</strong> Altura necessária para a lente.</p>
            <p className="text-sm text-gray-600 mb-4"><strong>Largura entre as têmporas:</strong> Distância entre as têmporas.</p>
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