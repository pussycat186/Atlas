'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { createContext, useContext } from 'react';
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = React.useState([]);
    const addToast = (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };
        setToasts(prev => [...prev, newToast]);
        if (toast.duration !== 0) {
            setTimeout(() => {
                removeToast(id);
            }, toast.duration || 5000);
        }
    };
    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };
    return (_jsxs(ToastContext.Provider, { value: { toasts, addToast, removeToast }, children: [children, _jsx(ToastViewport, {})] }));
}
function ToastViewport() {
    const context = useContext(ToastContext);
    if (!context)
        return null;
    const { toasts, removeToast } = context;
    return (_jsx("div", { "aria-live": "polite", "aria-label": "Notifications", className: "fixed top-4 right-4 z-50 flex flex-col gap-2", children: toasts.map(toast => (_jsx("div", { role: "alert", className: "bg-white border rounded-lg p-4 shadow-lg max-w-sm", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: toast.title }), toast.description && (_jsx("div", { className: "text-sm text-gray-600 mt-1", children: toast.description }))] }), _jsx("button", { onClick: () => removeToast(toast.id), "aria-label": "Close notification", className: "ml-4 text-gray-400 hover:text-gray-600", children: "\u00D7" })] }) }, toast.id))) }));
}
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
