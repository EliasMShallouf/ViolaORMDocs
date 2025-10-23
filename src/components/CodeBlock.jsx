import React, { useState, useEffect, useRef, useCallback } from 'react';
import { highlightBlock } from '../utils/highlighter';

const CodeBlock = ({ code, language }) => {
    const codeRef = useRef(null);
    const [isCopied, setIsCopied] = useState(false);

    // Highlight code when component mounts or code changes
    useEffect(() => {
        if (codeRef.current) {
            highlightBlock(codeRef.current, language);
        }
    }, [code, language]);

    // Copy to clipboard using execCommand fallback
    const handleCopy = useCallback(() => {
        const text = codeRef.current.innerText;
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    }, []);

    return (
        <pre className={`language-${language}`}>
            <button onClick={handleCopy} className={`copy-btn ${isCopied ? 'copied' : ''}`}>
                {isCopied ? 'Copied!' : 'Copy'}
            </button>
            <code ref={codeRef}>{code}</code>
        </pre>
    );
};

export default CodeBlock;