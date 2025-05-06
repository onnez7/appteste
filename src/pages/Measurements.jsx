import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { InformationCircleIcon, ArrowPathIcon, CameraIcon } from '@heroicons/react/24/outline';
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
  const [capturedImage, setCapturedImage] = useState(null);
  const [savedMeasurements, setSavedMeasurements] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [referenceWidth, setReferenceWidth] = useState(85.6); // Largura de um cartão de crédito em mm
  const [pixelScale, setPixelScale] = useState(1); // Escala inicial de pixels por mm
  const webcamRef = useRef(null);

  // Função para capturar a imagem
  const captureImage = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      // Calcular a escala de pixels por mm (exemplo simplificado)
      // Suponha que o usuário meça a largura do cartão na imagem (em pixels)
      // Para simplificar, assumimos que o usuário fornece a largura do cartão em pixels
      const referencePixelWidth = prompt(
        'Meça a largura do cartão de crédito na imagem (em pixels) e insira o valor:',
        '100'
      );
      if (referencePixelWidth && !isNaN(referencePixelWidth)) {
        const scale = referenceWidth / parseFloat(referencePixelWidth); // mm por pixel
        setPixelScale(scale);
      }
    }
  };

  // Ajustar a régua com mais precisão
  const handleRulerAdjust = (e) => {
    const newPosition = Number(e.target.value);
    setRulerPosition(newPosition);
    // Ajustar medições com base na escala de pixels
    const baseDp = 60;
    const baseFaceWidth = 130;
    const baseLensHeight = 30;
    const baseTempleWidth = 125;
    setMeasurements({
      dp: Math.round(baseDp + (newPosition / 10) * pixelScale),
      faceWidth: Math.round(baseFaceWidth + (newPosition / 5) * pixelScale),
      lensHeight: Math.round(baseLensHeight + (newPosition / 20) * pixelScale),
      templeWidth: Math.round(baseTempleWidth + (newPosition / 10) * pixelScale),
    });
  };

  // Salvar medições
  const handleSave = () => {
    if (capturedImage) {
      setSavedMeasurements(measurements);
      setShowCamera(false);
      setCapturedImage(null); // Limpar imagem após salvar
    } else {
      alert('Por favor, capture uma imagem antes de salvar as medições.');
    }
  };

  // Refazer medições
  const handleRedo = () => {
    setShowCamera(false);
    setCapturedImage(null);
    setPixelScale(1);
    setRulerPosition(50);
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
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Realizar Medições</h2>
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
                  {rulerPosition}% (Escala: {pixelScale.toFixed(2)} mm/pixel)
                </span>
              </div>
            </div>
          </div>
        )}
        <input
          type="range"
          min="0"
          max="100"
          step="1" // Passos mais finos para maior precisão
          value={rulerPosition}
          onChange={handleRulerAdjust}
          className="w-full mt-4"
        />
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => setShowCamera(!showCamera)}
            className="flex-1 bg-primary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition"
          >
            {showCamera ? 'Fechar Câmera' : 'Abrir Câmera'}
          </button>
          {showCamera && (
            <button
              onClick={captureImage}
              className="flex-1 bg-secondary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition"
            >
              <CameraIcon className="w-5 h-5 inline mr-2" /> Tirar Foto
            </button>
          )}
        </div>
      </div>

      {capturedImage && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Imagem Capturada</h2>
          <img src={capturedImage} alt="Captured" className="w-full rounded-2xl mb-4" />
          <p className="text-sm text-gray-600 mb-2">Confirme se a imagem está correta antes de salvar.</p>
          <button
            onClick={handleSave}
            className="w-full bg-primary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition"
          >
            Salvar Medições
          </button>
        </div>
      )}

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
            <p className="text-sm text-gray-600 mb-2">
              <strong>Distância Pupilar (DP):</strong> A distância entre o centro das pupilas.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Largura do rosto:</strong> Medida total do rosto.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Altura da lente:</strong> Altura necessária para a lente.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Largura entre as têmporas:</strong> Distância entre as têmporas.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Instruções para Precisão:</strong> Posicione um cartão de crédito na testa para calibrar as medições. Após capturar a imagem, insira a largura do cartão em pixels para calcular a escala.
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