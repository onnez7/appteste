import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { InformationCircleIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function MeasurementGuide() {
  const [step, setStep] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const [measurements, setMeasurements] = useState({
    dp: 62, // Distância Pupilar (mm)
    faceWidth: 140, // Largura do rosto (mm)
    lensHeight: 35, // Altura da lente (mm)
    templeWidth: 130, // Largura entre as têmporas (mm)
  });
  const [rulerPosition, setRulerPosition] = useState(50); // Percentage for ruler position
  const [savedMeasurements, setSavedMeasurements] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const webcamRef = useRef(null);

  const steps = [
    'Pegue um cartão (ex: cartão de crédito)',
    'Coloque-o na testa ou no nariz',
    'Aponte a câmera para seu rosto',
    'Ajuste a régua virtual',
  ];

  const handleNextStep = () => {
    if (step === 3) setShowCamera(true);
    if (step < steps.length) setStep(step + 1);
  };

  const handleRulerAdjust = (e) => {
    const newPosition = Number(e.target.value);
    setRulerPosition(newPosition);
    // Mock measurement calculation based on ruler position
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
    setStep(1);
  };

  const handleRedo = () => {
    setShowCamera(false);
    setStep(1);
    setMeasurements({
      dp: 62,
      faceWidth: 140,
      lensHeight: 35,
      templeWidth: 130,
    });
  };

  return (
    <div className="p-4">
      {/* Step-by-Step Guide */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Passo a Passo</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          {steps.map((s, idx) => (
            <li key={idx} className={step > idx ? 'text-primary font-medium' : ''}>
              {s}
            </li>
          ))}
        </ol>
        <div className="mt-4">
          <div className="bg-gray-300 h-40 rounded-2xl flex items-center justify-center">
            <p className="text-gray-600">Vídeo Demonstrativo (Placeholder)</p>
          </div>
        </div>
        {step <= steps.length && (
          <button
            onClick={handleNextStep}
            className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition"
          >
            {step === steps.length ? 'Finalizar Ajuste' : 'Próximo Passo'}
          </button>
        )}
      </div>

      {/* Virtual Ruler with Camera */}
      {showCamera && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Régua Virtual</h2>
          <div className="relative">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full rounded-2xl"
              videoConstraints={{ facingMode: 'user' }}
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
          <input
            type="range"
            min="0"
            max="100"
            value={rulerPosition}
            onChange={handleRulerAdjust}
            className="w-full mt-4"
          />
        </div>
      )}

      {/* Measurements */}
      {step > steps.length && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Medições</h2>
          <div className="bg-white p-4 rounded-2xl shadow-md">
            <p className="text-sm text-gray-600">
              Distância Pupilar (DP): {measurements.dp} mm
            </p>
            <p className="text-sm text-gray-600">
              Largura do rosto: {measurements.faceWidth} mm
            </p>
            <p className="text-sm text-gray-600">
              Altura da lente: {measurements.lensHeight} mm
            </p>
            <p className="text-sm text-gray-600">
              Largura entre as têmporas: {measurements.templeWidth} mm
            </p>
          </div>
        </div>
      )}

      {/* Save Measurements */}
      {step > steps.length && (
        <div className="mb-6">
          <button
            onClick={handleSave}
            className="w-full bg-secondary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition mb-2"
          >
            Salvar Medidas
          </button>
          <button className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm hover:bg-gray-300 transition">
            Enviar para Especialista
          </button>
        </div>
      )}

      {/* Useful Buttons */}
      {savedMeasurements && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Ações</h2>
          <button
            onClick={handleRedo}
            className="w-full flex items-center justify-center bg-white p-4 rounded-2xl shadow-md mb-2 hover:bg-gray-100 transition"
          >
            <ArrowPathIcon className="w-5 h-5 text-primary mr-2" />
            Refazer Medidas
          </button>
          <button
            onClick={() => alert(JSON.stringify(savedMeasurements, null, 2))}
            className="w-full flex items-center justify-center bg-white p-4 rounded-2xl shadow-md mb-2 hover:bg-gray-100 transition"
          >
            <EyeIcon className="w-5 h-5 text-primary mr-2" />
            Ver Medidas Salvas
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center bg-white p-4 rounded-2xl shadow-md hover:bg-gray-100 transition"
          >
            <InformationCircleIcon className="w-5 h-5 text-primary mr-2" />
            Entenda suas Medidas
          </button>
        </div>
      )}

      {/* Modal for Explaining Measurements */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Entenda suas Medidas</h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Distância Pupilar (DP):</strong> A distância entre o centro das pupilas, essencial para alinhar as lentes.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Largura do rosto:</strong> Medida da largura total do rosto, usada para escolher armações.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Altura da lente:</strong> Altura da lente necessária para cobrir a área de visão.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Largura entre as têmporas:</strong> Distância entre as laterais da cabeça, para ajuste das hastes.
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
    </div>
  );
}