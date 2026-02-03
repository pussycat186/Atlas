'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useRef, useEffect } from 'react';
const SelectContext = createContext(null);
export function Select({ value, onValueChange, children }) {
    const [open, setOpen] = React.useState(false);
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    return (_jsx(SelectContext.Provider, { value: {
            open,
            onOpenChange: setOpen,
            value,
            onValueChange,
            focusedIndex,
            setFocusedIndex
        }, children: children }));
}
export function SelectTrigger({ children, className }) {
    const context = useContext(SelectContext);
    if (!context)
        throw new Error('SelectTrigger must be used within Select');
    const { open, onOpenChange } = context;
    return (_jsx("button", { role: "combobox", "aria-expanded": open, "aria-haspopup": "listbox", onClick: () => onOpenChange(!open), className: className, children: children }));
}
export function SelectContent({ children, className }) {
    const context = useContext(SelectContext);
    if (!context)
        throw new Error('SelectContent must be used within Select');
    const { open, onOpenChange, focusedIndex, setFocusedIndex } = context;
    const contentRef = useRef(null);
    useEffect(() => {
        if (open) {
            const handleKeyDown = (e) => {
                const items = contentRef.current?.querySelectorAll('[role="option"]');
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
    return (_jsx("div", { ref: contentRef, role: "listbox", className: className, children: children }));
}
export function SelectItem({ value, children, className }) {
    const context = useContext(SelectContext);
    if (!context)
        throw new Error('SelectItem must be used within Select');
    const { value: selectedValue, onValueChange, onOpenChange } = context;
    return (_jsx("button", { role: "option", "aria-selected": value === selectedValue, onClick: () => {
            onValueChange(value);
            onOpenChange(false);
        }, className: className, tabIndex: -1, children: children }));
}
