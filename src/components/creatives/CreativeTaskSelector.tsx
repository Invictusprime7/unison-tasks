import React from 'react';

interface CreativeTaskSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreativeTaskSelector({ open, onOpenChange }: CreativeTaskSelectorProps) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Creative Task Selector</h2>
        <p className="text-gray-600 mb-4">Choose your creative task type:</p>
        <div className="flex gap-2">
          <button 
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
