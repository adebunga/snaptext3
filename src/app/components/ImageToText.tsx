'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createWorker } from 'tesseract.js';
import type { Worker, LoggerMessage } from 'tesseract.js';
import { PSM } from 'tesseract.js';

export default function ImageToText() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [editableText, setEditableText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const workerBusyRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Initialize worker when component mounts
  const setupWorker = async () => {
    if (workerRef.current || workerBusyRef.current) return;
    workerBusyRef.current = true;

    try {
      const worker = await createWorker({
        logger: (m: LoggerMessage) => {
          if (m.status === 'recognizing text') {
            setProgressPercent(Math.round(m.progress * 100));
          }
        },
        workerPath: 'https://unpkg.com/tesseract.js@v4.1.1/dist/worker.min.js',
        corePath: 'https://unpkg.com/tesseract.js-core@v4.0.3/tesseract-core.wasm.js',
        langPath: 'https://raw.githubusercontent.com/naptha/tessdata/4.0.0_best'
      });
      
      setProgress('Loading OCR engine...');
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      // Configure Tesseract for better layout analysis
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO_OSD,
        preserve_interword_spaces: "1"
      });
      
      workerRef.current = worker;
    } catch (error) {
      console.error('Error initializing worker:', error);
      setProgress('Failed to initialize OCR. Please refresh the page.');
    } finally {
      workerBusyRef.current = false;
    }
  };

  useEffect(() => {
    setupWorker();

    return () => {
      const cleanup = async () => {
        if (workerRef.current) {
          await workerRef.current.terminate();
          workerRef.current = null;
        }
      };
      cleanup();
    };
  }, []);

  useEffect(() => {
    setEditableText(result);
  }, [result]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableText(e.target.value);
  };

  const preprocessImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Calculate optimal scale based on image size
        const maxDimension = Math.max(img.width, img.height);
        const scale = maxDimension > 2000 ? 1 : (maxDimension > 1000 ? 1.5 : 2);
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw original image with scaling
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Use Uint8Array for better performance
        const grayscale = new Uint8Array(data.length / 4);
        
        // Convert to grayscale in a single pass
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          grayscale[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          
          // Apply simple contrast enhancement
          const enhanced = grayscale[j] < 128 ? grayscale[j] * 0.8 : Math.min(255, grayscale[j] * 1.2);
          const color = enhanced > 128 ? 255 : 0;
          
          data[i] = data[i + 1] = data[i + 2] = color;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas back to file with quality optimization
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], 'processed.png', { type: 'image/png' }));
            } else {
              resolve(file);
            }
          },
          'image/png',
          0.8
        );
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageProcessing = async (file: File) => {
    const worker = workerRef.current;
    if (!worker) {
      if (!workerBusyRef.current) {
        setProgress('OCR engine is initializing. Please wait...');
        await setupWorker();
      } else {
        setProgress('OCR engine is still initializing. Please try again in a moment.');
      }
      return;
    }

    setIsLoading(true);
    setResult('');
    setProgress('Processing your image...');
    setProgressPercent(0);

    try {
      const processedFile = await preprocessImage(file);
      
      const { data } = await worker.recognize(processedFile);
      const blocks = data.blocks || [];
      
      // Sort blocks by their position (top to bottom, left to right)
      const sortedBlocks = blocks.sort((a, b) => {
        const rowDiff = a.bbox.y0 - b.bbox.y0;
        return Math.abs(rowDiff) < 20 ? a.bbox.x0 - b.bbox.x0 : rowDiff;
      });
      
      // Process each block and maintain layout
      let formattedText = '';
      let currentY = -1;
      const lineThreshold = 20;
      
      for (const block of sortedBlocks) {
        if (currentY === -1 || block.bbox.y0 - currentY > lineThreshold) {
          if (formattedText !== '') {
            formattedText += '\n\n';
          }
          currentY = block.bbox.y0;
        } else if (Math.abs(block.bbox.y0 - currentY) <= lineThreshold) {
          formattedText += '    ';
        }
        formattedText += block.text.trim();
      }
      
      setResult(formattedText || 'No text was found in the image.');
    } catch (error) {
      console.error('Error processing image:', error);
      setResult('Sorry! Something went wrong. Please try uploading the image again.');
    } finally {
      setIsLoading(false);
      setProgress('');
      setProgressPercent(0);
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
    navigator.clipboard.writeText(editableText);
    setShowCopyTooltip(true);
    setTimeout(() => setShowCopyTooltip(false), 2000);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editableText]);

  // Add paste event listener
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      Array.from(items).forEach(item => {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              setSelectedImage(result);
              handleImageProcessing(file);
            };
            reader.readAsDataURL(file);
          }
        }
      });
    };

    // Add paste event listener to the document
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Image Upload */}
        <div className="relative">
          <div className="group relative bg-gray-900/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden h-[472px]">
            {/* Inner glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-white/[0.07] to-transparent"></div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20"></div>
            
            <div 
              ref={dropZoneRef}
              className="border-2 border-dashed border-gray-700/30 rounded-xl h-full flex items-center justify-center relative overflow-hidden group/upload"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="imageUpload"
              />
              {selectedImage ? (
                <div className="relative w-full h-full transition-transform duration-500 animate-fade-in">
                  <Image
                    src={selectedImage}
                    alt="Uploaded image"
                    fill
                    className="object-contain rounded-lg p-2 pointer-events-none transition-all duration-300"
                    unoptimized
                    priority
                  />
                  <label
                    htmlFor="imageUpload"
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover/upload:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer z-10 backdrop-blur-sm"
                  >
                    <div className="transform transition-all duration-300 group-hover/upload:scale-110">
                      <p className="text-white text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
                        Click to change image
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="text-center p-6 relative z-10">
                  <label
                    htmlFor="imageUpload"
                    className="cursor-pointer flex flex-col items-center transform transition-all duration-300 hover:scale-110"
                  >
                    <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg group-hover/upload:shadow-pink-500/25 transition-all duration-300">
                      <svg
                        className="w-8 h-8 text-white transform transition-transform duration-300 group-hover/upload:rotate-12"
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
                    <span className="text-gray-300 font-medium text-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-montserrat">
                      Drop your image here
                    </span>
                    <span className="text-gray-500 text-sm mt-2 transition-all duration-300 group-hover/upload:text-gray-400">
                      or click to browse
                    </span>
                    <span className="text-gray-500 text-sm mt-1 transition-all duration-300 group-hover/upload:text-gray-400">
                      or paste from clipboard
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Results */}
        <div className="relative">
          <div className="group relative bg-gray-900/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl transition-all duration-300 overflow-hidden h-[472px]">
            {/* Inner glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-white/[0.07] to-transparent"></div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20"></div>
            
            <div className="flex justify-between items-center mb-4 relative">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-montserrat">
                Extracted Text
              </h3>
              {editableText && (
                <div className="relative">
                  <button
                    onClick={copyToClipboard}
                    className="text-sm px-4 py-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/25"
                  >
                    <svg
                      className="w-4 h-4 text-white transition-transform duration-300 group-hover:rotate-12"
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
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-gray-900 text-sm rounded-md shadow-lg animate-fade-up">
                      Copied!
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-[calc(100%-2rem)] bg-gray-800/20 backdrop-blur-md rounded-xl p-6 overflow-auto transition-all duration-300">
              <div className="absolute inset-px rounded-xl bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
              <div className="absolute inset-0 rounded-xl ring-1 ring-white/10"></div>
              <div className="relative h-full">
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-gray-700/30 rounded-full"></div>
                      <div 
                        className="absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-500 border-r-purple-500 rounded-full animate-spin"
                        style={{
                          clipPath: progressPercent < 100 
                            ? `polygon(0 0, ${progressPercent}% 0, ${progressPercent}% 100%, 0 100%)`
                            : undefined
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-50 blur-sm animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-300 font-medium animate-pulse">{progress}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {progressPercent > 0 && (
                          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                            {progressPercent}% complete
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ) : editableText ? (
                  <div className="animate-fade-in h-full">
                    <textarea
                      ref={textareaRef}
                      value={editableText}
                      onChange={handleTextChange}
                      className="w-full h-full bg-transparent text-gray-200 whitespace-pre-wrap leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded-lg p-2 transition-all duration-300"
                      spellCheck="false"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center animate-fade-in">
                    <svg
                      className="w-12 h-12 text-gray-600 mb-4 animate-float"
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
                    <p className="text-gray-400 font-medium">No text detected yet</p>
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
    </div>
  );
} 