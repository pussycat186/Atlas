'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useRef, useEffect } from 'react';
const MenuContext = createContext(null);
export function Menu({ open, onOpenChange, children }) {
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    return (_jsx(MenuContext.Provider, { value: { open, onOpenChange, focusedIndex, setFocusedIndex }, children: children }));
}
export function MenuContent({ children, className }) {
    const context = useContext(MenuContext);
    if (!context)
        throw new Error('MenuContent must be used within Menu');
    const { open, onOpenChange, focusedIndex, setFocusedIndex } = context;
    const contentRef = useRef(null);
    useEffect(() => {
        if (open) {
            const handleKeyDown = (e) => {
                const items = contentRef.current?.querySelectorAll('[role="menuitem"]');
                if (!items)
                    return;
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextIndex = (focusedIndex + 1) % items.length;
                        setFocusedIndex(nextIndex);
                        items[nextIndex]?.focus();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        const prevIndex = (focusedIndex - 1 + items.length) % items.length;
                        setFocusedIndex(prevIndex);
                        items[prevIndex]?.focus();
                        break;
                    case 'Escape':
                        onOpenChange(false);
                        break;
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [open, focusedIndex, onOpenChange, setFocusedIndex]);
    if (!open)
        return null;
    return (_jsx("div", { ref: contentRef, role: "menu", className: className, onClick: (e) => e.stopPropagation(), children: children }));
}
export function MenuItem({ children, onClick, className }) {
    return (_jsx("button", { role: "menuitem", onClick: onClick, className: className, tabIndex: -1, children: children }));
}
