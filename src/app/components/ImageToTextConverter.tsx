'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

export default function ImageToTextConverter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedText, setConvertedText] = useState('');
  const [error, setError] = useState('');

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setError('');
    setImageUrl(URL.createObjectURL(file));
    setImageFile(file);
    setIsConverting(true);
    setConvertedText('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to convert image to text');
      }

      const data = await response.json();
      setConvertedText(data.text);
    } catch (err) {
      setError('Failed to convert image to text. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await processFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div 
          className="flex flex-col items-center justify-center w-full"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div
            onClick={handleClick}
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 mb-2 text-gray-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <p className="mb-1 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {imageUrl && (
          <div className="relative w-full h-64">
            <Image
              src={imageUrl}
              alt="Uploaded image"
              fill
              className="object-contain rounded-lg"
            />
          </div>
        )}

        {isConverting && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-100" />
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-200" />
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {convertedText && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="mb-2 text-lg font-semibold">Converted Text:</h3>
            <p className="whitespace-pre-wrap">{convertedText}</p>
          </div>
        )}
      </div>
    </div>
  );
} 