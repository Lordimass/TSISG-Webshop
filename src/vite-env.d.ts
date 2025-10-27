/// <reference types="vite/client" />

// Minimal global declarations used across the app
declare function gtag(...args: any[]): void;
interface Window {
	dataLayer?: any[];
}
/// <reference types="vite/types/importMeta.d.ts" />