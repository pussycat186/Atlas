'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const Input = forwardRef(({ error, className, ...props }, ref) => {
    return (_jsx("input", { ref: ref, "aria-invalid": error, className: className, ...props }));
});
Input.displayName = 'Input';
