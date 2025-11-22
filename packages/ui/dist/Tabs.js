'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export default function Tabs({ activeTab, setActiveTab, sku, theme, density, luxury, children }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: `border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`, children: _jsx("div", { className: "container mx-auto px-4", children: _jsx("div", { className: "flex", role: "tablist", children: ['messenger', 'admin', 'dev'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), role: "tab", "aria-selected": activeTab === tab, "aria-controls": `${tab}-panel`, className: `px-6 py-3 font-medium capitalize transition-colors ${activeTab === tab
                                ? `border-b-2 ${sku === 'pro' ? 'border-purple-500 text-purple-400' : 'border-blue-500 text-blue-400'}`
                                : 'text-gray-500 hover:text-gray-300'}`, children: tab === 'dev' ? 'Dev Portal' : tab }, tab))) }) }) }), _jsx("div", { className: "container mx-auto px-4 py-8", children: _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: luxury ? 0.5 : 0.2 }, className: `rounded-2xl p-6 backdrop-blur-sm border ${theme === 'dark'
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-white/50 border-gray-200'} ${density ? 'min-h-[400px]' : 'min-h-[600px]'}`, role: "tabpanel", id: `${activeTab}-panel`, children: children }, activeTab) })] }));
}
