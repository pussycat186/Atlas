import React from 'react';
interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    orientation?: 'horizontal' | 'vertical';
    children: React.ReactNode;
}
export declare function Tabs({ value, onValueChange, orientation, children }: TabsProps): import("react/jsx-runtime").JSX.Element;
interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}
export declare function TabsList({ children, className }: TabsListProps): import("react/jsx-runtime").JSX.Element;
interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}
export declare function TabsTrigger({ value, children, className }: TabsTriggerProps): import("react/jsx-runtime").JSX.Element;
interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}
export declare function TabsContent({ value, children, className }: TabsContentProps): import("react/jsx-runtime").JSX.Element;
export {};
