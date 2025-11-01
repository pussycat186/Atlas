'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useRef } from 'react';
const TabsContext = createContext(null);
export function Tabs({ value, onValueChange, orientation = 'horizontal', children }) {
    return (_jsx(TabsContext.Provider, { value: { activeTab: value, setActiveTab: onValueChange, orientation }, children: children }));
}
export function TabsList({ children, className }) {
    const context = useContext(TabsContext);
    if (!context)
        throw new Error('TabsList must be used within Tabs');
    const { orientation } = context;
    const listRef = useRef(null);
    const handleKeyDown = (event) => {
        const tabs = listRef.current?.querySelectorAll('[role="tab"]');
        if (!tabs)
            return;
        const currentIndex = Array.from(tabs).findIndex(tab => tab === event.target);
        let nextIndex = currentIndex;
        const isHorizontal = orientation === 'horizontal';
        switch (event.key) {
            case isHorizontal ? 'ArrowRight' : 'ArrowDown':
                nextIndex = (currentIndex + 1) % tabs.length;
                break;
            case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = tabs.length - 1;
                break;
            default:
                return;
        }
        event.preventDefault();
        tabs[nextIndex]?.focus();
    };
    return (_jsx("div", { ref: listRef, role: "tablist", "aria-orientation": orientation, onKeyDown: handleKeyDown, className: className, children: children }));
}
export function TabsTrigger({ value, children, className }) {
    const context = useContext(TabsContext);
    if (!context)
        throw new Error('TabsTrigger must be used within Tabs');
    const { activeTab, setActiveTab } = context;
    const isSelected = activeTab === value;
    return (_jsx("button", { role: "tab", "aria-selected": isSelected, "aria-controls": `panel-${value}`, id: `tab-${value}`, tabIndex: isSelected ? 0 : -1, onClick: () => setActiveTab(value), className: className, children: children }));
}
export function TabsContent({ value, children, className }) {
    const context = useContext(TabsContext);
    if (!context)
        throw new Error('TabsContent must be used within Tabs');
    const { activeTab } = context;
    const isActive = activeTab === value;
    if (!isActive)
        return null;
    return (_jsx("div", { role: "tabpanel", id: `panel-${value}`, "aria-labelledby": `tab-${value}`, tabIndex: 0, className: className, children: children }));
}
