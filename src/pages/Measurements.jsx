import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { InformationCircleIcon, ArrowPathIcon, CameraIcon } from '@heroicons/react/24/outline';
import BottomNavBar from '../components/BottomNavBar';
import { FaceMesh } from '@mediapipe/face_mesh';

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
  const [pixelScale, setPixelScale] = useState(1);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [adjustedDp, setAdjustedDp] = useState(62); // DP ajustada pelo usuário
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);

  // Inicializar MediaPipe Face Mesh
  useEffect(() => {
    const loadFaceMesh = async () => {
      try {
        console.log('Inicializando MediaPipe Face Mesh...');
        faceMeshRef.current = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMeshRef.current.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true, // Melhorar precisão para íris
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        await faceMeshRef.current.initialize();
        console.log('MediaPipe Face Mesh inicializado com sucesso.');
        setIsModelLoaded(true);
        setModelError(null);
      } catch (error) {
        console.error('Erro ao inicializar MediaPipe Face Mesh:', error);
        setModelError('Falha ao carregar o modelo de IA. Use o modo manual.');
        setIsModelLoaded(false);
      }
    };
    loadFaceMesh();

    return () => {
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, []);

  // Função para capturar e processar a imagem
  const captureImage = async () => {
    if (!isModelLoaded && !adjustedDp) {
      alert(modelError || 'O modelo de IA ainda está carregando. Tente novamente.');
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

        let scale = pixelScale;
        let dpPixels = 0;
        let faceWidthPixels = 0;
        let lensHeightPixels = 0;
        let templeWidthPixels = 0;

        if (isModelLoaded) {
          try {
            // Criar um elemento de vídeo temporário para processamento
            const video = document.createElement('video');
            video.width = img.width;
            video.height = img.height;
            const stream = canvas.captureStream();
            video.srcObject = stream;
            await video.play();

            // Processar imagem com MediaPipe
            const results = await faceMeshRef.current.send({ image: img });
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              const landmarks = results.multiFaceLandmarks[0];

              // Pontos da íris esquerda (MediaPipe: 468-473) e direita (474-479)
              const leftIrisLeft = landmarks[468]; // Borda esquerda da íris esquerda
              const leftIrisRight = landmarks[470]; // Borda direita da íris esquerda
              const rightIrisLeft = landmarks[474]; // Borda esquerda da íris direita
              const rightIrisRight = landmarks[476]; // Borda direita da íris direita

              // Calcular largura média da íris em pixels
              const leftIrisWidth = Math.abs(leftIrisRight.x - leftIrisLeft.x) * img.width;
              const rightIrisWidth = Math.abs(rightIrisRight.x - rightIrisLeft.x) * img.width;
              const avgIrisWidth = (leftIrisWidth + rightIrisWidth) / 2;

              // Calcular escala usando largura média da íris (12 mm)
              const averageIrisMm = 12;
              scale = averageIrisMm / avgIrisWidth;
              setPixelScale(scale);

              // Calcular DP (distância entre centros das pupilas)
              const leftPupil = landmarks[468]; // Aproximação do centro da pupila esquerda
              const rightPupil = landmarks[474]; // Aproximação do centro da pupila direita
              dpPixels = Math.abs(rightPupil.x - leftPupil.x) * img.width;

              // Calcular largura do rosto (baseado nas bordas externas dos olhos)
              const leftEyeOuter = landmarks[130]; // Canto externo do olho esquerdo
              const rightEyeOuter = landmarks[359]; // Canto externo do olho direito
              faceWidthPixels = Math.abs(rightEyeOuter.x - leftEyeOuter.x) * img.width;

              // Calcular altura da lente (distância entre olhos e boca)
              const eyeCenterY = (leftPupil.y + rightPupil.y) / 2 * img.height;
              const mouth = landmarks[13]; // Centro da boca
              lensHeightPixels = Math.abs(eyeCenterY - mouth.y * img.height);

              // Calcular largura entre as têmporas (baseado nas bordas da face)
              const leftTemple = landmarks[234]; // Têmpora esquerda
              const rightTemple = landmarks[454]; // Têmpora direita
              templeWidthPixels = Math.abs(rightTemple.x - leftTemple.x) * img.width;

              // Desenhar marcações no canvas
              ctx.beginPath();
              ctx.arc(leftPupil.x * img.width, leftPupil.y * img.height, 5, 0, 2 * Math.PI);
              ctx.arc(rightPupil.x * img.width, rightPupil.y * img.height, 5, 0, 2 * Math.PI);
              ctx.fillStyle = 'red';
              ctx.fill();
              ctx.strokeStyle = 'blue';
              ctx.moveTo(leftPupil.x * img.width, leftPupil.y * img.height);
              ctx.lineTo(rightPupil.x * img.width, rightPupil.y * img.height);
              ctx.stroke();

              // Converter pixels para mm
              const calculatedDp = Math.round(dpPixels * scale);
              setAdjustedDp(calculatedDp);
              setMeasurements({
                dp: calculatedDp,
                faceWidth: Math.round(faceWidthPixels * scale),
                lensHeight: Math.round(lensHeightPixels * scale),
                templeWidth: Math.round(templeWidthPixels * scale),
              });

              console.log('Medições calculadas com MediaPipe:', measurements);
            } else {
              console.warn('Nenhum rosto detectado na imagem.');
              alert('Nenhum rosto detectado. Certifique-se de que seu rosto está visível.');
              return;
            }
          } catch (error) {
            console.error('Erro ao processar imagem:', error);
            alert('Erro ao processar a imagem. Use o modo manual.');
            return;
          }
        }

        if (!isModelLoaded) {
          // Modo manual: usar DP ajustada pelo usuário
          scale = adjustedDp / 100; // Aproximação (100 pixels como base)
          setPixelScale(scale);
          dpPixels = 100;
          faceWidthPixels = 200;
          lensHeightPixels = 50;
          templeWidthPixels = 250;

          setMeasurements({
            dp: Math.round(dpPixels * scale),
            faceWidth: Math.round(faceWidthPixels * scale),
            lensHeight: Math.round(lensHeightPixels * scale),
            templeWidth: Math.round(templeWidthPixels * scale),
          });
          console.log('Usando modo manual com DP:', adjustedDp);
        }
      };
    }
  };

  // Salvar medições e armazenar ajuste do usuário
  const handleSave = () => {
    if (capturedImage && measurements.dp > 0) {
      setSavedMeasurements(measurements);
      // Armazenar ajuste do usuário no localStorage para aprendizado futuro
      localStorage.setItem('userAdjustedDp', adjustedDp);
      setShowCamera(false);
      setCapturedImage(null);
    } else {
      alert('Por favor, capture uma imagem válida antes de salvar.');
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

  // Carregar DP ajustada anteriormente (se disponível)
  useEffect(() => {
    const storedDp = localStorage.getItem('userAdjustedDp');
    if (storedDp) {
      setAdjustedDp(Number(storedDp));
    }
  }, []);

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Realizar Medições com IA</h2>
        {!isModelLoaded && (
          <p className="text-sm text-red-600 mb-2">
            {modelError || 'Carregando modelo de IA, aguarde...'}
          </p>
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
            Ajuste a Distância Pupilar (DP) se necessário:
          </p>
          <input
            type="range"
            min="50"
            max="80"
            value={adjustedDp}
            onChange={(e) => {
              const newDp = Number(e.target.value);
              setAdjustedDp(newDp);
              setMeasurements({
                ...measurements,
                dp: newDp,
                faceWidth: Math.round((measurements.faceWidth / measurements.dp) * newDp),
                lensHeight: Math.round((measurements.lensHeight / measurements.dp) * newDp),
                templeWidth: Math.round((measurements.templeWidth / measurements.dp) * newDp),
              });
            }}
            className="w-full mb-4"
          />
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
              <strong>Instruções para Precisão:</strong> Certifique-se de que seu rosto está bem iluminado e visível na câmera. Ajuste a DP com o slider, se necessário.
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