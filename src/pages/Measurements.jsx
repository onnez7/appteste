import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { InformationCircleIcon, ArrowPathIcon, CameraIcon } from '@heroicons/react/24/outline';
import BottomNavBar from '../components/BottomNavBar';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';

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
  const [adjustedDp, setAdjustedDp] = useState(62);
  const [useBlazeFace, setUseBlazeFace] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const blazeFaceModelRef = useRef(null);

  // Inicializar MediaPipe Face Mesh e BlazeFace
  useEffect(() => {
    const loadModels = async () => {
      // Tentar carregar MediaPipe Face Mesh
      try {
        console.log('Carregando MediaPipe Face Mesh...');
        if (!FaceMesh) {
          throw new Error('FaceMesh não está disponível. Verifique @mediapipe/face_mesh.');
        }

        faceMeshRef.current = new FaceMesh({
          locateFile: (file) => `/mediapipe/${file}`,
        });

        console.log('Configurando opções do FaceMesh...');
        faceMeshRef.current.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        console.log('Inicializando FaceMesh...');
        await faceMeshRef.current.initialize();
        console.log('MediaPipe Face Mesh inicializado com sucesso.');
        setIsModelLoaded(true);
        setModelError(null);
        return;
      } catch (error) {
        console.error('Erro ao inicializar MediaPipe Face Mesh:', error);
        setModelError(`Falha ao carregar MediaPipe: ${error.message}. Tentando TensorFlow.js...`);
        setIsModelLoaded(false);
        setUseBlazeFace(true);
      }

      // Fallback para BlazeFace
      if (useBlazeFace) {
        try {
          console.log('Verificando disponibilidade do TensorFlow.js...');
          if (!tf || !blazeface) {
            throw new Error('TensorFlow.js ou BlazeFace não estão disponíveis. Verifique as dependências.');
          }
          console.log('Carregando BlazeFace (TensorFlow.js)...');
          blazeFaceModelRef.current = await blazeface.load();
          console.log('BlazeFace inicializado com sucesso.');
          setIsModelLoaded(true);
          setModelError(null);
        } catch (error) {
          console.error('Erro ao inicializar BlazeFace:', error);
          setModelError(`Falha ao carregar BlazeFace: ${error.message}. Use o modo manual.`);
          setIsModelLoaded(false);
        }
      }
    };
    loadModels();

    return () => {
      if (faceMeshRef.current) {
        console.log('Fechando FaceMesh...');
        faceMeshRef.current.close();
      }
    };
  }, [useBlazeFace]);

  // Função para capturar e processar a imagem
  const captureImage = async () => {
    if (!isModelLoaded && !adjustedDp) {
      alert(modelError || 'O modelo de IA ainda está carregando. Tente novamente ou use o modo manual.');
      return;
    }

    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);

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
            if (!useBlazeFace) {
              console.log('Processando imagem com MediaPipe Face Mesh...');
              await faceMeshRef.current.onResults((results) => {
                if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                  const landmarks = results.multiFaceLandmarks[0];

                  const leftIrisLeft = landmarks[468];
                  const leftIrisRight = landmarks[470];
                  const rightIrisLeft = landmarks[474];
                  const rightIrisRight = landmarks[476];

                  const leftIrisWidth = Math.abs(leftIrisRight.x - leftIrisLeft.x) * img.width;
                  const rightIrisWidth = Math.abs(rightIrisRight.x - rightIrisLeft.x) * img.width;
                  const avgIrisWidth = (leftIrisWidth + rightIrisWidth) / 2;

                  const averageIrisMm = 12;
                  scale = averageIrisMm / avgIrisWidth;
                  setPixelScale(scale);

                  const leftPupil = landmarks[468];
                  const rightPupil = landmarks[474];
                  dpPixels = Math.abs(rightPupil.x - leftPupil.x) * img.width;

                  const leftEyeOuter = landmarks[130];
                  const rightEyeOuter = landmarks[359];
                  faceWidthPixels = Math.abs(rightEyeOuter.x - leftEyeOuter.x) * img.width;

                  const eyeCenterY = (leftPupil.y + rightPupil.y) / 2 * img.height;
                  const mouth = landmarks[13];
                  lensHeightPixels = Math.abs(eyeCenterY - mouth.y * img.height);

                  const leftTemple = landmarks[234];
                  const rightTemple = landmarks[454];
                  templeWidthPixels = Math.abs(rightTemple.x - leftTemple.x) * img.width;

                  ctx.beginPath();
                  ctx.arc(leftPupil.x * img.width, leftPupil.y * img.height, 5, 0, 2 * Math.PI);
                  ctx.arc(rightPupil.x * img.width, rightPupil.y * img.height, 5, 0, 2 * Math.PI);
                  ctx.fillStyle = 'red';
                  ctx.fill();
                  ctx.strokeStyle = 'blue';
                  ctx.moveTo(leftPupil.x * img.width, leftPupil.y * img.height);
                  ctx.lineTo(rightPupil.x * img.width, rightPupil.y * img.height);
                  ctx.stroke();

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
                }
              });

              await faceMeshRef.current.send({ image: img });
            } else {
              console.log('Processando imagem com BlazeFace...');
              const predictions = await blazeFaceModelRef.current.estimateFaces(img);
              if (predictions.length > 0) {
                const face = predictions[0];
                const leftEye = face.landmarks[0];
                const rightEye = face.landmarks[1];

                const eyeDistance = Math.abs(rightEye[0] - leftEye[0]);
                const avgIrisWidth = eyeDistance / 3;

                const averageIrisMm = 12;
                scale = averageIrisMm / avgIrisWidth;
                setPixelScale(scale);

                dpPixels = eyeDistance;
                faceWidthPixels = face.bottomRight[0] - face.topLeft[0];
                const mouth = face.landmarks[3];
                const eyeCenterY = (leftEye[1] + rightEye[1]) / 2;
                lensHeightPixels = Math.abs(eyeCenterY - mouth[1]);
                templeWidthPixels = faceWidthPixels * 1.2;

                ctx.beginPath();
                ctx.arc(leftEye[0], leftEye[1], 5, 0, 2 * Math.PI);
                ctx.arc(rightEye[0], rightEye[1], 5, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
                ctx.strokeStyle = 'blue';
                ctx.moveTo(leftEye[0], leftEye[1]);
                ctx.lineTo(rightEye[0], rightEye[1]);
                ctx.stroke();

                const calculatedDp = Math.round(dpPixels * scale);
                setAdjustedDp(calculatedDp);
                setMeasurements({
                  dp: calculatedDp,
                  faceWidth: Math.round(faceWidthPixels * scale),
                  lensHeight: Math.round(lensHeightPixels * scale),
                  templeWidth: Math.round(templeWidthPixels * scale),
                });

                console.log('Medições calculadas com BlazeFace:', measurements);
              } else {
                console.warn('Nenhum rosto detectado na imagem.');
                alert('Nenhum rosto detectado. Certifique-se de que seu rosto está visível.');
              }
            }
          } catch (error) {
            console.error('Erro ao processar imagem:', error);
            alert('Erro ao processar a imagem. Use o modo manual.');
            return;
          }
        }

        if (!isModelLoaded) {
          scale = adjustedDp / 100;
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

  const handleSave = () => {
    if (capturedImage && measurements.dp > 0) {
      setSavedMeasurements(measurements);
      localStorage.setItem('userAdjustedDp', adjustedDp);
      setShowCamera(false);
      setCapturedImage(null);
    } else {
      alert('Por favor, capture uma imagem válida antes de salvar.');
    }
  };

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
          <div className="mb-4">
            <p className="text-sm text-red-600 mb-2">
              {modelError || 'Carregando modelo de IA, aguarde...'}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Modo manual: Insira sua distância pupilar (DP) em mm:
            </p>
            <input
              type="number"
              value={adjustedDp}
              onChange={(e) => {
                const newDp = Number(e.target.value);
                setAdjustedDp(newDp);
                const scale = newDp / 100;
                setPixelScale(scale);
                setMeasurements({
                  dp: newDp,
                  faceWidth: Math.round(200 * scale),
                  lensHeight: Math.round(50 * scale),
                  templeWidth: Math.round(250 * scale),
                });
              }}
              className="w-full p-2 border rounded"
              placeholder="Ex.: 62"
            />
          </div>
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
              <strong>Instruções para Precisão:</strong> Certifique-se de que seu rosto está bem iluminado e visível na câmera. Ajuste a DP com o slider ou insira manualmente, se necessário.
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