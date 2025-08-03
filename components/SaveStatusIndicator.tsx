
import React from 'react';

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ status }) => {
  const getStatusContent = () => {
    switch (status) {
      case 'saved':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ),
          text: 'All changes saved',
          color: 'text-green-400',
        };
      case 'unsaved':
        return {
          icon: <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>,
          text: 'Unsaved changes',
          color: 'text-yellow-400',
        };
      case 'saving':
        return {
          icon: (
            <svg className="animate-spin h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
          text: 'Saving...',
          color: 'text-blue-400',
        };
      default:
        return null;
    }
  };

  const content = getStatusContent();

  if (!content) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-secondary transition-colors ${content.color}`}>
      {content.icon}
      <span className="hidden xl:inline">{content.text}</span>
    </div>
  );
};

export default SaveStatusIndicator;
