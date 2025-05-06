import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function MeasurementDisplay({ measurements, capturedImage, scale, onRedo, savedMeasurements }) {
  return (
    <>
      {capturedImage && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Imagem Capturada</h2>
          <img src={capturedImage} alt="Captured" className="w-full rounded-2xl mb-4" />
          <p className="text-sm text-gray-600 mb-2">Medições Calculadas (Escala: {scale.toFixed(2)} mm/pixel):</p>
          <div className="bg-white p-4 rounded-2xl shadow-md mb-4">
            <p className="text-sm text-gray-600">Distância Pupilar (DP): {measurements.dp} mm</p>
            <p className="text-sm text-gray-600">Largura do rosto: {measurements.faceWidth} mm</p>
            <p className="text-sm text-gray-600">Altura da lente: {measurements.lensHeight} mm</p>
            <p className="text-sm text-gray-600">Largura entre as têmporas: {measurements.templeWidth} mm</p>
            <p className="text-sm text-gray-600">Comprimento do nariz: {measurements.noseLength} mm</p>
          </div>
        </div>
      )}

      {savedMeasurements && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Medições Salvas</h2>
          <div className="bg-white p-4 rounded-2xl shadow-md">
            <p className="text-sm text-gray-600">Distância Pupilar (DP): {savedMeasurements.dp} mm</p>
            <p className="text-sm text-gray-600">Largura do rosto: {savedMeasurements.faceWidth} mm</p>
            <p className="text-sm text-gray-600">Altura da lente: {savedMeasurements.lensHeight} mm</p>
            <p className="text-sm text-gray-600">Largura entre as têmporas: {savedMeasurements.templeWidth} mm</p>
            <p className="text-sm text-gray-600">Comprimento do nariz: {savedMeasurements.noseLength} mm</p>
          </div>
          <button
            onClick={onRedo}
            className="mt-4 w-full bg-white p-4 rounded-2xl shadow-md hover:bg-gray-100 transition"
          >
            <ArrowPathIcon className="w-5 h-5 text-primary mr-2 inline" /> Refazer
          </button>
        </div>
      )}
    </>
  );
}