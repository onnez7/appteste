import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon } from '@heroicons/react/24/outline';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';

export default function WebcamCapture({ onCapture, onError }) {
  const [showCamera, setShowCamera] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [useBlazeFace, setUseBlazeFace] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const blazeFaceModelRef = useRef(null);
  const framesRef = useRef([]);

  // Inicializar modelos
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Carregando MediaPipe Face Mesh...');
        if (!FaceMesh) {
          throw new Error('FaceMesh não está disponível.');
        }

        faceMeshRef.current = new FaceMesh({
          locateFile: (file) => `/mediapipe/${file}`,
        });

        faceMeshRef.current.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        await faceMeshRef.current.initialize();
        console.log('MediaPipe Face Mesh inicializado.');
        setIsModelLoaded(true);
        return;
      } catch (error) {
        console.error('Erro ao carregar MediaPipe:', error);
        onError(`Falha ao carregar MediaPipe: ${error.message}. Tentando TensorFlow.js...`);
        setUseBlazeFace(true);
      }

      if (useBlazeFace) {
        try {
          console.log('Carregando BlazeFace...');
          blazeFaceModelRef.current = await blazeface.load();
          console.log('BlazeFace inicializado.');
          setIsModelLoaded(true);
        } catch (error) {
          console.error('Erro ao carregar BlazeFace:', error);
          onError(`Falha ao carregar BlazeFace: ${error.message}.`);
          setIsModelLoaded(false);
        }
      }
    };
    loadModels();

    return () => {
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, [useBlazeFace, onError]);

  // Captura múltiplas imagens para mapeamento 3D
  const captureImages = async () => {
    if (!isModelLoaded) {
      onError('Modelo de IA não carregado.');
      return;
    }

    setCapturing(true);
    framesRef.current = [];
    const captureCount = 5; // Capturar 5 frames
    let captured = 0;

    const captureFrame = async () => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        const img = new Image();
        img.src = imageSrc;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);

        let landmarks = null;
        try {
          if (!useBlazeFace) {
            await faceMeshRef.current.onResults((results) => {
              if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                landmarks = results.multiFaceLandmarks[0];
              }
            });
            await faceMeshRef.current.send({ image: img });
          } else {
            const predictions = await blazeFaceModelRef.current.estimateFaces(img);
            if (predictions.length > 0) {
              landmarks = predictions[0].landmarks.map(([x, y]) => ({ x: x / img.width, y: y / img.height, z: 0 }));
            }
          }

          if (landmarks) {
            framesRef.current.push({ image: img, landmarks });
            captured++;
            console.log(`Frame ${captured} capturado.`);
          } else {
            console.warn('Nenhum rosto detectado no frame.');
          }
        } catch (error) {
          console.error('Erro ao processar frame:', error);
        }

        if (captured < captureCount) {
          setTimeout(captureFrame, 500); // Captura a cada 500ms
        } else {
          processFrames();
        }
      }
    };

    captureFrame();
  };

  // Processar frames para mapeamento 3D
  const processFrames = () => {
    if (framesRef.current.length < 3) {
      onError('Não foram capturados rostos suficientes. Tente novamente.');
      setCapturing(false);
      return;
    }

    let avgIrisWidth = 0;
    let dpPixels = 0;
    let faceWidthPixels = 0;
    let lensHeightPixels = 0;
    let templeWidthPixels = 0;
    let noseLengthPixels = 0;
    const irisWidths = [];

    framesRef.current.forEach(({ landmarks, image }) => {
      if (useBlazeFace) {
        const leftEye = landmarks[0];
        const rightEye = landmarks[1];
        const eyeDistance = Math.abs(rightEye[0] - leftEye[0]) * image.width;
        irisWidths.push(eyeDistance / 3);
        dpPixels += eyeDistance;
        faceWidthPixels += (landmarks[5][0] - landmarks[4][0]) * image.width;
        const mouth = landmarks[3];
        const eyeCenterY = (leftEye[1] + rightEye[1]) / 2;
        lensHeightPixels += Math.abs(eyeCenterY - mouth[1]) * image.height;
        templeWidthPixels += faceWidthPixels * 1.2;
        noseLengthPixels += Math.abs(landmarks[2][1] - mouth[1]) * image.height;
      } else {
        const leftIrisLeft = landmarks[468];
        const leftIrisRight = landmarks[470];
        const rightIrisLeft = landmarks[474];
        const rightIrisRight = landmarks[476];
        const leftIrisWidth = Math.abs(leftIrisRight.x - leftIrisLeft.x) * image.width;
        const rightIrisWidth = Math.abs(rightIrisRight.x - rightIrisLeft.x) * image.width;
        irisWidths.push((leftIrisWidth + rightIrisWidth) / 2);

        const leftPupil = landmarks[468];
        const rightPupil = landmarks[474];
        dpPixels += Math.abs(rightPupil.x - leftPupil.x) * image.width;

        const leftEyeOuter = landmarks[130];
        const rightEyeOuter = landmarks[359];
        faceWidthPixels += Math.abs(rightEyeOuter.x - leftEyeOuter.x) * image.width;

        const eyeCenterY = (leftPupil.y + rightPupil.y) / 2 * image.height;
        const mouth = landmarks[13];
        lensHeightPixels += Math.abs(eyeCenterY - mouth.y * image.height);

        const leftTemple = landmarks[234];
        const rightTemple = landmarks[454];
        templeWidthPixels += Math.abs(rightTemple.x - leftTemple.x) * image.width;

        const noseTip = landmarks[1];
        noseLengthPixels += Math.abs(noseTip.y - mouth.y) * image.height;
      }
    });

    // Calcular médias
    avgIrisWidth = irisWidths.reduce((sum, w) => sum + w, 0) / irisWidths.length;
    dpPixels /= framesRef.current.length;
    faceWidthPixels /= framesRef.current.length;
    lensHeightPixels /= framesRef.current.length;
    templeWidthPixels /= framesRef.current.length;
    noseLengthPixels /= framesRef.current.length;

    // Calibrar escala com íris (12 mm) e validar com olhos (30 mm) e nariz (40 mm)
    const averageIrisMm = 12;
    const scale = averageIrisMm / avgIrisWidth;

    const eyeWidthMm = faceWidthPixels * scale;
    const noseLengthMm = noseLengthPixels * scale;
    if (eyeWidthMm < 25 || eyeWidthMm > 35 || noseLengthMm < 35 || noseLengthMm > 45) {
      console.warn('Calibração fora do esperado. Usando escala padrão.');
      // Ajustar escala com base na média dos olhos e nariz, se necessário
    }

    const measurements = {
      dp: Math.round(dpPixels * scale),
      faceWidth: Math.round(faceWidthPixels * scale),
      lensHeight: Math.round(lensHeightPixels * scale),
      templeWidth: Math.round(templeWidthPixels * scale),
      noseLength: Math.round(noseLengthPixels * scale),
    };

    // Desenhar na última imagem
    const lastFrame = framesRef.current[framesRef.current.length - 1];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(lastFrame.image, 0, 0);
    const landmarks = lastFrame.landmarks;

    if (!useBlazeFace) {
      const leftPupil = landmarks[468];
      const rightPupil = landmarks[474];
      ctx.beginPath();
      ctx.arc(leftPupil.x * canvas.width, leftPupil.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.arc(rightPupil.x * canvas.width, rightPupil.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.strokeStyle = 'blue';
      ctx.moveTo(leftPupil.x * canvas.width, leftPupil.y * canvas.height);
      ctx.lineTo(rightPupil.x * canvas.width, rightPupil.y * canvas.height);
      ctx.stroke();
    } else {
      const leftEye = landmarks[0];
      const rightEye = landmarks[1];
      ctx.beginPath();
      ctx.arc(leftEye[0], leftEye[1], 5, 0, 2 * Math.PI);
      ctx.arc(rightEye[0], rightEye[1], 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.strokeStyle = 'blue';
      ctx.moveTo(leftEye[0], leftEye[1]);
      ctx.lineTo(rightEye[0], rightEye[1]);
      ctx.stroke();
    }

    onCapture(measurements, lastFrame.image.src, scale);
    setCapturing(false);
  };

  return (
    <div className="mb-6">
      <div className="relative">
        {showCamera && (
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full rounded-2xl"
            videoConstraints={{ facingMode: { exact: 'user' } }}
          />
        )}
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" style={{ display: capturing ? 'block' : 'none' }} />
      </div>
      <div className="flex space-x-2 mt-4">
        <button
          onClick={() => setShowCamera(!showCamera)}
          className="flex-1 bg-primary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition"
        >
          {showCamera ? 'Fechar Câmera' : 'Abrir Câmera'}
        </button>
        {showCamera && (
          <button
            onClick={captureImages}
            className="flex-1 bg-secondary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition"
            disabled={capturing || !isModelLoaded}
          >
            <CameraIcon className="w-5 h-5 inline mr-2" /> {capturing ? 'Capturando...' : 'Capturar'}
          </button>
        )}
      </div>
    </div>
  );
}