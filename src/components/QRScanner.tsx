'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onProductScanned: (product: any) => void;
}

export default function QRScanner({ onProductScanned }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanning = async () => {
    setIsScanning(true);
    setError(null);

    try {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        async (decodedText: string) => {
          console.log('QR Code scanned:', decodedText);

          // Handle demo QR codes that redirect to manual pages
          if (decodedText.includes('/manual/') || decodedText.includes('dehn-dbm1')) {
            scanner.clear();
            setIsScanning(false);
            window.location.href = '/manual/dehn-dbm1?lang=en';
            return;
          }

          // Handle DEHNventil M2 QR code
          if (decodedText === 'DEHN-DEHNVENTIL-M2-2024') {
            scanner.clear();
            setIsScanning(false);
            onProductScanned({
              id: 'dehnventil-m2',
              name: 'DEHNventil M2 TNC 255 FM',
              category: 'Surge Protection',
              qrCode: decodedText
            });
            return;
          }

          try {
            // Call API to get product info
            const response = await fetch('/api/products', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ qrCode: decodedText }),
            });

            if (response.ok) {
              const result = await response.json();
              scanner.clear();
              setIsScanning(false);
              onProductScanned(result.data.product);
            } else {
              const error = await response.json();
              setError(error.error || 'Product not found');
            }
          } catch (err) {
            console.error('Error processing QR code:', err);
            setError('Failed to process QR code');
          }
        },
        (errorMessage: string) => {
          // Handle scan errors silently for better UX
          console.log('QR scan error:', errorMessage);
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Camera access denied or not available');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!isScanning ? (
        <div className="text-center">
          <button
            onClick={startScanning}
            className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold w-full mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Camera
          </button>

          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01" />
            </svg>
            <p className="text-gray-600 text-sm">
              Click "Start Camera" to scan the QR code on your DEHN product
            </p>
          </div>
        </div>
      ) : (
        <div className="qr-scanner-container">
          <div id="qr-reader" className="w-full"></div>
          <div className="mt-4 text-center">
            <button
              onClick={stopScanning}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
            >
              Stop Scanning
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Scanning Error
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Make sure the QR code is clearly visible and well-lit
        </p>
      </div>
    </div>
  );
}
