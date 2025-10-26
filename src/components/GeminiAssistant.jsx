import React, { useState, useEffect, useRef } from 'react';
import { callGemini, systemPromptForQuery, systemPromptForEntity } from '../api/gemini';
import { highlightBlock } from '../utils/highlighter';

const CopyButton = ({ textToCopy }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-3 right-3 bg-slate-700/50 hover:bg-slate-600/80 text-slate-300 text-xs font-mono px-2 py-1 rounded-md transition-all"
            aria-label="Copy code to clipboard"
        >
            {isCopied ? 'Copied!' : 'Copy'}
        </button>
    );
};

const GeminiAssistant = () => {
    const [activeMode, setActiveMode] = useState('query'); // 'query' or 'entity'
    const [modes, setModes] = useState({
        query: { prompt: '', generatedCode: [], activeTab: 0 },
        entity: { prompt: '', generatedCode: [], activeTab: 0 }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const outputRef = useRef(null);

    const parseJavaClasses = (rawCode) => {
        if (!rawCode) return [];
        // Split the raw code by the 'package' keyword, keeping the delimiter
        const codeBlocks = rawCode.split(/(?=package\s)/).filter(block => block.trim() !== '');
        
        if (codeBlocks.length === 0 && rawCode.trim()) {
            // Fallback for single, non-standard class definitions without a package
            return [{ name: 'Class.java', code: rawCode.trim() }];
        }

        return codeBlocks.map(block => {
            const trimmedBlock = block.trim();
            // Regex to find the class name
            const classNameMatch = trimmedBlock.match(/(?:public\s+)?class\s+([A-Z][\w]*)/);
            
            if (classNameMatch && classNameMatch[1]) {
                return {
                    name: `${classNameMatch[1]}.java`,
                    code: trimmedBlock
                };
            }

            // Fallback if no class name is found in the block
            return { name: 'Untitled.java', code: trimmedBlock };
        });
    };

    const handlePromptChange = (e) => {
        const newPrompt = e.target.value;
        setModes(prevModes => ({
            ...prevModes,
            [activeMode]: {
                ...prevModes[activeMode],
                prompt: newPrompt
            }
        }));
    };

    const handleGenerate = async () => {
        const currentPrompt = modes[activeMode].prompt;
        if (!currentPrompt) return;

        setIsLoading(true);
        setError(null);
        try {
            const systemPrompt = (activeMode === 'query') ? systemPromptForQuery : systemPromptForEntity;
            let resultText = await callGemini(currentPrompt, systemPrompt);

            // Clean up the response (remove markdown backticks)
            resultText = resultText.replace(/```java\n?|```/g, '').trim();
            
            const parsedClasses = parseJavaClasses(resultText);
            setModes(prev => ({
                ...prev,
                [activeMode]: { ...prev[activeMode], generatedCode: parsedClasses, activeTab: 0 }
            }));
        } catch (err) {
            setError('An error occurred while generating the code. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Highlight the output when it changes
    useEffect(() => {
        if (outputRef.current && modes[activeMode].generatedCode.length > 0) {
            highlightBlock(outputRef.current, 'java');
        }
    }, [modes, activeMode]);

    const currentCode = modes[activeMode].generatedCode[modes[activeMode].activeTab]?.code || '';

    return (
        <section id="gemini-playground" className="mb-16 scroll-mt-20">
            <h2>✨ Viola AI Assistant</h2>
            <p className="mb-8 text-slate-400">
                Need help getting started? Use our AI assistant to translate your plain English
                into Viola ORM code. You can generate fluent queries or even entire
                <code>@Entity</code> classes.
            </p>

            <div className="space-y-4">
                {/* --- Input Section --- */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
                    {/* Mode Selector */}
                    <div className="flex items-start justify-start mb-4">
                        <div className="flex w-full max-w-md gap-2 p-0">
                            <button className={`flex-1 px-0 py-2 h-fit flex gap-2 items-center justify-center tab-btn ${activeMode === 'query' ? 'bg-slate-600 hover:bg-slate-800 text-slate-200' : 'bg-slate-800 hover:bg-slate-600 text-slate-400'} border rounded-xl border-slate-800`} onClick={() => setActiveMode('query')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                <span>Text to Query</span>
                            </button>
                            <button className={`flex-1 px-0 py-2 h-fit flex gap-2 items-center justify-center tab-btn ${activeMode === 'entity' ? 'bg-slate-600 hover:bg-slate-800 text-slate-200' : 'bg-slate-800 hover:bg-slate-600 text-slate-400'} border rounded-xl border-slate-800`} onClick={() => setActiveMode('entity')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                <span>Text to Entity</span>
                            </button>
                        </div>
                    </div>

                    {/* Prompt Textarea */}
                    <div className="mb-2">
                        <textarea 
                            id="gemini-prompt" 
                            className="gemini-textarea" 
                            value={modes[activeMode].prompt} 
                            onChange={handlePromptChange} 
                            placeholder={
                                activeMode === 'query'
                                    ? "e.g., 'Find all employees in the Sales department hired after 2020'"
                                    : "e.g., 'A blog post entity with id, title, string content, and author name'"
                            }
                        ></textarea>
                    </div>

                    {/* Generate Button */}
                    <div className="text-start">
                        <button id="gemini-generate-btn" className="bg-slate-700 hover:bg-slate-600 text-slate-200 w-full md:w-auto" onClick={handleGenerate} disabled={isLoading}>
                            {isLoading ? 'Generating...' : '✨ Generate Code'}
                        </button>
                    </div>
                </div>

                {/* --- Output Section --- */}
                <div className={`${isLoading || error || modes[activeMode].generatedCode.length === 0 ? 'hidden' : ''}`}>
                    <div id="gemini-output-wrapper" className="gemini-output relative">
                        {error && <div className="p-4 text-center text-red-400">{error}</div>}
                        
                        <div className={`${error ? 'hidden' : ''}`}>
                            {/* Tabs for multiple classes */}
                            {activeMode === 'entity' && modes[activeMode].generatedCode.length > 1 && (
                                <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-700 dark:text-gray-400">
                                    {modes[activeMode].generatedCode.map((cls, index) => (
                                        <li key={index} className="me-2">
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setModes(prev => ({
                                                        ...prev,
                                                        [activeMode]: { ...prev[activeMode], activeTab: index }
                                                    }));
                                                }}
                                                aria-current={modes[activeMode].activeTab === index ? "page" : undefined}
                                                className={`inline-block p-4 rounded-t-lg ${
                                                    modes[activeMode].activeTab === index
                                                        ? 'text-gray-300 bg-gray-800 active'
                                                        : 'hover:text-gray-300 hover:bg-gray-800/50 text-gray-500'
                                                }`}
                                            >
                                                {cls.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="relative">
                                <CopyButton textToCopy={currentCode} />
                                <pre id="gemini-output-pre" className="!m-0 !p-0 !bg-transparent !border-0">
                                    <code id="gemini-output-code" ref={outputRef} className="language-java block !p-5 !bg-transparent">{currentCode}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GeminiAssistant;