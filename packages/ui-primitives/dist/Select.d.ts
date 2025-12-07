import React from 'react';
interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
}
export declare function Select({ value, onValueChange, children }: SelectProps): import("react/jsx-runtime").JSX.Element;
interface SelectTriggerProps {
    children: React.ReactNode;
    className?: string;
}
export declare function SelectTrigger({ children, className }: SelectTriggerProps): import("react/jsx-runtime").JSX.Element;
interface SelectContentProps {
    children: React.ReactNode;
    className?: string;
}
export declare function SelectContent({ children, className }: SelectContentProps): import("react/jsx-runtime").JSX.Element;
interface SelectItemProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}
export declare function SelectItem({ value, children, className }: SelectItemProps): import("react/jsx-runtime").JSX.Element;
export {};
