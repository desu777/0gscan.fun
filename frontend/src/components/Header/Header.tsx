import { ExternalLink, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  return (
    <>
      <header className="relative z-10 pt-12 pb-8 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <img
            src="/L-I1k2oL_400x400.jpg"
            alt="0G Labs"
            className="w-28 h-28 mx-auto mb-6 rounded-xl shadow-lg"
          />
          <h1 className="text-4xl md:text-5xl font-poppins font-light text-white mb-3">
            Airdrop Distribution Transparency
          </h1>
          <p className="text-gray-400 font-poppins text-lg mb-6">
            Independent on-chain verification
          </p>

          {/* Tokenomics Image */}
          <div className="mt-8 mb-4">
            <img
              src="/Gl-DldZXUAEEQLx.jpg"
              alt="0G Tokenomics"
              className="max-w-md w-full mx-auto rounded-lg shadow-xl border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleImageClick}
              title="Click to enlarge"
            />
          </div>

          {/* Tweet Link */}
          <a
            href="https://x.com/0G_Foundation/status/1900382345200296252"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            <span>View Official Tokenomics Announcement</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </header>

      {/* Image Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={handleCloseModal}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={handleCloseModal}
            aria-label="Close modal"
          >
            <X size={32} />
          </button>
          <img
            src="/Gl-DldZXUAEEQLx.jpg"
            alt="0G Tokenomics - Enlarged"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}