import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    'aria-describedby'?: string;
}
export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
export {};
