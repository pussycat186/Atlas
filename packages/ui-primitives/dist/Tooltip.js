'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useRef, useEffect } from 'react';
const TooltipContext = createContext(null);
export function Tooltip({ children, delayDuration = 700 }) {
    const [open, setOpen] = React.useState(false);
    const timeoutRef = useRef();
    const onOpenChange = (newOpen) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (newOpen) {
            timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
        }
        else {
            setOpen(false);
        }
    };
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    return (_jsx(TooltipContext.Provider, { value: { open, onOpenChange }, children: children }));
}
export function TooltipTrigger({ children, asChild }) {
    const context = useContext(TooltipContext);
    if (!context)
        throw new Error('TooltipTrigger must be used within Tooltip');
    const { onOpenChange } = context;
    const handleMouseEnter = () => onOpenChange(true);
    const handleMouseLeave = () => onOpenChange(false);
    const handleFocus = () => onOpenChange(true);
    const handleBlur = () => onOpenChange(false);
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            onFocus: handleFocus,
            onBlur: handleBlur,
        });
    }
    return (_jsx("button", { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, onFocus: handleFocus, onBlur: handleBlur, children: children }));
}
export function TooltipContent({ children, className }) {
    const context = useContext(TooltipContext);
    if (!context)
        throw new Error('TooltipContent must be used within Tooltip');
    const { open } = context;
    if (!open)
        return null;
    return (_jsx("div", { role: "tooltip", className: className, children: children }));
}
