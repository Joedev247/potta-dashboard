'use client';

import { useState } from 'react';

export default function TestModeBanner() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-white border border-gray-200 rounded-full px-4 py-2 flex items-center gap-3 pointer-events-auto">
        <span className="text-sm text-gray-700 font-medium">Test mode is enabled</span>
        <div
          className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${
            enabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
          onClick={() => setEnabled(!enabled)}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-1'
            } mt-1`}
          />
        </div>
      </div>
    </div>
  );
}

