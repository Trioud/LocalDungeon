'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { usePortrait } from '@/lib/hooks/usePortrait';

interface PortraitUploaderProps {
  characterId: string;
  onSuccess: (portraitUrl: string) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const size = Math.min(crop.width * scaleX, crop.height * scaleY);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    size,
    size
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
      mimeType,
      0.92
    );
  });
}

export default function PortraitUploader({ characterId, onSuccess }: PortraitUploaderProps) {
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [originalMime, setOriginalMime] = useState<string>('image/jpeg');
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPortrait, uploading, error } = usePortrait();

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mime = file.type || 'image/jpeg';
    setOriginalMime(mime);
    const reader = new FileReader();
    reader.addEventListener('load', () => setSrcUrl(reader.result as string));
    reader.readAsDataURL(file);
  }, []);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;
    const blob = await getCroppedBlob(imgRef.current, completedCrop, originalMime);
    const ext = originalMime === 'image/png' ? 'png' : originalMime === 'image/webp' ? 'webp' : 'jpg';
    const file = new File([blob], `portrait.${ext}`, { type: originalMime });
    const url = await uploadPortrait(characterId, file);
    setSrcUrl(null);
    onSuccess(url);
  }, [characterId, completedCrop, imgRef, originalMime, uploadPortrait, onSuccess]);

  const handleCancel = useCallback(() => {
    setSrcUrl(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded border border-gray-600 transition-colors"
        disabled={uploading}
      >
        {uploading ? 'Uploading…' : 'Upload Portrait'}
      </button>

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      {srcUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-4">Crop Portrait</h3>
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={srcUrl} alt="Crop preview" onLoad={onImageLoad} style={{ maxHeight: '60vh' }} />
            </ReactCrop>
            <div className="flex gap-3 justify-end mt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded border border-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={uploading || !completedCrop}
                className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
