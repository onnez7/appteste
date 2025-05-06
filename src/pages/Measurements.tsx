import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { InformationCircleIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';

interface Measurements {
  dp: number;
  faceWidth: number;
  lensHeight: number;
  templeWidth: number;
}

export default function Measurements() {
  const [showCamera, setShowCamera] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rulerPosition, setRulerPosition] = useState(50); // Posição inicial da régua (em %)
  const [faceBox, setFaceBox] = useState({ width: 200, height: 300, x: 50, y: 50 }); // Caixa do rosto (pixels)
  const [measurements, setMeasurements] = useState<Measurements>({
    dp: 62, // Distância Pupilar (mm)
    faceWidth: 140, // Largura do rosto (mm)
    lensHeight: 35, // Altura da lente (mm)
    templeWidth: 130, // Largura entre as têmporas (mm)
  });
  const [adjustedMeasurements, setAdjustedMeasurements] = useState<Measurements>({ ...measurements });
  const [savedMeasurements, setSavedMeasurements] = useState<Measurements | null>(null);
  const [showModal, setShowModal] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();

  // Tamanho padrão do cartão de crédito (85.6mm x 53.98mm) para calibração
  const cardWidthMM = 85.6;
  const cardHeightMM = 53.98;

  // Capturar foto
  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setShowCamera(false);
      // Estimativa inicial da régua baseada na altura da imagem
      const estimatedEyePosition = 60; // Aproximação inicial para o olho (60% da altura)
      setRulerPosition(estimatedEyePosition);
      calibrateMeasurements(estimatedEyePosition);
    }
  };

  // Calibrar medições com base na posição da régua
  const calibrateMeasurements = (initialPosition: number) => {
    const imageHeight = webcamRef.current?.video?.videoHeight || 480;
    const rulerPx = (imageHeight * initialPosition) / 100; // Posição da régua em pixels
    const cardPx = imageHeight / 2; // Supondo que o cartão ocupe metade da altura como referência
    const scale = cardHeightMM / cardPx; // Fator de escala (mm por pixel)

    // Estimativas baseadas na proporção da régua e caixa do rosto
    const dp = Math.round((faceBox.width * scale) / 3); // Aproximação da DP como 1/3 da largura
    const faceWidth = Math.round(faceBox.width * scale);
    const lensHeight = Math.round((faceBox.height * scale) / 10); // Aproximação da altura da lente
    const templeWidth = Math.round((faceBox.width * 0.9) * scale); // 90% da largura do rosto

    setMeasurements({ dp, faceWidth, lensHeight, templeWidth });
    setAdjustedMeasurements({ dp, faceWidth, lensHeight, templeWidth });
  };

  // Ajustar a caixa do rosto manualmente
  const adjustFaceBox = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const value = Number(e.target.value);
    setFaceBox((prev) => {
      const newBox = { ...prev };
      if (key === 'width') newBox.width = value;
      if (key === 'height') newBox.height = value;
      if (key === 'x') newBox.x = value;
      if (key === 'y') newBox.y = value;
      return newBox;
    });
    calibrateMeasurements(rulerPosition); // Recalcular ao ajustar
  };

  const handleRulerAdjust = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = Number(e.target.value);
    setRulerPosition(newPosition);
    calibrateMeasurements(newPosition);
  };

  const handleSave = () => {
    setSavedMeasurements(adjustedMeasurements);
    setCapturedImage(null); // Volta para a câmera após salvar
    setShowCamera(true);
  };

  const handleRedo = () => {
    setCapturedImage(null);
    setShowCamera(true);
    setMeasurements({
      dp: 62,
      faceWidth: 140,
      lensHeight: 35,
      templeWidth: 130,
    });
    setAdjustedMeasurements({
      dp: 62,
      faceWidth: 140,
      lensHeight: 35,
      templeWidth: 130,
    });
  };

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="relative w-full h-[70vh]">
        {showCamera ? (
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover rounded-2xl"
            videoConstraints={{ facingMode: 'user' }}
          />
        ) : capturedImage ? (
          <img src={capturedImage} alt="Capturada" className="w-full h-full object-cover rounded-2xl" />
        ) : null}
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <div
            className="absolute border-2 border-dashed border-secondary "
            style={{
              width: `${faceBox.width}px`,
              height: `${faceBox.height}px`,
              left: `${faceBox.x}%`,
              top: `${faceBox.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
          {capturedImage && (
            <div
              className="absolute w-full border-t-2 border-primary"
              style={{ top: `${rulerPosition}%` }}
            >
              <span className="absolute left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                {rulerPosition}%
              </span>
            </div>
          )}
        </div>
        {showCamera && (
          <button
            onClick={capture}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-full text-base hover:bg-opacity-80 transition"
          >
            Tirar Foto
          </button>
        )}
      </div>
      {capturedImage && (
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Ajuste a Régua</h2>
          <input
            type="range"
            min="0"
            max="100"
            value={rulerPosition}
            onChange={handleRulerAdjust}
            className="w-full mt-2"
          />
          <div className="mt-4">
            <label className="text-sm text-gray-600">Largura do rosto (px)</label>
            <input
              type="range"
              min="100"
              max="300"
              value={faceBox.width}
              onChange={(e) => adjustFaceBox(e, 'width')}
              className="w-full mt-1"
            />
            <label className="text-sm text-gray-600">Altura do rosto (px)</label>
            <input
              type="range"
              min="200"
              max="400"
              value={faceBox.height}
              onChange={(e) => adjustFaceBox(e, 'height')}
              className="w-full mt-1"
            />
            <label className="text-sm text-gray-600">Posição X (%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={faceBox.x}
              onChange={(e) => adjustFaceBox(e, 'x')}
              className="w-full mt-1"
            />
            <label className="text-sm text-gray-600">Posição Y (%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={faceBox.y}
              onChange={(e) => adjustFaceBox(e, 'y')}
              className="w-full mt-1"
            />
          </div>
          <div className="mb-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Medições</h2>
            <div className="bg-white p-4 rounded-2xl shadow-md">
              <p className="text-sm text-gray-600">
                Distância Pupilar (DP): {adjustedMeasurements.dp} mm
              </p>
              <p className="text-sm text-gray-600">
                Largura do rosto: {adjustedMeasurements.faceWidth} mm
              </p>
              <p className="text-sm text-gray-600">
                Altura da lente: {adjustedMeasurements.lensHeight} mm
              </p>
              <p className="text-sm text-gray-600">
                Largura entre as têmporas: {adjustedMeasurements.templeWidth} mm
              </p>
            </div>
          </div>
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
        </div>
      )}
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
      <BottomNavBar />
    </div>
  );
}