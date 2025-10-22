import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css'

// --- Code Highlighter ---
// A simple highlighter function adapted from the original.
// In a real app, you'd use a library like react-syntax-highlighter.
const highlightBlock = (codeBlock, language) => {
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

// --- Gemini API Call Logic ---
// (This is the same function from the previous version)
const systemPromptForQuery = `You are an expert Java developer specializing in the 'Viola ORM'.
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

const systemPromptForEntity = `You are an expert Java developer who creates POJO classes for the 'Viola ORM'.
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

async function callGemini(prompt, systemPrompt) {
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


// --- Static Content ---
// Storing large code blocks here to keep JSX clean
const codeContent = {
    maven: `<!-- pom.xml -->
<dependencies>
    <!-- The core runtime library -->
    <dependency>
        <groupId>com.eliasmshallouf</groupId>
        <artifactId>orm-core</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.8.1</version>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
                <annotationProcessorPaths>
                    <path>
                        <groupId>com.eliasmshallouf</groupId>
                        <artifactId>annotation-processor</artifactId>
                        <version>1.0.0</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>`,
    gradle: `// build.gradle
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies {
    // The core runtime library
    implementation 'com.eliasmshallouf:orm-core:1.0.0'
    
    // The compile-time annotation processor
    annotationProcessor 'com.eliasmshallouf:annotation-processor:1.0.0'
}`,
    config: `// In your Spring @Configuration or @SpringBootApplication class
import com.eliasmshallouf.orm.ConnectionManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@Bean
public ConnectionManager createConnectionManager(
    @Value("$\{spring.datasource.driver-class-name}") String driver,
    @Value("$\{spring.datasource.url}") String url,
    @Value("$\{spring.datasource.username}") String user,
    @Value("$\{spring.datasource.password}") String password
) {
    // You can also set a logger here, e.g., ConnectionManager.setLogger(Logger.defaultLogger);
    return new ConnectionManager(driver, url, user, password);
}`,
    entity: `// From com.eliasshallouf.msc.seminar4.domain.model.helpers.User.java
package com.example.model;

import com.eliasmshallouf.orm.annotations.Column;
import com.eliasmshallouf.orm.annotations.Entity;
import com.eliasmshallouf.orm.annotations.Id;

@Entity
public class User {
    @Id 
    private long id;
    
    @Column 
    private String name;
    
    @Column 
    private String email;
    
    // Getters and setters...
}`,
    employeeEntity: `package com.example.model;
import com.eliasmshallouf.orm.annotations.*;
import java.io.Serializable;
import java.util.Date;

@Entity
public class Employee implements Serializable {
    @Id 
    Long employeeId;
    
    @Column(name = "lastname") 
    String lastName;
    
    @Column(name = "firstname") 
    String firstName;
    
    @Column 
    String title;
    
    @Column 
    Date hireDate;
    
    @Lob 
    byte[] photo;
    
    // ... other fields ...
}`,
    employeeTable: `package com.example.model.orm;

import com.example.model.Employee;
import com.eliasmshallouf.orm.table.EntityModel;
import com.eliasmshallouf.orm.table.TableColumns;
import com.eliasmshallouf.orm.columns.*;
import java.time.LocalDateTime;

public class EmployeeTable extends EntityModel<Employee, Long> {
	
    public static class Columns extends TableColumns<Employee> {
		public final NumericColumn<Long> employeeId = new NumericColumn<>(this, "employeeId");
		public final TextColumn lastName = new TextColumn(this, "lastname");
		public final TextColumn firstName = new TextColumn(this, "firstname");
		public final DateColumn<LocalDateTime> hireDate = new DateColumn<>(this, "hireDate");
		public final BlobColumn photo = new BlobColumn(this, "photo");
		// ...
		public Columns(EmployeeTable model) { super(model); }
	}

    private final Columns columns = new Columns(this);

    public EmployeeTable() {
        super(Employee.class, "Employee");
        setIdField(employeeId().id());
    }

    @Override
    public Columns columns() { return columns; }

	public NumericColumn<Long> employeeId() { return columns.employeeId; }
	public TextColumn lastName() { return columns.lastName; }
	public TextColumn firstName() { return columns.firstName; }
	public DateColumn<LocalDateTime> hireDate() { return columns.hireDate; }
	public BlobColumn photo() { return columns.photo; }
	// ...
}`,
    helloTable: `// From generated.txt: com.eliasshallouf.msc.seminar4.domain.model.helpers.orm.HelloTable.java

public class HelloTable extends EntityModel<Hello, HelloTable.HelloTableId> {
	
    // 1. Generated inner class for the composite ID
	public static class HelloTableId implements MultiFieldId<Hello> {
		public String a;
		public Integer b;

        // ... constructors and 'values()' method ...
	}

	public static class Columns extends TableColumns<Hello> {
		public final TextColumn a = new TextColumn(this, "a");
		public final NumericColumn<Integer> b = new NumericColumn<>(this, "b");
        // ...
	}

    // ...

    public HelloTable() {
        super(Hello.class, "Hello");
        
        // 2. Automatically sets up the MultiFieldIDColumn
        setIdField(new MultiFieldIDColumn<Hello, HelloTableId>(this, a(), b())
            .withMainClassOf(HelloTableId.class));
    }
    
    // ... accessors for a() and b() ...
}`,
    crud: `// Get the generated table instance
EmployeeTable employeeTable = new EmployeeTable();

// Get an EntityManager bound to your ConnectionManager
// (Assuming 'connectionManager' is your configured bean)
EntityManager<Employee, Long> employeeManager = employeeTable.manager(connectionManager);

// --- CRUD Operations ---

// CREATE
Employee newEmployee = new Employee();
newEmployee.setFirstName("Jane");
newEmployee.setLastName("Doe");
employeeManager.save(newEmployee);

// READ (By Id)
Employee foundEmployee = employeeManager.findById(1L);

// READ (All)
List<Employee> allEmployees = employeeManager.getAll();

// UPDATE
foundEmployee.setTitle("Senior Developer");
employeeManager.update(foundEmployee);

// DELETE (By Id)
employeeManager.deleteById(1L);

// DELETE (By Condition)
employeeManager.delete(employeeTable.firstName().equal(ColumnInfo.valueOf("Jane")));`,
    whereClause: `// SQL: SELECT * FROM employee WHERE concat(firstname, ' ', lastname) = 'Sven Buck'
EmployeeTable table = new EmployeeTable();
String fullName = "Sven Buck";

Employee employee = entityManager
    .query() // Returns a SelectQuery
    .where(
        Concat.of(
            table.firstName(),
            ColumnInfo.valueOf(" "),
            table.lastName()
        ).equal(ColumnInfo.valueOf(fullName))
    ).find();`,
    joins: `/*
    SQL:
    SELECT c.contactName as name, sum(od.unitPrice * od.quantity * (1 - od.discount)) as total
    FROM customer c
    JOIN salesorder so ON cast(so.custId as integer) = c.custId
    JOIN orderdetail od ON od.orderId = so.orderId
    GROUP BY c.custId
    ORDER BY total DESC;
*/

// 1. Alias tables for cleaner queries
CustomerTable c = new CustomerTable().aliased("c");
SalesOrderTable so = new SalesOrderTable().aliased("so");
OrderDetailTable od = new OrderDetailTable().aliased("od");

// 2. Define the 'total' aggregation column
var total = Sum.of(
    od.unitPrice().multiple(
        od.quantity().castTo(Double.class).multiple(
            ColumnInfo.valueOf(1).asNumber().subtract(od.discount())
        )
    )
).as("total");

// 3. Build the query
List<CustomerWithTotal> results = entityManager.query()
    .table(c) // FROM customer c
    .join(so, c.custId().equal(so.custId())) // JOIN salesorder so ...
    .join(od, od.orderId().equal(so.orderId())) // JOIN orderdetail od ...
    .select(
        c.contactName().as("name"), // SELECT c.contactName as name
        total                      // , sum(...) as total
    )
    .groupBy(c.custId()) // GROUP BY c.custId
    .orderBy(total.descendingOrder()) // ORDER BY total DESC
    .list(CustomerWithTotal.class); // Map results to a DTO`,
    subqueries: `// Aliases
SalesOrderTable so = new SalesOrderTable().aliased("so");
OrderDetailTable od = new OrderDetailTable().aliased("od");

// Total calculation
Sum<Double> total = Sum.of(/* ... */).as("total");

// 1. Define the subquery
var subQuery =
    new SubQuery<SalesOrder>()
        .table(so)
        .select(
            so.allColumns(), // Selects all columns from SalesOrder
            total
        )
        .join(od, od.orderId().equal(so.orderId()))
        .groupBy(so.orderId())
        .orderBy(total.descendingOrder())
        .aliased("a"); // This subquery becomes "a"

// 2. Select FROM the subquery
List<SalesOrder> orders = entityManager
    .query()
    .table(subQuery) // FROM (subquery) a
    .select(subQuery.allColumns()) // SELECT a.*
    .where(total.between(ColumnInfo.valueOf(5000.0), ColumnInfo.valueOf(12000.0))) // WHERE a.total BETWEEN ...
    .list();`,
    transactions: `// From App.java
manager.transaction((con, tr) -> {
    System.out.println("Deleted " +
        modelManager
            .withConnection(con) // Use the special transactional connection
            .delete(ip.equal(ColumnInfo.valueOf(ipToDelete)))
        + " rows"
    );

    // Rollback the changes
    return TransactionResult.ROLLBACK;
    
    // Or commit them:
    // return TransactionResult.COMMIT;
});`
};

// --- Reusable CodeBlock Component ---
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
            <button
                onClick={handleCopy}
                className={`copy-btn ${isCopied ? 'copied' : ''}`}
            >
                {isCopied ? 'Copied!' : 'Copy'}
            </button>
            <code ref={codeRef}>{code}</code>
        </pre>
    );
};

// --- Gemini AI Assistant Component ---
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
                    <button
                        className={`tab-btn ${mode === 'query' ? 'active' : ''}`}
                        onClick={() => setMode('query')}
                    >
                        Natural Language to Query
                    </button>
                    <button
                        className={`tab-btn ${mode === 'entity' ? 'active' : ''}`}
                        onClick={() => setMode('entity')}
                    >
                        Natural Language to Entity
                    </button>
                </div>

                {/* Input */}
                <div className="mb-4">
                    <textarea
                        id="gemini-prompt"
                        className="gemini-textarea"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                            mode === 'query'
                                ? "e.g., 'Find all employees named Jane in the Sales department hired after 2020'"
                                : "e.g., 'A blog post entity with id, title, string content, and author name'"
                        }
                    ></textarea>
                </div>

                {/* Button */}
                <div className="mb-4">
                    <button
                        id="gemini-generate-btn"
                        className="gemini-btn"
                        onClick={handleGenerate}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Generating...' : 'Generate Code'}
                    </button>
                </div>

                {/* Output */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Generated Code</label>
                    <div id="gemini-output-wrapper" className="gemini-output">
                        {isLoading && <div id="gemini-loader" className="loader"></div>}
                        <pre id="gemini-output-pre" className={`!m-0 !p-0 ${isLoading ? 'hidden' : ''}`}>
                            <code id="gemini-output-code" ref={outputRef} className="language-java block !p-5 !bg-transparent">
                                {output}
                            </code>
                        </pre>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Header Component ---
const Header = ({ onNavLinkClick, activeSection }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: "#introduction", label: "Introduction" },
        { href: "#getting-started", label: "Getting Started" },
        { href: "#processor", label: "Annotation Processor" },
        { href: "#core-concepts", label: "Core Concepts" },
        { href: "#api", label: "API" }
    ];

    const handleLinkClick = (e, href) => {
        onNavLinkClick(e, href);
        setIsMobileMenuOpen(false); // Close mobile menu on click
    };

    return (
        <header className="bg-0B1120/80 backdrop-blur-md sticky top-0 z-50 w-full border-b border-slate-800">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Project Name */}
                    <div className="flex-shrink-0 flex items-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                            <path d="M4 4L10 20L12 12L20 4L4 4Z" fill="url(#grad1)"/>
                            <path opacity="0.7" d="M12 12L10 20L16 16L12 12Z" fill="url(#grad2)"/>
                            <defs>
                                <linearGradient id="grad1" x1="4" y1="4" x2="20" y2="4" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#C4B5FD"/>
                                    <stop offset="1" stopColor="#A78BFA"/>
                                </linearGradient>
                                <linearGradient id="grad2" x1="10" y1="20" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#D8B4FE"/>
                                    <stop offset="1" stopColor="#C4B5FD"/>
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="text-white text-2xl font-bold">Viola ORM</span>
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button id="mobile-menu-button" className="text-slate-300 hover:text-white focus:outline-none" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:items-center md:space-x-8">
                        {navLinks.map(link => (
                            <a 
                                key={link.href}
                                href={link.href}
                                onClick={(e) => handleLinkClick(e, link.href)}
                                className={`nav-link text-slate-300 hover:text-white font-medium ${activeSection === link.href ? 'active' : ''}`}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu (Hidden by default) */}
            <div id="mobile-menu" className={`md:hidden ${isMobileMenuOpen ? '' : 'hidden'} bg-slate-900`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navLinks.map(link => (
                        <a 
                            key={link.href}
                            href={link.href}
                            onClick={(e) => handleLinkClick(e, link.href)}
                            className={`nav-link text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium ${activeSection === link.href ? 'active' : ''}`}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>
        </header>
    );
};

// --- Table of Contents Component ---
const TableOfContents = ({ onNavLinkClick, activeSection }) => {
    const tocLinks = [
        { href: "#introduction", label: "What is Viola ORM?" },
        { href: "#gemini-playground", label: "✨ Viola AI Assistant" },
        { href: "#getting-started", label: "Getting Started" },
        { href: "#processor", label: "Annotation Processor" },
        { href: "#core-concepts", label: "Core Concepts", sublinks: [
            { href: "#core-concepts-crud", label: "EntityManager & CRUD" }, // Note: Need to add this ID
            { href: "#core-concepts-query", label: "Fluent Query Builder" }, // Note: Need to add this ID
            { href: "#core-concepts-transactions", label: "Transactions" } // Note: Need to add this ID
        ]},
        { href: "#api", label: "API Reference" }
    ];

    return (
        <aside className="hidden lg:block lg:w-1/4 lg:pl-8">
            <nav id="toc" className="sticky top-20 pt-16 h-screen overflow-y-auto">
                <h4 className="text-slate-100 font-semibold mb-4 text-sm">On this page</h4>
                <ul className="space-y-2 border-l border-slate-700">
                    {tocLinks.map(link => (
                        <li key={link.href}>
                            <a 
                                href={link.href}
                                onClick={(e) => onNavLinkClick(e, link.href)}
                                className={`toc-link block pl-4 text-sm text-slate-400 hover:text-violet-300 ${activeSection === link.href ? 'active' : ''}`}
                            >
                                {link.label}
                            </a>
                            {link.sublinks && (
                                <ul className="space-y-2 pt-2">
                                    {link.sublinks.map(sublink => (
                                         <li key={sublink.href}>
                                            <a 
                                                href={sublink.href}
                                                onClick={(e) => onNavLinkClick(e, sublink.href)}
                                                className={`toc-link block pl-8 text-sm text-slate-400 hover:text-violet-300 ${activeSection === sublink.href ? 'active' : ''}`}
                                            >
                                                {sublink.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

// --- Main App Component ---
export default function App() {
    const [activeSection, setActiveSection] = useState('#home');
    const sectionRefs = useRef(new Map());

    // Re-usable smooth scroll logic
    const handleSmoothScroll = useCallback((e, href) => {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if(targetElement) {
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            
            if (history.pushState) {
                history.pushState(null, null, href);
            } else {
                location.hash = href;
            }
        }
    }, []);

    // Scrollspy logic
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                let currentActiveId = null;
                // Find the first visible section
                for (const entry of entries) {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
                        currentActiveId = `#${entry.target.id}`;
                        break;
                    }
                }

                // If no section is clearly visible, check for the last one that passed the top edge
                if (!currentActiveId) {
                    const lastVisible = Array.from(entries).reverse().find(e => e.boundingClientRect.top <= window.innerHeight / 2);
                    if (lastVisible) {
                        currentActiveId = `#${lastVisible.target.id}`;
                    }
                }
                
                if (currentActiveId) {
                    setActiveSection(currentActiveId);
                }
            },
            { 
                rootMargin: '-80px 0px -50% 0px',
                threshold: 0.1
            }
        );

        // Track all sections with an 'id'
        const sections = document.querySelectorAll('main > section[id]');
        sections.forEach(section => {
            observer.observe(section);
        });

        // Cleanup
        return () => {
            sections.forEach(section => {
                observer.unobserve(section);
            });
        };
    }, []);

    // Helper to add IDs to sub-sections for better scrollspy
    const SectionH3 = ({ id, children }) => (
        <h3 id={id} className="!mt-8 scroll-mt-24">
            {children}
        </h3>
    );


    return (
        <>
            <Header onNavLinkClick={handleSmoothScroll} activeSection={activeSection} />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col-reverse lg:flex-row">
                    
                    {/* Main documentation content */}
                    <main className="lg:w-3/4 lg:pr-12 xl:pr-24 py-12 lg:py-16">
                        
                        <section id="home" className="mb-16 scroll-mt-20">
                            <h1 className="hero-text text-5xl md:text-6xl font-extrabold tracking-tighter mb-6">
                                Viola ORM
                            </h1>
                            <p className="text-2xl text-slate-300 mb-8">
                                The Modern, Type-Safe Java ORM.
                            </p>
                            <p className="text-lg text-slate-400 mb-10 max-w-3xl">
                                Leverage powerful compile-time code generation to build robust, maintainable, and fluent
                                Object-Oriented database queries in Java. Stop writing fragile SQL strings and start building.
                            </p>
                            <a href="#getting-started" onClick={(e) => handleSmoothScroll(e, '#getting-started')} className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-semibold text-lg px-8 py-3 rounded-lg shadow-lg transition-all duration-200">
                                Get Started
                            </a>
                        </section>

                        <section id="introduction" className="mb-16 scroll-mt-20">
                            <h2>What is Viola ORM?</h2>
                            <p className="mb-4">
                                Viola ORM is a lightweight and powerful Object-Relational Mapper for Java designed around two core principles:
                                <strong>compile-time safety</strong> and a <strong>fluent query-building API</strong>. It bridges the gap between your Java objects and your relational database
                                by generating type-safe query classes at compile time.
                            </p>
                            <p>This approach eliminates an entire class of runtime errors, provides excellent IDE auto-completion, and keeps your
                               database logic clean, readable, and fully object-oriented.</p>
                            
                            <h3 className="!mt-8">Two-Part Architecture</h3>
                            <p>Viola is split into two main components that work together:</p>
                            <ul className="list-disc list-inside space-y-3 mt-4 pl-2">
                                <li>
                                    <strong><code className="text-violet-300">orm-core</code>:</strong> This is the runtime library. It contains all the core logic for database connections
                                    (<code>ConnectionManager</code>), query execution (<code>EntityManager</code>), and the classes that form the fluent API
                                    (<code>SelectQuery</code>, <code>ColumnInfo</code>, <code>NumericColumn</code>, etc.).
                                </li>
                                <li>
                                    <strong><code className="text-violet-300">annotation-processor</code>:</strong> This is the compile-time tool. It's a Java Annotation Processor
                                    that scans your code for <code>@Entity</code> annotations. For each entity, it generates a
                                    corresponding <code>...Table</code> class that integrates directly with the <code>orm-core</code>.
                                </li>
                            </ul>
                        </section>
                        
                        {/* Gemini Assistant Component Rendered Here */}
                        <GeminiAssistant />
                        
                        <section id="getting-started" className="mb-16 scroll-mt-20">
                            <h2>Getting Started</h2>
                            
                            <h3>1. Installation</h3>
                            <p className="mb-4">To use Viola ORM, you need to add both the <code>orm-core</code> library as a dependency and the
                               <code>annotation-processor</code> as an annotation processor in your build system.</p>
                            
                            <h4 className="text-lg font-semibold text-slate-300 mt-6 mb-2">Maven</h4>
                            <CodeBlock code={codeContent.maven} language="xml" />

                            <h4 className="text-lg font-semibold text-slate-300 mt-6 mb-2">Gradle</h4>
                            <CodeBlock code={codeContent.gradle} language="groovy" />

                            <h3>2. Configuration (Spring Boot Example)</h3>
                            <p className="mb-4">Viola is configured by instantiating a <code>ConnectionManager</code>. It's designed to be used
                               as a singleton bean in a Spring application, as seen in your <code>App.java</code> file.</p>
                            <CodeBlock code={codeContent.config} language="java" />

                            <h3>3. Your First Entity</h3>
                            <p className="mb-4">Create a simple POJO (Plain Old Java Object) and annotate it with <code>@Entity</code> and <code>@Id</code>.
                               The annotation processor will detect this and generate the necessary query class.</p>
                            <CodeBlock code={codeContent.entity} language="java" />
                            <p className="mt-4">After compiling your project, Viola ORM will generate a new class, <code>UserTable.java</code>, in the specified package.</p>
                        </section>

                        <section id="processor" className="mb-16 scroll-mt-20">
                            <h2>Annotation Processor</h2>
                            <p className="mb-4">
                                The <code>annotation-processor</code> is the magic behind Viola ORM. It scans your codebase for annotated classes and
                                generates <code>...Table</code> classes, which are type-safe representations of your database tables.
                            </p>
                            
                            <h3>Core Annotations</h3>
                            <ul className="list-none space-y-4 mt-4">
                                <li>
                                    <code>@Entity</code>
                                    <p>Marks a class as a database entity. The processor will generate a table class for it.
                                    You can provide a table name, e.g., <code>@Entity(name = "customers")</code>. If omitted, the class name is used.</p>
                                </li>
                                <li>
                                    <code>@Id</code>
                                    <p>Marks a field as the primary key for the entity. You can have multiple <code>@Id</code> annotations
                                       to define a composite primary key.</p>
                                </li>
                                <li>
                                    <code>@Column</code>
                                    <p>Marks a field as a database column. Use <code>@Column(name = "first_name")</code> to map a field
                                       <code>firstName</code> to a different column name.</p>
                                </li>
                                <li>
                                    <code>@Lob</code>
                                    <p>Marks a field as a Large Object (BLOB/CLOB). This tells the ORM to use the <code>BlobColumn</code>
                                       type and handle it as a byte array or stream.</p>
                                </li>
                            </ul>

                            <h3>Generated Code Explained</h3>
                            <p className="mb-4">Let's look at a "before and after" based on your <code>Employee</code> entity.</p>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-300 mb-2">Before: <code className="text-violet-300">Employee.java</code></h4>
                                    <CodeBlock code={codeContent.employeeEntity} language="java" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-300 mb-2">After: <code className="text-violet-300">EmployeeTable.java</code> (Generated)</h4>
                                    <CodeBlock code={codeContent.employeeTable} language="java" />
                                </div>
                            </div>
                            
                            <h3 className="!mt-8">Handling Composite IDs</h3>
                            <p className="mb-4">Viola seamlessly handles composite primary keys. If you annotate multiple fields with <code>@Id</code>,
                               the processor will generate an inner <code>...TableId</code> class that implements <code>MultiFieldId</code>
                               and configure the <code>MultiFieldIDColumn</code> automatically.
                            </p>
                            <p className="mb-4">See your <code>Hello.java</code> entity and the generated <code>HelloTable.java</code> for a perfect example:</p>
                            <CodeBlock code={codeContent.helloTable} language="java" />

                        </section>
                        
                        <section id="core-concepts" className="mb-16 scroll-mt-20">
                            <h2>Core Concepts (orm-core)</h2>
                            <p className="mb-4">The <code>orm-core</code> provides the runtime and fluent API for interacting with your database.
                               You will primarily use the generated <code>...Table</code> classes to perform queries.</p>

                            <SectionH3 id="core-concepts-crud">EntityManager & CRUD</SectionH3>
                            <p className="mb-4">The <code>EntityManager</code> is your main entry point for database operations. You get one
                               from your generated table class.</p>
                            <CodeBlock code={codeContent.crud} language="java" />

                            <SectionH3 id="core-concepts-query">The Fluent Query Builder (<code>SelectQuery</code>)</SectionH3>
                            <p className="mb-4">This is the most powerful part of Viola. You build complex, type-safe SQL queries using
                               a fluent Java API. You access this by calling <code>manager.query()</code>.</p>

                            <h4 className="text-lg font-semibold text-slate-300 mt-6 mb-2">Example 1: Simple <code>WHERE</code> Clause</h4>
                            <p className="mb-4">From your <code>EmployeeService</code>, finding an employee by full name. Notice the use
                               of <code>Concat</code> and <code>valueOf</code>.</p>
                            <CodeBlock code={codeContent.whereClause} language="java" />

                            <h4 className="text-lg font-semibold text-slate-300 mt-6 mb-2">Example 2: Joins, Aggregates & Group By</h4>
                            <p className="mb-4">From your <code>CustomerService.getCustomersWithTotals()</code>. This query joins three tables,
                               calculates a sum with arithmetic, groups the results, and orders them.</p>
                            <CodeBlock code={codeContent.joins} language="java" />

                            <h4 className="text-lg font-semibold text-slate-300 mt-6 mb-2">Example 3: Subqueries</h4>
                            <p className="mb-4">From your <code>SalesOrderService</code>. This query builds a complete <code>SubQuery</code> object
                               (which is also an <code>EntityModel</code>) and then selects from it in the outer query.</p>
                            <CodeBlock code={codeContent.subqueries} language="java" />

                            <SectionH3 id="core-concepts-transactions">Transactions</SectionH3>
                            <p className="mb-4">Viola supports transactions via the <code>ConnectionManager</code>. It provides a clean,
                               functional interface for transactional work. The connection manager forks a new connection
                               for the transaction and handles commit/rollback based on the <code>TransactionResult</code>.</p>
                            <CodeBlock code={codeContent.transactions} language="java" />
                        </section>

                        <section id="api" className="mb-16 scroll-mt-20">
                            <h2>API Reference</h2>
                            <p className="mb-4">A brief overview of the most important classes in the <code>orm-core</code>.</p>
                            
                            <h3 className="!mt-6">Main Classes</h3>
                            <ul className="list-none space-y-4">
                                <li>
                                    <code>ConnectionManager</code>
                                    <p>Manages the JDBC connection, dialect detection, and transaction control.
                                       Typically used as a singleton.</p>
                                </li>
                                <li>
                                    <code>EntityManager&lt;E, Id&gt;</code>
                                    <p>The primary interface for database operations (CRUD, queries).
                                       You get this from an <code>EntityModel</code> instance via <code>.manager(conn)</code>.</p>
                                </li>
                                <li>
                                    <code>EntityModel&lt;T, Id&gt;</code>
                                    <p>The base class for all generated <code>...Table</code> classes. It represents a
                                       table and holds its metadata.</p>
                                </li>
                                <li>
                                    <code>SelectQuery&lt;T&gt;</code>
                                    <p>The fluent query builder object. Returned by <code>entityManager.query()</code>.
                                       You chain methods like <code>.join()</code>, <code>.where()</code>, <code>.select()</code>, etc.</p>
                                </li>
                                <li>
                                    <code>SubQuery&lt;T&gt;</code>
                                    <p>A special type of <code>EntityModel</code> that is built from a <code>SelectQuery</code>,
                                       allowing you to use subqueries in the <code>FROM</code> clause.</p>
                                </li>
                            </ul>

                            <h3 className="!mt-8">Column Classes</h3>
                            <ul className="list-none space-y-4">
                                <li>
                                    <code>ColumnInfo&lt;E&gt;</code>
                                    <p>The base class for all column types. Provides common methods like <code>.equal()</code>,
                                       <code>.isNotNull()</code>, <code>.in()</code>, <code>.as()</code> (alias), and <code>.ascendingOrder()</code>.</p>
                                </li>
                                <li>
                                    <code>NumericColumn&lt;N&gt;</code>
                                    <p>Extends <code>ColumnInfo</code> for number types. Adds methods like <code>.add()</code>, <code>.subtract()</code>,
                                       <code>.multiple()</code>, <code>.divide()</code>, <code>.biggerThan()</code>, and <code>.between()</code>.</p>
                                </li>
                                <li>
                                    <code>TextColumn</code>
                                    <p>Extends <code>ColumnInfo</code> for <code>String</code> types. Adds <code>.like()</code>, <code>.startsWith()</code>,
                                       and <code>.endsWith()</code>.</p>
                                </li>
                                <li>
                                    <code>DateColumn&lt;D&gt;</code>
                                    <p>Extends <code>ColumnInfo</code> for temporal types. Adds <code>.before()</code>, <code>.after()</code>,
                                       and <code>.between()</code>.</p>
                                </li>
                                <li>
                                    <code>BlobColumn</code>
                                    <p>Extends <code>ColumnInfo</code> for <code>byte[]</code> types. Used for LOBs.</p>
                                </li>
                                <li>
                                    <code>ColumnInfo.valueOf(E e)</code>
                                    <p>A static helper to wrap a Java literal (like a <code>String</code>, <code>Integer</code>, or <code>Date</code>)
                                       into a <code>ColumnInfo</code> so it can be used in queries.</p>
                                </li>
                            </ul>
                        </section>

                    </main>

                    {/* Right-side Table of Contents */}
                    <TableOfContents onNavLinkClick={handleSmoothScroll} activeSection={activeSection} />
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-800 mt-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-500 text-sm">
                    <p>&copy; 2025 Viola ORM. All rights reserved.</p>
                    <p className="mt-1">Documentation template designed by Viola.</p>
                </div>
            </footer>

            {/* Global Styles from <style> tag */}
            <style jsx global>{`
                /* Custom styles */
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: #0B1120; /* A very dark blue */
                    color: #CBD5E1; /* slate-300 */
                }

                /* Syntax highlighting-like colors for code blocks */
                pre[class*="language-"] {
                    background: #011627; /* A dark, slightly blue background */
                    border: 1px solid #1E293B; /* slate-800 */
                    border-radius: 0.5rem; /* rounded-lg */
                    padding: 1.25rem; /* p-5 */
                    overflow-x: auto;
                    position: relative;
                }

                code[class*="language-"] {
                    font-family: 'Fira Code', 'Courier New', monospace;
                    font-size: 0.875rem; /* text-sm */
                    line-height: 1.625;
                }

                /* Basic syntax colors */
                .token.comment,
                .token.prolog,
                .token.doctype,
                .token.cdata {
                    color: #637777; /* Grayish */
                }
                .token.punctuation {
                    color: #89DDFF; /* Light blue */
                }
                .token.property,
                .token.tag,
                .token.boolean,
                .token.number,
                .token.constant,
                .token.symbol,
                .token.deleted {
                    color: #FF8B50; /* Orange */
                }
                .token.selector,
                .token.attr-name,
                .token.string,
                .token.char,
                .token.builtin,
                .token.inserted {
                    color: #A6E22E; /* Green */
                }
                .token.operator,
                .token.entity,
                .token.url,
                .language-css .token.string,
                .style .token.string {
                    color: #F8F8F2; /* Off-white */
                }
                .token.atrule,
                .token.attr-value,
                .token.keyword {
                    color: #80BFFF; /* Bright blue */
                }
                .token.function,
                .token.class-name {
                    color: #FFD700; /* Gold */
                }
                .token.regex,
                .token.important,
                .token.variable {
                    color: #E6DB74; /* Yellowish */
                }
                .token.annotation {
                    color: #66D9EF; /* Cyan */
                }

                /* Custom scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: #0B1120;
                }
                ::-webkit-scrollbar-thumb {
                    background-color: #4A5568; /* gray-600 */
                    border-radius: 20px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background-color: #718096; /* gray-500 */
                }

                /* Active link styles for nav and ToC */
                .nav-link.active, .toc-link.active {
                    color: #A78BFA; /* violet-400 */
                    font-weight: 600;
                }
                .nav-link {
                    transition: all 0.2s ease-in-out;
                }
                .nav-link:hover {
                    color: #C4B5FD; /* violet-300 */
                }

                /* Gradient hero text */
                .hero-text {
                    background: linear-gradient(to right, #EDE9FE, #A78BFA, #D8B4FE);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                /* Section heading styles */
                h2 {
                    font-size: 2.25rem; /* text-4xl */
                    font-weight: 800;
                    letter-spacing: -0.025em; /* tracking-tight */
                    color: #F1F5F9; /* slate-100 */
                    margin-bottom: 1.5rem; /* mb-6 */
                    border-bottom: 1px solid #334155; /* slate-700 */
                    padding-bottom: 0.75rem; /* pb-3 */
                }
                h3 {
                    font-size: 1.5rem; /* text-2xl */
                    font-weight: 700;
                    color: #E2E8F0; /* slate-200 */
                    margin-top: 2.5rem; /* mt-10 */
                    margin-bottom: 1rem; /* mb-4 */
                }
                p, li {
                    font-size: 1rem; /* text-base */
                    line-height: 1.75; /* leading-7 */
                    color: #94A3B8; /* slate-400 */
                }
                a {
                    color: #A78BFA; /* violet-400 */
                    font-weight: 500;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                a:hover {
                    color: #C4B5FD; /* violet-300 */
                    text-decoration: underline;
                }
                code {
                    background-color: #1E293B; /* slate-800 */
                    color: #E2E8F0; /* slate-200 */
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-family: 'Fira Code', monospace;
                    font-size: 0.875rem;
                }

                /* Copy button for code blocks */
                .copy-btn {
                    position: absolute;
                    top: 0.75rem;
                    right: 0.75rem;
                    background-color: #334155; /* slate-700 */
                    color: #CBD5E1; /* slate-300 */
                    border: none;
                    padding: 0.375rem 0.625rem;
                    border-radius: 0.375rem; /* rounded-md */
                    font-size: 0.75rem; /* text-xs */
                    font-weight: 600;
                    cursor: pointer;
                    opacity: 0.5;
                    transition: all 0.2s ease;
                }
                pre:hover .copy-btn {
                    opacity: 1;
                }
                .copy-btn:hover {
                    background-color: #475569; /* slate-600 */
                }
                .copy-btn:active {
                    background-color: #52525B; /* zinc-600 */
                }
                .copy-btn.copied {
                    background-color: #16A34A; /* green-600 */
                    color: white;
                }

                /* --- New Gemini AI Assistant Styles --- */
                .tab-btn {
                    background-color: #1E293B; /* slate-800 */
                    color: #94A3B8; /* slate-400 */
                    border: 1px solid #334155; /* slate-700 */
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem; /* rounded-md */
                    font-weight: 600;
                    transition: all 0.2s ease;
                }
                .tab-btn.active {
                    background-color: #A78BFA; /* violet-400 */
                    color: #0B1120; /* dark bg */
                    border-color: #A78BFA;
                }
                .gemini-textarea {
                    background-color: #011627;
                    border: 1px solid #1E293B;
                    border-radius: 0.5rem;
                    color: #CBD5E1;
                    padding: 0.75rem 1rem;
                    width: 100%;
                    min-height: 80px;
                    font-family: 'Fira Code', monospace;
                    font-size: 0.875rem;
                }
                .gemini-textarea:focus {
                    outline: none;
                    border-color: #A78BFA;
                    box-shadow: 0 0 0 2px #A78BFA40;
                }
                .gemini-btn {
                    background-color: #7C3AED; /* violet-600 */
                    color: white;
                    font-weight: 600;
                    padding: 0.625rem 1.25rem;
                    border-radius: 0.375rem;
                    transition: background-color 0.2s ease;
                }
                .gemini-btn:hover {
                    background-color: #6D28D9; /* violet-700 */
                }
                .gemini-btn:disabled {
                    background-color: #334155;
                    color: #64748B;
                    cursor: not-allowed;
                }
                .gemini-output {
                    background: #011627;
                    border: 1px solid #1E293B;
                    border-radius: 0.5rem;
                    min-height: 150px;
                    position: relative;
                }
                .loader {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #334155; /* slate-700 */
                    border-top-color: #A78BFA; /* violet-400 */
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    margin-top: -20px;
                    margin-left: -20px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}