'use client';

import { useState } from 'react';
import { FileText, Upload, X, Check } from 'lucide-react';

interface IDDocumentProps {
  onNext: () => void;
  onPrevious: () => void;
}

export default function IDDocument({ onNext, onPrevious }: IDDocumentProps) {
  const [documentType, setDocumentType] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFrontFile(e.target.files[0]);
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleRemoveFrontFile = () => {
    setFrontFile(null);
  };

  const handleRemoveBackFile = () => {
    setBackFile(null);
  };

  const handleDocumentTypeChange = (type: string) => {
    setDocumentType(type);
    // Clear files when document type changes
    setUploadedFile(null);
    setFrontFile(null);
    setBackFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (documentType === 'National ID') {
      if (frontFile && backFile) {
        onNext();
      }
    } else {
      if (uploadedFile) {
        onNext();
      }
    }
  };

  const isFormValid = () => {
    if (!documentType) return false;
    if (documentType === 'National ID') {
      return frontFile !== null && backFile !== null;
    }
    return uploadedFile !== null;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ID Document</h1>
            <p className="text-gray-600 mt-1">Upload a valid government-issued identification document for verification</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-4">
            {['Passport', 'Driver\'s License', 'National ID'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleDocumentTypeChange(type)}
                className={`p-4 border-2  text-center transition-all ${
                  documentType === type
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  {documentType === type && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <span className={`font-medium ${documentType === type ? 'text-gray-900' : 'text-gray-600'}`}>
                  {type}
                </span>
              </button>
            ))}
          </div>
        </div>

        {documentType === 'National ID' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Front of ID Card <span className="text-red-500">*</span>
              </label>
              
              {!frontFile ? (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300  p-12 text-center hover:border-green-400 transition-colors cursor-pointer bg-gray-50">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFrontFileChange}
                    className="hidden"
                    required
                  />
                </label>
              ) : (
                <div className="border-2 border-green-500  p-4 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{frontFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(frontFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFrontFile}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Back of ID Card <span className="text-red-500">*</span>
              </label>
              
              {!backFile ? (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300  p-12 text-center hover:border-green-400 transition-colors cursor-pointer bg-gray-50">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleBackFileChange}
                    className="hidden"
                    required
                  />
                </label>
              ) : (
                <div className="border-2 border-green-500  p-4 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{backFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(backFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveBackFile}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : documentType ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document <span className="text-red-500">*</span>
            </label>
            
            {!uploadedFile ? (
              <label className="block">
                <div className="border-2 border-dashed border-gray-300  p-12 text-center hover:border-green-400 transition-colors cursor-pointer bg-gray-50">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG, PDF up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
              </label>
            ) : (
              <div className="border-2 border-green-500  p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="bg-blue-50 border border-blue-200  p-4">
          <p className="text-sm text-blue-800">
            <strong>Security Note:</strong> Your document will be stored securely and encrypted. 
            We use industry-standard security measures to protect your information.
          </p>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onPrevious}
            className="px-4 py-1 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <button
            type="submit"
            disabled={!isFormValid()}
            className="px-4 py-1 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

