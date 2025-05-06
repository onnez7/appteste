import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon } from '@heroicons/react/24/outline';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';

export default function WebcamCapture({ onCapture, onError, showCamera, onShowCamera }) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelType, setModelType] = useState(null); // 'faceMesh', 'blazeFace', or 'faceApi'
  const [capturing, setCapturing] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const blazeFaceModelRef = useRef(null);
  const framesRef = useRef([]);

  // Inicializar modelos
  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      // 1. Tentar MediaPipe FaceMesh
      try {
        console.log('Carregando MediaPipe Face Mesh...');
        await import('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js');
        const FaceMesh = window.FaceMesh;

        if (!FaceMesh) {
          throw new Error('FaceMesh não está disponível.');
        }

        if (!isMounted) return;

        faceMeshRef.current = new FaceMesh({
          locateFile: (file) => {
            if (file === 'face_mesh.tflite') {
              return '/mediapipe/face_mesh.tflite';
            }
            if (file === 'face_mesh_solution_wasm_bin.wasm') {
              return '/mediapipe/face_mesh.wasm';
            }
            return `/mediapipe/${file}`;
          },
        });

        faceMeshRef.current.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        await faceMeshRef.current.initialize();
        console.log('MediaPipe Face Mesh inicializado.');
        if (isMounted) {
          setIsModelLoaded(true);
          setModelType('faceMesh');
        }
        return;
      } catch (error) {
        console.error('Erro ao carregar MediaPipe:', error);
        if (isMounted) {
          onError(`Falha ao carregar MediaPipe: ${error.message}. Tentando BlazeFace...`);
        }
      }

      // 2. Tentar BlazeFace
      try {
        console.log('Configurando backend CPU para TensorFlow.js...');
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('Backend CPU configurado. Carregando BlazeFace...');
        blazeFaceModelRef.current = await blazeface.load();
        console.log('BlazeFace inicializado.');
        if (isMounted) {
          setIsModelLoaded(true);
          setModelType('blazeFace');
        }
        return;
      } catch (error) {
        console.error('Erro ao carregar BlazeFace:', error);
        if (isMounted) {
          onError(`Falha ao carregar BlazeFace: ${error.message}. Tentando face-api.js...`);
        }
      }

      // 3. Tentar face-api.js
      try {
        console.log('Carregando face-api.js...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        console.log('face-api.js inicializado.');
        if (isMounted) {
          setIsModelLoaded(true);
          setModelType('faceApi');
        }
      } catch (error) {
        console.error('Erro ao carregar face-api.js:', error);
        if (isMounted) {
          onError(`Falha ao carregar face-api.js: ${error.message}. Tente novamente.`);
          setIsModelLoaded(false);
        }
      }
    };

    if (showCamera) {
      loadModels();
    }

    return () => {
      isMounted = false;
      if (faceMeshRef.current) {
        console.log('Fechando FaceMesh...');
        faceMeshRef.current.close();
      }
    };
  }, [showCamera]);

  // Captura múltiplas imagens para mapeamento 3D
  const captureImages = async () => {
    if (!isModelLoaded) {
      onError('Modelo de IA não carregado. Aguarde ou tente novamente.');
      return;
    }

    setCapturing(true);
    framesRef.current = [];
    const captureCount = 5;
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
          if (modelType === 'faceMesh') {
            await faceMeshRef.current.onResults((results) => {
              if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                landmarks = results.multiFaceLandmarks[0];
              }
            });
            await faceMeshRef.current.send({ image: img });
          } else if (modelType === 'blazeFace') {
            const predictions = await blazeFaceModelRef.current.estimateFaces(img);
            if (predictions.length > 0) {
              landmarks = predictions[0].landmarks.map(([x, y]) => ({ x: x / img.width, y: y / img.height, z: 0 }));
            }
          } else if (modelType === 'faceApi') {
            const detections = await faceapi
              .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks();
            if (detections) {
              landmarks = detections.landmarks.positions.map((p) => ({
                x: p.x / img.width,
                y: p.y / img.height,
                z: 0,
              }));
            }
          }

          if (landmarks) {
            framesRef.current.push({ image: img, landmarks });
            captured++;
            console.log(`Frame ${captured} capturado.`);
          } else {
            console.warn('Nenhum rosto detectado no frame.');
            onError('Nenhum rosto detectado. Certifique-se de que seu rosto está visível e bem iluminado.');
            setCapturing(false);
            return;
          }
        } catch (error) {
          console.error('Erro ao processar frame:', error);
          onError('Erro ao processar a imagem. Certifique-se de que seu rosto está visível e bem iluminado.');
          setCapturing(false);
          return;
        }

        if (captured < captureCount) {
          setTimeout(captureFrame, 500);
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
      if (modelType === 'blazeFace') {
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
      } else if (modelType === 'faceApi') {
        // Ajustar índices para face-api.js (68 landmarks)
        const leftEyeCenter = landmarks[36]; // Aproximação do centro do olho esquerdo
        const rightEyeCenter = landmarks[45]; // Aproximação do centro do olho direito
        const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x) * image.width;
        irisWidths.push(eyeDistance / 3);
        dpPixels += eyeDistance;

        const leftFaceEdge = landmarks[0]; // Borda esquerda do rosto
        const rightFaceEdge = landmarks[16]; // Borda direita do rosto
        faceWidthPixels += Math.abs(rightFaceEdge.x - leftFaceEdge.x) * image.width;

        const eyeCenterY = (leftEyeCenter.y + rightEyeCenter.y) / 2 * image.height;
        const mouth = landmarks[57]; // Centro da boca
        lensHeightPixels += Math.abs(eyeCenterY - mouth.y * image.height);

        templeWidthPixels += faceWidthPixels * 1.2; // Aproximação
        const noseTip = landmarks[30]; // Ponta do nariz
        noseLengthPixels += Math.abs(noseTip.y - mouth.y) * image.height;
      } else {
        // MediaPipe FaceMesh
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

    if (modelType === 'faceMesh') {
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
    } else if (modelType === 'blazeFace') {
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
    } else if (modelType === 'faceApi') {
      const leftEye = landmarks[36];
      const rightEye = landmarks[45];
      ctx.beginPath();
      ctx.arc(leftEye.x * canvas.width, leftEye.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.arc(rightEye.x * canvas.width, rightEye.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.strokeStyle = 'blue';
      ctx.moveTo(leftEye.x * canvas.width, leftEye.y * canvas.height);
      ctx.lineTo(rightEye.x * canvas.width, rightEye.y * canvas.height);
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
          onClick={() => onShowCamera(!showCamera)}
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