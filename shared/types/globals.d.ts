// Global ambient declarations for browser globals used across the app
// Kept minimal to avoid pulling in whole GA types package

declare function gtag(...args: any[]): void;

interface Window {
  dataLayer?: any[];
  gtag?: (...args: any[]) => void;
}

export {}
