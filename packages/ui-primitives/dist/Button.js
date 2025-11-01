'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const Button = forwardRef(({ variant = 'primary', size = 'md', loading = false, disabled, children, className, ...props }, ref) => {
    return (_jsxs("button", { ref: ref, disabled: disabled || loading, "aria-disabled": disabled || loading, className: className, ...props, children: [loading && _jsx("span", { "aria-hidden": "true", children: "Loading..." }), children] }));
});
Button.displayName = 'Button';
