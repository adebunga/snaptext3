'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createWorker } from 'tesseract.js';

export default function ImageToText() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const workerRef = useRef<any>(null);

  // Initialize worker when component mounts
  useEffect(() => {
    let mounted = true;

    const setupWorker = async () => {
      try {
        const worker = await createWorker();
        
        if (!mounted) return;
        
        setProgress('Loading OCR engine...');
        await worker.loadLanguage('eng');
        
        if (!mounted) return;
        
        setProgress('Initializing...');
        await worker.initialize('eng');
        
        if (!mounted) return;
        
        setProgress('Ready!');
        workerRef.current = worker;
      } catch (error) {
        console.error('Error initializing worker:', error);
        if (mounted) {
          setProgress('Failed to initialize OCR. Please refresh the page.');
        }
      }
    };

    setupWorker();

    return () => {
      mounted = false;
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const preprocessImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Convert to black and white for better OCR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const threshold = 128;
          const color = avg > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = color;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas back to file
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], 'processed.png', { type: 'image/png' }));
          } else {
            resolve(file); // Fallback to original if processing fails
          }
        }, 'image/png');
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageProcessing = async (file: File) => {
    const worker = workerRef.current;
    if (!worker) {
      setProgress('OCR engine is initializing. Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    setResult('');
    setProgress('Processing your image...');

    try {
      const { data: { text } } = await worker.recognize(file);
      setResult(text || 'No text was found in the image.');
    } catch (error) {
      console.error('Error processing image:', error);
      setResult('Sorry! Something went wrong. Please try uploading the image again.');
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        handleImageProcessing(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setShowCopyTooltip(true);
    setTimeout(() => setShowCopyTooltip(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Image Upload */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-gray-900 rounded-2xl p-6 shadow-xl ring-1 ring-gray-800 transition-transform duration-300 hover:scale-[1.02]">
            <div className="border-2 border-dashed border-gray-700/50 rounded-xl h-[400px] flex items-center justify-center relative overflow-hidden group/upload">
              {selectedImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={selectedImage}
                    alt="Uploaded image"
                    fill
                    className="object-contain rounded-lg p-2"
                    unoptimized
                  />
                  <label
                    htmlFor="imageUpload"
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <p className="text-white text-sm">Click to change image</p>
                  </label>
                </div>
              ) : (
                <div className="text-center p-6 relative z-10">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="cursor-pointer flex flex-col items-center transform transition-transform duration-300 hover:scale-110"
                  >
                    <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-300 font-medium text-lg">Drop your image here</span>
                    <span className="text-gray-500 text-sm mt-2">
                      or click to browse
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Results */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-gray-900 rounded-2xl p-6 shadow-xl ring-1 ring-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Extracted Text
              </h3>
              {result && (
                <div className="relative">
                  <button
                    onClick={copyToClipboard}
                    className="text-sm px-4 py-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                    <span className="text-white">Copy</span>
                  </button>
                  {showCopyTooltip && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-gray-900 text-sm rounded-md shadow-lg animate-fade-in-out">
                      Copied!
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-[400px] bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 overflow-auto ring-1 ring-gray-700/50">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-700/30 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-300 font-medium">{progress}</p>
                    <p className="text-gray-500 text-sm mt-1">This might take a moment</p>
                  </div>
                </div>
              ) : result ? (
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{result}</p>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg
                    className="w-12 h-12 text-gray-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-400 font-medium">No text extracted yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Upload an image to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 