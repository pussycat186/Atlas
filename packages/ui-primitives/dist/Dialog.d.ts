import { ReactNode } from 'react';
interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    'data-testid'?: string;
}
export declare function Dialog({ isOpen, onClose, title, children, 'data-testid': testId }: DialogProps): import("react/jsx-runtime").JSX.Element;
export {};
