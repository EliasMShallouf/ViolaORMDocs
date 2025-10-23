import React, { useState, useEffect, useRef } from 'react';
import { callGemini, systemPromptForQuery, systemPromptForEntity } from '../api/gemini';
import { highlightBlock } from '../utils/highlighter';

const GeminiAssistant = () => {
    const [mode, setMode] = useState('query'); // 'query' or 'entity'
    const [prompt, setPrompt] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const outputRef = useRef(null);

    const handleGenerate = async () => {
        if (!prompt) return;

        setIsLoading(true);
        setOutput(''); // Clear previous output
        
        const systemPrompt = (mode === 'query') ? systemPromptForQuery : systemPromptForEntity;
        let resultText = await callGemini(prompt, systemPrompt);

        // Clean up the response (remove markdown backticks)
        resultText = resultText.replace(/^```java\n?/, '');
        resultText = resultText.replace(/\n?```$/, '');
        
        setOutput(resultText.trim());
        setIsLoading(false);
    };

    // Highlight the output when it changes
    useEffect(() => {
        if (outputRef.current) {
            highlightBlock(outputRef.current, 'java');
        }
    }, [output]);

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
                    <div id="gemini-output-wrapper" className="gemini-output">
                        {isLoading && <div id="gemini-loader" className="loader"></div>}
                        <pre id="gemini-output-pre" className={`!m-0 !p-0 ${isLoading ? 'hidden' : ''}`}>
                            <code id="gemini-output-code" ref={outputRef} className="language-java block !p-5 !bg-transparent">{output}</code>
                        </pre>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GeminiAssistant;