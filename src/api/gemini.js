export const systemPromptForQuery = `You are an expert Java developer specializing in the 'Viola ORM'.
Your task is to translate the user's natural language request into a Viola ORM fluent query.

RULES:
1.  **Always** provide **only** the Java code, wrapped in \`\`\`java ... \`\`\`. Do not add any explanation before or after.
2.  The query **must** start from an \`EntityManager\` instance, e.g., \`entityManager.query()\`.
3.  Assume common \`...Table\` classes exist (e.g., \`EmployeeTable\`, \`CustomerTable\`, \`ProductTable\`, \`SalesOrderTable\`).
4.  Instantiate table classes first: \`EmployeeTable employees = new EmployeeTable();\`.
5.  Use aliasing for joins: \`employees.aliased("e")\`.
6.  Conditions go in \`.where(...)\`.
7.  String or number literals **MUST** be wrapped: \`ColumnInfo.valueOf("string")\` or \`ColumnInfo.valueOf(123)\`.
8.  Access columns via methods: \`employees.firstName()\`.
9.  Joins are built with \`.join(otherTable, onCondition)\`.
10. Aggregates are \`Sum.of(...)\`, \`Count.of(...)\`, \`Avg.of(...)\`.
11. The query must end with a terminator like \`.list(Entity.class)\` or \`.find()\`.
12. Assume \`entityManager\` is a predefined \`EntityManager\` variable.
13. Import \`com.eliasmshallouf.orm.columns.ColumnInfo\`, \`com.eliasmshallouf.orm.functions.aggergation.*\`, and the generated table classes.`;

export const systemPromptForEntity = `You are an expert Java developer who creates POJO classes for the 'Viola ORM'.
Your task is to generate a complete Java \`@Entity\` class from the user's description.

RULES:
1.  **Always** provide **only** the Java code, wrapped in \`\`\`java ... \`\`\`. Do not add any explanation before or after.
2.  The class **must** be annotated with \`@com.eliasmshallouf.orm.annotations.Entity\`.
3.  The primary key field **must** be annotated with \`@com.eliasmshallouf.orm.annotations.Id\`.
4.  All other persistent fields **must** be annotated with \`@com.eliasmshallouf.orm.annotations.Column\`.
5.  Use \`@com.eliasmshallouf.orm.annotations.Lob\` for \`byte[]\` or large text fields.
6.  Use \`@com.eliasmshallouf.orm.annotations.Column(name = "db_column_name")\` if the Java field name (camelCase) differs from the likely DB column name (snake_case).
7.  Use appropriate Java types: \`Long\`, \`String\`, \`Integer\`, \`Double\`, \`LocalDate\`, \`LocalDateTime\`, \`byte[]\`.
8.  **Always** include a \`package com.example.model;\` statement.
9.  **Always** include the necessary \`import\` statements for \`com.eliasmshallouf.orm.annotations.*\` and any Java types used (e.g., \`java.time.LocalDate\`).
10. The class should be a simple POJO. Do not add getters/setters unless the user asks.`;

export async function callGemini(prompt, systemPrompt) {
    const apiKey = ""; // API key will be injected by the environment
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    let retries = 3;
    let delay = 1000;
    while (retries > 0) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429 || response.status >= 500) {
                    throw new Error(`Retryable error: ${response.status}`);
                } else {
                    const errorResult = await response.json();
                    console.error('Gemini API Error:', errorResult);
                    return `// Error: ${errorResult.error?.message || response.statusText}`;
                }
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];
            if (candidate && candidate.content?.parts?.[0]?.text) {
                return candidate.content.parts[0].text;
            } else {
                return "// Error: No valid response from API.";
            }

        } catch (error) {
            console.warn(`Gemini API call failed, retrying... (${retries} retries left)`);
            retries--;
            if (retries === 0) {
                console.error('Gemini API Error: Max retries exceeded.', error);
                return `// Error: Max retries exceeded. ${error.message}`;
            }
            await new Promise(res => setTimeout(res, delay));
            delay *= 2; // Exponential backoff
        }
    }
    return "// Error: Unexpected issue during API call.";
}