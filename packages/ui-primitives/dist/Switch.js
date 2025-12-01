'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const Switch = forwardRef(({ checked, onCheckedChange, disabled = false, className, ...props }, ref) => {
    return (_jsx("button", { ref: ref, type: "button", role: "switch", "aria-checked": checked, disabled: disabled, onClick: () => !disabled && onCheckedChange(!checked), className: className, ...props, children: _jsx("span", { "aria-hidden": "true" }) }));
});
Switch.displayName = 'Switch';
