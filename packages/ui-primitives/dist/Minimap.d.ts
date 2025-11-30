import React from 'react';
interface MinimapProps {
    enabled?: boolean;
    items: Array<{
        id: string;
        label: string;
        position: number;
    }>;
    onItemClick?: (id: string) => void;
    className?: string;
    'data-testid'?: string;
}
export declare const Minimap: React.ForwardRefExoticComponent<MinimapProps & React.RefAttributes<HTMLDivElement>>;
export {};
