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
  const [pixelScale, setPixelScale] = useState(1);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [useManualScale, setUseManualScale] = useState(false);
  const [manualDp, setManualDp] = useState(62); // DP padrão para fallback manual
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Carregar modelos do face-api.js
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Tentando carregar tinyFaceDetector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models').catch(err => {
          throw new Error(`Falha ao carregar tinyFaceDetector: ${err.message}`);
        });
        console.log('tinyFaceDetector carregado com sucesso.');
        
        console.log('Tentando carregar faceLandmark68TinyNet...');
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models').catch(err => {
          throw new Error(`Falha ao carregar faceLandmark68TinyNet: ${err.message}`);
        });
        console.log('faceLandmark68TinyNet carregado com sucesso.');
        
        setIsModelLoaded(true);
        setModelError(null);
      } catch (error) {
        console.error('Erro ao carregar modelos:', error);
        setModelError(error.message || 'Falha ao carregar os modelos de IA.');
        setIsModelLoaded(false);
        setUseManualScale(true); // Ativar fallback manual
      }
    };
    loadModels();
  }, []);

  // Função para capturar e processar a imagem
  const captureImage = async () => {
    if (!isModelLoaded && !useManualScale) {
      alert(modelError || 'Os modelos de IA ainda estão carregando. Tente novamente em alguns segundos.');
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

        if (isModelLoaded && !useManualScale) {
          try {
            const detections = await faceapi
              .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks(true);

            if (detections) {
              const landmarks = detections.landmarks;

              // Calcular a distância pupilar (DP)
              const leftPupil = landmarks.getLeftEye()[3];
              const rightPupil = landmarks.getRightEye()[0];
              dpPixels = Math.abs(rightPupil.x - leftPupil.x);

              // Calcular a escala usando a DP média (62 mm)
              const averageDpMm = 62;
              scale = averageDpMm / dpPixels;
              setPixelScale(scale);

              // Calcular largura do rosto
              faceWidthPixels = Math.abs(
                landmarks.getLeftEye()[0].x - landmarks.getRightEye()[3].x
              );

              // Calcular altura da lente
              const eyeCenterY = (leftPupil.y + rightPupil.y) / 2;
              const forehead = landmarks.getMouth()[0];
              lensHeightPixels = Math.abs(eyeCenterY - forehead.y);

              // Calcular largura entre as têmporas
              templeWidthPixels = Math.abs(
                landmarks.getJawOutline()[0].x - landmarks.getJawOutline()[16].x
              );

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
              return;
            }
          } catch (error) {
            console.error('Erro ao processar imagem:', error);
            alert('Erro ao processar a imagem. Usando modo manual.');
            setUseManualScale(true);
            return;
          }
        }

        if (useManualScale) {
          // Modo manual: usar DP informada pelo usuário
          scale = manualDp / 100; // Aproximação simplificada (100 pixels como base)
          setPixelScale(scale);
          dpPixels = 100; // Valor fixo para cálculo manual
          faceWidthPixels = 200; // Aproximação para largura do rosto
          lensHeightPixels = 50; // Aproximação para altura da lente
          templeWidthPixels = 250; // Aproximação para largura das têmporas
        }

        // Converter pixels para mm
        setMeasurements({
          dp: Math.round(dpPixels * scale),
          faceWidth: Math.round(faceWidthPixels * scale),
          lensHeight: Math.round(lensHeightPixels * scale),
          templeWidth: Math.round(templeWidthPixels * scale),
        });
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
          <p className="text-sm text-red-600 mb-2">
            {modelError || 'Carregando modelos de IA, aguarde...'}
          </p>
        )}
        {useManualScale && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Modo manual ativado. Insira sua distância pupilar (DP) em mm:
            </p>
            <input
              type="number"
              value={manualDp}
              onChange={(e) => setManualDp(Number(e.target.value))}
              className="w-full p-2 border rounded"
              placeholder="Ex.: 62"
            />
          </div>
        )}
        {showCamera && (
          <div className="relative">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg
System: O código fornecido está incompleto, terminando abruptamente em uma linha parcial (`screenshotFormat="image/jpeg`). Vou assumir que o restante do código segue o mesmo padrão do `Measurements.jsx` anterior e completar a correção, mantendo a lógica para resolver o problema de carregamento dos modelos do `face-api.js`. Vou finalizar o arquivo, incorporar as correções sugeridas, e garantir que o código seja robusto, com logs detalhados e um fallback manual funcional.

---

### Análise do Problema
O erro "Falha ao carregar os modelos de IA" indica que o `face-api.js` não conseguiu carregar os modelos `tinyFaceDetector` e `faceLandmark68TinyNet` do diretório `public/models`. A lista de arquivos fornecida confirma que os arquivos necessários estão presentes localmente:

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_tiny_model-weights_manifest.json`
- `face_landmark_68_tiny_model-shard1`

No entanto, o problema pode estar relacionado a:
1. **Caminho dos modelos no deploy**: Os arquivos podem não estar sendo servidos corretamente pela Vercel em `/models`.
2. **Erro de CORS ou rede**: O navegador (especialmente Safari) pode estar bloqueando o acesso aos arquivos.
3. **Configuração do Vite/Vercel**: Os arquivos podem não estar sendo incluídos no build ou estão sendo otimizados incorretamente.
4. **Compatibilidade do Safari**: O `face-api.js` pode ter problemas de desempenho ou compatibilidade em dispositivos iOS.

### Correções
1. **Garantir que os modelos sejam incluídos no deploy**:
   - Verificar se `public/models` está no repositório Git e incluído no deploy da Vercel.
   - Testar o acesso aos arquivos em `https://appteste-fb9qp35k1-artisan-oss-projects.vercel.app/models/tiny_face_detector_model-weights_manifest.json`.

2. **Simplificar o carregamento dos modelos**:
   - Usar apenas `tinyFaceDetector` e `faceLandmark68TinyNet`.
   - Adicionar logs detalhados para cada etapa do carregamento.
   - Tratar erros de forma específica e exibir mensagens claras ao usuário.

3. **Fallback manual robusto**:
   - Se os modelos falharem, permitir que o usuário insira a distância pupilar (DP) manualmente e calcular as outras medições com base em proporções aproximadas.

4. **Compatibilidade com Safari**:
   - Garantir que o `face-api.js` seja compatível com o Safari, usando polyfills se necessário.
   - Reduzir a carga de memória usando modelos leves.

---

### Código Atualizado para `Measurements.jsx`

<xaiArtifact artifact_id="3970c51b-3120-42b8-89d5-a93907e792f6" artifact_version_id="bde26571-5c1a-4ba1-b729-7757366eb6bf" title="src/pages/Measurements.jsx" contentType="text/jsx">
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
  const [pixelScale, setPixelScale] = useState(1);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [useManualScale, setUseManualScale] = useState(false);
  const [manualDp, setManualDp] = useState(62); // DP padrão para fallback manual
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Carregar modelos do face-api.js
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Tentando carregar tinyFaceDetector de /models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models').catch(err => {
          throw new Error(`Falha ao carregar tinyFaceDetector: ${err.message}`);
        });
        console.log('tinyFaceDetector carregado com sucesso.');

        console.log('Tentando carregar faceLandmark68TinyNet de /models...');
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models').catch(err => {
          throw new Error(`Falha ao carregar faceLandmark68TinyNet: ${err.message}`);
        });
        console.log('faceLandmark68TinyNet carregado com sucesso.');

        setIsModelLoaded(true);
        setModelError(null);
      } catch (error) {
        console.error('Erro ao carregar modelos:', error);
        setModelError(error.message || 'Falha ao carregar os modelos de IA.');
        setIsModelLoaded(false);
        setUseManualScale(true); // Ativar fallback manual
      }
    };
    loadModels();
  }, []);

  // Função para capturar e processar a imagem
  const captureImage = async () => {
    if (!isModelLoaded && !useManualScale) {
      alert(modelError || 'Os modelos de IA ainda estão carregando. Tente novamente em alguns segundos.');
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

        if (isModelLoaded && !useManualScale) {
          try {
            console.log('Detectando rosto na imagem...');
            const detections = await faceapi
              .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks(true);

            if (detections) {
              const landmarks = detections.landmarks;

              // Calcular a distância pupilar (DP)
              const leftPupil = landmarks.getLeftEye()[3];
              const rightPupil = landmarks.getRightEye()[0];
              dpPixels = Math.abs(rightPupil.x - leftPupil.x);

              // Calcular a escala usando a DP média (62 mm)
              const averageDpMm = 62;
              scale = averageDpMm / dpPixels;
              setPixelScale(scale);

              // Calcular largura do rosto
              faceWidthPixels = Math.abs(
                landmarks.getLeftEye()[0].x - landmarks.getRightEye()[3].x
              );

              // Calcular altura da lente
              const eyeCenterY = (leftPupil.y + rightPupil.y) / 2;
              const forehead = landmarks.getMouth()[0];
              lensHeightPixels = Math.abs(eyeCenterY - forehead.y);

              // Calcular largura entre as têmporas
              templeWidthPixels = Math.abs(
                landmarks.getJawOutline()[0].x - landmarks.getJawOutline()[16].x
              );

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

              console.log('Rosto detectado e medições calculadas.');
            } else {
              console.warn('Nenhum rosto detectado na imagem.');
              alert('Nenhum rosto detectado. Certifique-se de que seu rosto está visível na imagem.');
              setUseManualScale(true);
              return;
            }
          } catch (error) {
            console.error('Erro ao processar imagem:', error);
            alert('Erro ao processar a imagem. Usando modo manual.');
            setUseManualScale(true);
            return;
          }
        }

        if (useManualScale) {
          // Modo manual: usar DP informada pelo usuário
          scale = manualDp / 100; // Aproximação (100 pixels como base)
          setPixelScale(scale);
          dpPixels = 100; // Valor fixo para cálculo manual
          faceWidthPixels = 200; // Aproximação para largura do rosto
          lensHeightPixels = 50; // Aproximação para altura da lente
          templeWidthPixels = 250; // Aproximação para largura das têmporas
          console.log('Usando modo manual com DP:', manualDp);
        }

        // Converter pixels para mm
        setMeasurements({
          dp: Math.round(dpPixels * scale),
          faceWidth: Math.round(faceWidthPixels * scale),
          lensHeight: Math.round(lensHeightPixels * scale),
          templeWidth: Math.round(templeWidthPixels * scale),
        });
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
    setUseManualScale(isModelLoaded ? false : true);
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Realizar Medições com IA</h2>
        {!isModelLoaded && (
          <p className="text-sm text-red-600 mb-2">
            {modelError || 'Carregando modelos de IA, aguarde...'}
          </p>
        )}
        {useManualScale && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Modo manual ativado. Insira sua distância pupilar (DP) em mm:
            </p>
            <input
              type="number"
              value={manualDp}
              onChange={(e) => setManualDp(Number(e.target.value))}
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
              disabled={!isModelLoaded && !useManualScale}
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
              <strong>Instruções para Precisão:</strong> Certifique-se de que seu rosto está bem iluminado e visível na câmera. Se a IA não funcionar, você pode inserir sua distância pupilar manualmente.
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