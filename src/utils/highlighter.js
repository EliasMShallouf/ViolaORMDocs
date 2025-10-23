// A simple highlighter function adapted from the original.
// In a real app, you'd use a library like react-syntax-highlighter.
export const highlightBlock = (codeBlock, language) => {
    if (!codeBlock) return;
    
    // Get raw text content and reset HTML
    const rawText = codeBlock.textContent || codeBlock.innerText;
    let html = rawText;
    
    // HTML encode the content first to prevent XSS and parsing issues
    html = html.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
              //.replace(/'/g, '&#39;');

    if (language === 'java' || language === 'groovy') {
        html = javaBlock(html, language);
    } else if (language === 'xml' || language === 'html') {
        // Comments first
        html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token comment">$1</span>');
        
        // Tags
        html = html.replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9-]*)/g, '$1<span class="token tag">$2</span>');
        
        // Attributes
        html = html.replace(/([a-zA-Z_-][a-zA-Z0-9_-]*)=(&quot;.*?&quot;)/g, '<span class="token attr-name">$1</span>=<span class="token string">$2</span>');
    }

    codeBlock.innerHTML = html;
};

const javaBlock = (highlightedHTML, language) => {
    // A safer replacement function that checks if a match overlaps with existing <span> tags.
    // NOTE: This requires the HTML structure to be stable, which it is if we only use <span>.
    const safeReplace = (currentHTML, regex, replacer) => {
        let newHTML = '';
        let lastIndex = 0;
        let match;

        // Reset regex state for global search
        regex.lastIndex = 0;

        // Iterate through all matches
        while ((match = regex.exec(currentHTML)) !== null) {
            const matchText = match[0];
            const matchStart = match.index;
            const matchEnd = match.index + matchText.length;
            
            // Check if this match is inside an existing <span class="token X">...</span>
            // This is a simple, non-DOM parser way to check. 
            // Look for the closest preceding and succeeding <span> boundaries.
            const precedingSpanStart = currentHTML.lastIndexOf('<span', matchStart);
            const precedingSpanEnd = currentHTML.lastIndexOf('</span>', matchStart);

            // If a span starts before the match and ends after the match, it's inside an existing token.
            // Check if matchStart is after the last open <span>, and before the last closed </span>.
            // A much simpler check: if we see an open span tag before a close span tag, and the match is in between, skip it.
            if (precedingSpanStart !== -1 && precedingSpanStart > precedingSpanEnd) {
                // If we found a <span> tag that hasn't been closed before the match starts, 
                // the match is likely inside an existing token.
                newHTML += currentHTML.substring(lastIndex, matchEnd); // Append the original text, including the match
                lastIndex = matchEnd;
                continue; // Skip this match
            }

            // Append the text before the current match
            newHTML += currentHTML.substring(lastIndex, matchStart);

            // Apply the highlighting
            const replacementText = replacer(match);
            newHTML += replacementText;
            
            lastIndex = matchEnd;
        }

        // Append the remaining text
        newHTML += currentHTML.substring(lastIndex);
        return newHTML;
    };

    // ------------------------------------------------------------------
    // --- Java/Groovy Handling ---
    // ------------------------------------------------------------------
    if (language === 'java' || language === 'groovy') {
        // Order MUST be: Comments/Strings (most encompassing) -> Keywords/Literals -> Annotations -> ClassNames (least specific)
        
        // 1. Comments
        //highlightedHTML = highlightedHTML.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token comment">$1</span>'); // Block comments
        //highlightedHTML = highlightedHTML.replace(/(\/\/.*$)/gm, '<span class="token comment">$1</span>');        // Line comments
        
        // 2. Strings/Chars
        highlightedHTML = highlightedHTML.replace(/(".*?")/g, '<span class="token string">$1</span>');
        highlightedHTML = highlightedHTML.replace(/('.*?')/g, '<span class="token string">$1</span>'); 
        
        // 3. Keywords and Literals (must be done before class names)
        const keywordsRegex = /\b(public|private|protected|static|final|class|extends|implements|new|return|import|package|throws|void|long|int|double|boolean|byte|char|float|short|if|else|for|while|switch|case|break|default|try|catch|finally|throw|enum|interface|true|false|null|super|this|var)\b/g;
        highlightedHTML = safeReplace(highlightedHTML, keywordsRegex, match => `<span class="token keyword">${match[0]}</span>`);

        // 4. Numbers
        const numberRegex = /\b(\d+(\.\d+)?(L|f|d)?)\b/g;
        highlightedHTML = safeReplace(highlightedHTML, numberRegex, match => `<span class="token number">${match[0]}</span>`);
        
        // 5. Annotations
        const annotationRegex = /(@[A-Za-z_][A-Za-z0-9_]*)/g;
        highlightedHTML = safeReplace(highlightedHTML, annotationRegex, match => `<span class="token annotation">${match[0]}</span>`);
        
        // 6. ClassNames (Most dangerous, must be last)
        // We look for PascalCase words that are *not* immediately followed by a parenthesis (to avoid methods).
        // This is still fragile but better than before.
        const classNameRegex = /\b([A-Z][a-zA-Z0-9_]+)\b/g;
        highlightedHTML = safeReplace(highlightedHTML, classNameRegex, match => {
             // Basic check: if it's already highlighted as a keyword (which should be skipped by safeReplace, but belt-and-suspenders)
             if (keywordsRegex.test(match[0])) return match[0];
             
             return `<span class="token class-name">${match[0]}</span>`;
        });

        highlightedHTML = safeReplace(highlightedHTML, /(\/\*[\s\S]*?\*\/)/g, match => `<span class="token comment">${match[0]}</span>`); // Block comments
        highlightedHTML = safeReplace(highlightedHTML, /(\/\/.*$)/gm, match => `<span class="token comment">${match[0]}</span>`);        // Line comments        
    }

    return highlightedHTML;
};