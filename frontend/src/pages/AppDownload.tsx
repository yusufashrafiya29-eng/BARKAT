import React from 'react';
import { Download, Smartphone, QrCode, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function AppDownload() {
  const navigate = useNavigate();

  // URL where the APK will be hosted on this exact domain
  const apkDownloadUrl = `${window.location.origin}/downloads/captain-app.apk`;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Get the MyRestro Captain App
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Empower your waiters to take orders directly from tables with our lightning-fast Android app.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Left Column: QR Code */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <QrCode className="w-32 h-32" />
            </div>
            
            <div className="mb-6 bg-indigo-50 text-indigo-700 font-semibold px-4 py-2 rounded-full inline-flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              For Android Devices Only
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 relative z-10">
              <QRCodeSVG 
                value={apkDownloadUrl}
                size={220}
                bgColor={"#ffffff"}
                fgColor={"#111827"}
                level={"H"}
                imageSettings={{
                  src: "/logo.png",
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Scan to Install</h3>
            <p className="text-gray-500 mb-6">
              Open your phone's camera and scan this code to download the APK file directly.
            </p>

            <a
              href={apkDownloadUrl}
              download
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors w-full justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Download APK Directly
            </a>
          </div>

          {/* Right Column: Instructions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-8">Installation Guide</h3>
            
            <div className="space-y-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">
                    1
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900">Download the APK</h4>
                  <p className="mt-1 text-gray-600">Scan the QR code or click the download button to get the captain-app.apk file on your phone.</p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">
                    2
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900">Allow Unknown Sources</h4>
                  <p className="mt-1 text-gray-600">When you open the APK, Android might block it. Tap <strong>Settings</strong> and turn on <strong>Allow from this source</strong>.</p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">
                    3
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900">Install and Login</h4>
                  <p className="mt-1 text-gray-600">Tap Install. Once finished, open the app and login with your waiter credentials.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="flex items-center text-sm font-bold text-gray-900 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                What about iPhones (iOS)?
              </h4>
              <p className="text-sm text-gray-600">
                For iPhones, simply open your Waiter Dashboard URL in the Safari browser, tap the Share icon, and select <strong>"Add to Home Screen"</strong>. It will function identically to the native app!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
