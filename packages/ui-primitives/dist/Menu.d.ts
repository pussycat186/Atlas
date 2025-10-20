import React from 'react';
interface MenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}
export declare function Menu({ open, onOpenChange, children }: MenuProps): import("react/jsx-runtime").JSX.Element;
interface MenuContentProps {
    children: React.ReactNode;
    className?: string;
}
export declare function MenuContent({ children, className }: MenuContentProps): import("react/jsx-runtime").JSX.Element;
interface MenuItemProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}
export declare function MenuItem({ children, onClick, className }: MenuItemProps): import("react/jsx-runtime").JSX.Element;
export {};
