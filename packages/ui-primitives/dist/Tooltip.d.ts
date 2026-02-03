import React from 'react';
interface TooltipProps {
    children: React.ReactNode;
    delayDuration?: number;
}
export declare function Tooltip({ children, delayDuration }: TooltipProps): import("react/jsx-runtime").JSX.Element;
interface TooltipTriggerProps {
    children: React.ReactNode;
    asChild?: boolean;
}
export declare function TooltipTrigger({ children, asChild }: TooltipTriggerProps): import("react/jsx-runtime").JSX.Element;
interface TooltipContentProps {
    children: React.ReactNode;
    className?: string;
}
export declare function TooltipContent({ children, className }: TooltipContentProps): import("react/jsx-runtime").JSX.Element;
export {};
