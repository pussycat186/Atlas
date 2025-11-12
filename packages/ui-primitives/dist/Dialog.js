'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
export function Dialog({ isOpen, onClose, title, children, 'data-testid': testId }) {
    const dialogRef = useRef(null);
    const previousFocusRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement;
            dialogRef.current?.focus();
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
                // Focus trap
                if (e.key === 'Tab') {
                    const focusableElements = dialogRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (focusableElements && focusableElements.length > 0) {
                        const firstElement = focusableElements[0];
                        const lastElement = focusableElements[focusableElements.length - 1];
                        if (e.shiftKey && document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                        else if (!e.shiftKey && document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
                previousFocusRef.current?.focus();
            };
        }
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", "data-testid": testId, children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50", onClick: onClose, "aria-hidden": "true" }), _jsxs("div", { ref: dialogRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "dialog-title", tabIndex: -1, className: "relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 focus:outline-none", children: [_jsx("h2", { id: "dialog-title", className: "text-lg font-semibold mb-4", children: title }), children, _jsx("button", { onClick: onClose, className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600", "aria-label": "Close dialog", children: "\u00D7" })] })] }));
}
