import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export function VisuallyHidden({ children, asChild = false }) {
    const style = {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
    };
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            style: { ...style, ...children.props.style }
        });
    }
    return _jsx("span", { style: style, children: children });
}
