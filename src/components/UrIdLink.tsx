import React, { useState } from 'react';
import { URDetailModal } from './URDetailModal';

interface UrIdLinkProps {
  urId: string;
  className?: string;
}

export const UrIdLink: React.FC<UrIdLinkProps> = ({ urId, className }) => {
  const [showModal, setShowModal] = useState(false);

  if (!urId) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className={`font-mono text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded ${className ?? ''}`}
      >
        {urId}
      </button>
      {showModal && (
        <URDetailModal urId={urId} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};
