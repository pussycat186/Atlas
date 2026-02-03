import { ReactNode } from 'react';
interface TabsProps {
    activeTab: 'messenger' | 'admin' | 'dev';
    setActiveTab: (tab: 'messenger' | 'admin' | 'dev') => void;
    sku: 'basic' | 'pro';
    theme: 'dark' | 'light';
    density: boolean;
    luxury: boolean;
    children: ReactNode;
}
export default function Tabs({ activeTab, setActiveTab, sku, theme, density, luxury, children }: TabsProps): import("react/jsx-runtime").JSX.Element;
export {};
