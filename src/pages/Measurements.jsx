import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { InformationCircleIcon, ArrowPathIcon, CameraIcon } from '@heroicons/react/24/outline';
import BottomNavBar from '../components/BottomNavBar';
import * as faceapi from 'face-api.js';

export default function Measurements() {
  const [showCamera, setShowCamera] = useState(false);
  const [measurements, setMeasurements] = useState({
    dp: 0,
    faceWidth: 0,
    lensHeight: 0,
    templeWidth: 0,
  });
  const [capturedImage, setCapturedImage] = useState(null);
  const [savedMeasurements, setSavedMeasurements] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pixelScale, setPixelScale] = useState(1); // Escala de pixels por mm
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Carregar modelos do face-api.js
  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      setIsModelLoaded(true);
    };
    loadModels();
  }, []);

  // Função para capturar e processar a imagem
  const captureImage = async () => {
    if (!isModelLoaded) {
      alert('Os modelos de IA ainda estão carregando. Tente novamente em alguns segundos.');
      return;
    }

    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);

      // Criar uma imagem para processamento
      const img = new Image();
      img.src = imageSrc;
      img.onload = async () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Detectar rosto e landmarks
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections) {
          const landmarks = detections.landmarks;

          // Calcular a distância pupilar (DP)
          const leftPupil = landmarks.getLeftEye()[3]; // Ponto central do olho esquerdo
          const rightPupil = landmarks.getRightEye()[0]; // Ponto central do olho direito
          const dpPixels = Math.abs(rightPupil.x - leftPupil.x);

          // Calcular largura do rosto (baseado nas bordas externas dos olhos)
          const faceWidthPixels = Math.abs(
            landmarks.getLeftEye()[0].x - landmarks.getRightEye()[3].x
          );

          // Calcular altura da lente (baseado na distância entre olhos e sobrancelhas)
          const eyeCenterY = (leftPupil.y + rightPupil.y) / 2;
          const forehead = landmarks.getMouth()[0]; // Aproximação da testa
          const lensHeightPixels = Math.abs(eyeCenterY - forehead.y);

          // Calcular largura entre as têmporas (baseado nas bordas da mandíbula)
          const templeWidthPixels = Math.abs(
            landmarks.getJawOutline()[0].x - landmarks.getJawOutline()[16].x
          );

          // Calcular a escala usando um cartão de crédito
          const referenceWidthMm = 85.6; // Largura do cartão de crédito
          const referencePixelWidth = prompt(
            'Meça a largura do cartão de crédito na imagem (em pixels) e insira o valor:',
            '100'
          );
          let scale = pixelScale;
          if (referencePixelWidth && !isNaN(referencePixelWidth)) {
            scale = referenceWidthMm / parseFloat(referencePixelWidth);
            setPixelScale(scale);
          }

          // Converter pixels para mm
          setMeasurements({
            dp: Math.round(dpPixels * scale),
            faceWidth: Math.round(faceWidthPixels * scale),
            lensHeight: Math.round(lensHeightPixels * scale),
            templeWidth: Math.round(templeWidthPixels * scale),
          });

          // Desenhar marcações no canvas
          ctx.beginPath();
          ctx.arc(leftPupil.x, leftPupil.y, 5, 0, 2 * Math.PI);
          ctx.arc(rightPupil.x, rightPupil.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
          ctx.strokeStyle = 'blue';
          ctx.moveTo(leftPupil.x, leftPupil.y);
          ctx.lineTo(rightPupil.x, rightPupil.y);
          ctx.stroke();
        } else {
          alert('Nenhum rosto detectado. Certifique-se de que seu rosto está visível na imagem.');
        }
      };
    }
  };

  // Salvar medições
  const handleSave = () => {
    if (capturedImage && measurements.dp > 0) {
      setSavedMeasurements(measurements);
      setShowCamera(false);
      setCapturedImage(null);
    } else {
      alert('Por favor, capture uma imagem válida com um rosto detectado antes de salvar.');
    }
  };

  // Refazer medições
  const handleRedo = () => {
    setShowCamera(false);
    setCapturedImage(null);
    setPixelScale(1);
    setMeasurements({
      dp: 0,
      faceWidth: 0,
      lensHeight: 0,
      templeWidth: 0,
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Realizar Medições com IA</h2>
        {!isModelLoaded && (
          <p className="text-sm text-gray-600 mb-2">Carregando modelos de IA, aguarde...</p>
        )}
        {showCamera && (
          <div className="relative">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full rounded-2xl"
              videoConstraints={{ facingMode: { exact: 'user' } }}
            />
          </div>
        )}
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
              disabled={!isModelLoaded}
            >
              <CameraIcon className="w-5 h-5 inline mr-2" /> Tirar Foto
            </button>
          )}
        </div>
      </div>

      {capturedImage && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Imagem Capturada</h2>
          <canvas ref={canvasRef} className="w-full rounded-2xl mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Medições Calculadas (Escala: {pixelScale.toFixed(2)} mm/pixel):
          </p>
          <div className="bg-white p-4 rounded-2xl shadow-md mb-4">
            <p className="text-sm text-gray-600">DP: {measurements.dp} mm</p>
            <p className="text-sm text-gray-600">Largura do rosto: {measurements.faceWidth} mm</p>
            <p className="text-sm text-gray-600">Altura da lente: {measurements.lensHeight} mm</p>
            <p className="text-sm text-gray-600">Largura entre as têmporas: {measurements.templeWidth} mm</p>
          </div>
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
              <strong>Instruções para Precisão:</strong> Posicione um cartão de crédito na testa para calibrar as medições. Após capturar a imagem, insira a largura do cartão em pixels para calcular a escala. A IA detectará automaticamente seu rosto e calculará as medições.
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