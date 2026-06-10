import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useUiStore } from '../stores/ui';

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);

  const showLoading = () => {
    setIsLoading(true);
    setGlobalLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setGlobalLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-200/60 backdrop-blur-sm">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
