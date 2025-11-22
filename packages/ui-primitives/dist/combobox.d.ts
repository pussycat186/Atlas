interface ComboboxProps {
    options: string[];
    placeholder?: string;
    onSelect?: (value: string) => void;
    'data-testid'?: string;
}
export declare function Combobox({ options, placeholder, onSelect, 'data-testid': testId }: ComboboxProps): import("react/jsx-runtime").JSX.Element;
export {};
