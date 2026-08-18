import React, { useRef, useState } from 'react';
import { UploadCloud, Camera, Image as ImageIcon, Trash2, ChevronLeft, ChevronRight, Video, X } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface ImageUploaderProps {
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ images, setImages }) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Webcam modal state
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: number) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      setShowWebcam(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.warn('Webcam fallback to file input capture:', err);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const captureWebcamPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], `captured-invoice-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setImages((prev) => [...prev, capturedFile]);
        }
      }, 'image/jpeg', 0.85);
    }
    stopWebcam();
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowWebcam(false);
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-[#0B130E] border-2 border-dashed border-slate-300 dark:border-white/15 rounded-2xl p-6 hover:border-emerald-500 transition-colors">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('uploadInvoiceReceipt')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{t('imageMustBeClear')}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={startWebcam}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#1E4620] hover:bg-[#163318] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-transform active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>{t('camera')}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#1E4620] hover:bg-[#163318] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-transform active:scale-95"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{t('gallery')}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-4">{t('multipleImageHint')}</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {images.map((file, index) => {
              const url = URL.createObjectURL(file);
              return (
                <div key={`${file.name}-${index}`} className="relative group bg-white dark:bg-[#121A15] rounded-xl overflow-hidden border border-slate-200 dark:border-white/15 shadow-xs">
                  <img src={url} alt={`Invoice ${index + 1}`} className="w-full h-36 object-cover" />
                  <div className="p-2 bg-slate-50 dark:bg-black/40 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveImage(index, -1)}
                      className="p-1 rounded bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="flex items-center space-x-1 px-2 py-1 bg-red-50 dark:bg-rose-500/20 hover:bg-red-100 dark:hover:bg-rose-500/30 text-red-600 dark:text-rose-400 rounded text-xs font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, 1)}
                      className="p-1 rounded bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={startWebcam}
              className="flex items-center space-x-2 px-3.5 py-2 bg-[#1E4620] hover:bg-[#163318] text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Add Camera Photo</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3.5 py-2 bg-[#1E4620] hover:bg-[#163318] text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Add From Gallery</span>
            </button>
          </div>
        </div>
      )}

      {/* Webcam Modal */}
      {showWebcam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#121A15] text-slate-900 dark:text-white rounded-3xl overflow-hidden max-w-lg w-full p-4 shadow-2xl relative border border-slate-200 dark:border-white/15">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h4 className="font-bold flex items-center text-slate-900 dark:text-white">
                <Video className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                Capture Invoice Photo
              </h4>
              <button onClick={stopWebcam} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative my-3 rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={stopWebcam} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/20">
                Cancel
              </button>
              <button onClick={captureWebcamPhoto} className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 rounded-xl shadow-sm">
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
