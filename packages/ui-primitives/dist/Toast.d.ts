import React from 'react';
interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}
interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    duration?: number;
}
interface ToastProviderProps {
    children: React.ReactNode;
}
export declare function ToastProvider({ children }: ToastProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useToast(): ToastContextValue;
export {};
