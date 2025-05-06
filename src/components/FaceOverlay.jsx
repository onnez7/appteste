import React, { useRef, useEffect } from 'react';

export default function FaceOverlay({ showCamera }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!showCamera) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawOverlay();
    };

    const drawOverlay = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenhar oval para posicionamento do rosto
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width * 0.3, canvas.height * 0.4, 0, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Instruções
      ctx.font = '16px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('Olhe fixamente para a câmera', canvas.width / 2, canvas.height * 0.1);
      ctx.fillText('Mova a cabeça levemente para esquerda e direita', canvas.width / 2, canvas.height * 0.9);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [showCamera]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ display: showCamera ? 'block' : 'none' }}
    />
  );
}