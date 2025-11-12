interface AtlasMinimapProps {
    items: Array<{
        id: string;
        label: string;
        active?: boolean;
    }>;
    onItemClick?: (id: string) => void;
    className?: string;
}
export declare function AtlasMinimap({ items, onItemClick, className }: AtlasMinimapProps): import("react/jsx-runtime").JSX.Element;
export {};
