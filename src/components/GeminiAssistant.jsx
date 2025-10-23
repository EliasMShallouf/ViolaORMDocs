import React, { useState, useEffect, useRef } from 'react';
import { callGemini, systemPromptForQuery, systemPromptForEntity } from '../api/gemini';
import { highlightBlock } from '../utils/highlighter';

const GeminiAssistant = () => {
    const [mode, setMode] = useState('query'); // 'query' or 'entity'
    const [prompt, setPrompt] = useState('');
    const [generatedClasses, setGeneratedClasses] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const outputRef = useRef(null);

    const parseJavaClasses = (rawCode) => {
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

    const handleGenerate = async () => {
        if (!prompt) return;

        setIsLoading(true);
        setGeneratedClasses([]); // Clear previous output
        
        const systemPrompt = (mode === 'query') ? systemPromptForQuery : systemPromptForEntity;
        let resultText = await callGemini(prompt, systemPrompt);

        // Clean up the response (remove markdown backticks)
        resultText = resultText.replace(/```java\n?|```/g, '').trim();
        
        setGeneratedClasses(parseJavaClasses(resultText));
        setActiveTab(0);
        setIsLoading(false);
    };

    // Highlight the output when it changes
    useEffect(() => {
        if (outputRef.current && generatedClasses.length > 0) {
            highlightBlock(outputRef.current, 'java');
        }
    }, [generatedClasses, activeTab]);

    return (
        <section id="gemini-playground" className="mb-16 scroll-mt-20">
            <h2>✨ Viola AI Assistant</h2>
            <p className="mb-6">
                Need help getting started? Use our AI assistant to translate your plain English
                into Viola ORM code. You can generate fluent queries or even entire
                <code>@Entity</code> classes.
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                {/* Tabs */}
                <div className="flex space-x-2 mb-4">
                    <button className={`tab-btn ${mode === 'query' ? 'active' : ''}`} onClick={() => setMode('query')}>
                        Natural Language to Query
                    </button>
                    <button className={`tab-btn ${mode === 'entity' ? 'active' : ''}`} onClick={() => setMode('entity')}>
                        Natural Language to Entity
                    </button>
                </div>

                {/* Input */}
                <div className="mb-4">
                    <textarea id="gemini-prompt" className="gemini-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={
                            mode === 'query'
                                ? "e.g., 'Find all employees named Jane in the Sales department hired after 2020'"
                                : "e.g., 'A blog post entity with id, title, string content, and author name'"
                        }
                    ></textarea>
                </div>

                {/* Button */}
                <div className="mb-4">
                    <button id="gemini-generate-btn" className="gemini-btn" onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? 'Generating...' : 'Generate Code'}
                    </button>
                </div>

                {/* Output */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Generated Code</label>
                    <div id="gemini-output-wrapper" className="gemini-output relative">
                        {isLoading && <div id="gemini-loader" className="loader"></div>}
                        <div className={`${isLoading || generatedClasses.length === 0 ? 'hidden' : ''}`}>
                            {/* Tabs for multiple classes */}
                            {mode === 'entity' && generatedClasses.length > 1 && (
                                <div className="flex space-x-1 bg-slate-800/50 border-b border-slate-700 px-5 py-3 gap-3">
                                    {generatedClasses.map((cls, index) => (
                                        <button
                                            key={index}
                                            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                                                activeTab === index
                                                    ? 'bg-slate-900 text-violet-300'
                                                    : 'text-slate-400 hover:bg-slate-700/50 bg-slate-800/50'
                                            }`}
                                            onClick={() => setActiveTab(index)}
                                        >
                                            {cls.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <pre id="gemini-output-pre" className="!m-0 !p-0 !bg-transparent !border-0">
                                <code id="gemini-output-code" ref={outputRef} className="language-java block !p-5 !bg-transparent">{generatedClasses[activeTab]?.code || ''}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GeminiAssistant;