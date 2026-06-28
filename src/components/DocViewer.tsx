import React, { useState } from 'react';
import { Documento } from '../types';

interface DocViewerProps {
  documento: Documento | null;
  onClose: () => void;
}

/**
 * Modal visor de documentos: muestra PDFs embebidos e imágenes con zoom.
 * Si el archivo no tiene URL real, muestra un estado de "no disponible".
 */
export default function DocViewer({ documento, onClose }: DocViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [imgError, setImgError] = useState(false);

  if (!documento) return null;

  const url = documento.url;
  const nombre = documento.nombre || documento.etiqueta || 'Documento';
  const isPdf = nombre.toLowerCase().endsWith('.pdf') || url?.toLowerCase().includes('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nombre) || 
                  (url && /\.(jpg|jpeg|png|gif|webp|bmp)/i.test(url));

  const hasValidUrl = url && url.startsWith('http');

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-up border border-stone-200 dark:border-white/10 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-red-700 text-xl">
              {isPdf ? 'picture_as_pdf' : isImage ? 'image' : 'description'}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white truncate">{nombre}</h3>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                {documento.etiqueta}
                {documento.fileSize ? ` · ${documento.fileSize}` : ''}
                {documento.fechaCarga ? ` · ${documento.fechaCarga}` : ''}
                {documento.version && documento.version > 1 ? ` · v${documento.version}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Zoom controls for images */}
            {isImage && hasValidUrl && !imgError && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 transition-colors text-stone-600 dark:text-stone-300"
                  title="Reducir zoom"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 transition-colors text-stone-600 dark:text-stone-300"
                  title="Aumentar zoom"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 transition-colors text-stone-600 dark:text-stone-300 ml-0.5"
                  title="Restablecer zoom"
                >
                  <span className="material-symbols-outlined text-[14px]">fit_screen</span>
                </button>
              </div>
            )}
            {/* Open in new tab */}
            {hasValidUrl && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 transition-colors text-stone-600 dark:text-stone-300"
                title="Abrir en nueva pestaña"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </a>
            )}
            {/* Download */}
            {hasValidUrl && (
              <a
                href={url}
                download={nombre}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 transition-colors text-stone-600 dark:text-stone-300"
                title="Descargar"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors text-red-700 dark:text-red-400 ml-1"
              title="Cerrar"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-stone-100 dark:bg-[#111] flex items-center justify-center min-h-[300px]">
          {!hasValidUrl ? (
            /* No URL available */
            <div className="flex flex-col items-center gap-4 text-center p-10">
              <div className="w-20 h-20 rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-stone-400 dark:text-stone-500">
                  cloud_off
                </span>
              </div>
              <div>
                <h4 className="font-bold text-stone-700 dark:text-stone-300 text-base">
                  Vista previa no disponible
                </h4>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
                  Este documento no tiene un archivo asociado todavía, o su URL no es accesible.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                  documento.estado === 'aprobado' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/30'
                  : documento.estado === 'cargado' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/30'
                  : documento.estado === 'rechazado' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/30'
                  : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-white/10 dark:text-stone-400 dark:border-white/20'
                }`}>
                  Estado: {documento.estado.replace('_', ' ')}
                </span>
              </div>
            </div>
          ) : isPdf ? (
            /* PDF viewer */
            <iframe
              src={`${url}#toolbar=1&navpanes=0`}
              className="w-full h-full min-h-[500px]"
              title={nombre}
              style={{ border: 'none' }}
            />
          ) : isImage && !imgError ? (
            /* Image viewer with zoom */
            <div className="overflow-auto w-full h-full flex items-center justify-center p-4 cursor-grab active:cursor-grabbing">
              <img
                src={url}
                alt={nombre}
                onError={() => setImgError(true)}
                className="max-w-none transition-transform duration-200 rounded shadow-lg"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                draggable={false}
              />
            </div>
          ) : (
            /* Fallback: unknown type or image load error */
            <div className="flex flex-col items-center gap-4 text-center p-10">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-amber-600 dark:text-amber-400">
                  preview
                </span>
              </div>
              <div>
                <h4 className="font-bold text-stone-700 dark:text-stone-300 text-base">
                  No se puede previsualizar este formato
                </h4>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
                  Puedes abrirlo en una nueva pestaña o descargarlo usando los botones superiores.
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-red-700 text-white rounded-xl font-bold text-sm hover:bg-red-800 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                Abrir en Nueva Pestaña
              </a>
            </div>
          )}
        </div>

        {/* Footer with document info */}
        {documento.motivoRechazo && (
          <div className="px-5 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-700/30 flex-shrink-0">
            <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span><strong>Motivo de rechazo/subsanación:</strong> {documento.motivoRechazo}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
