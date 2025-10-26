import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import TableOfContents from './components/TableOfContents';
import Footer from './components/Footer';
import CodeBlock from './components/CodeBlock';
import ScrollToTopButton from './components/ScrollToTopButton';
import { useInView } from 'react-intersection-observer';
import GeminiAssistant from './components/GeminiAssistant';
import ScrollIndicator from './components/ScrollIndicator';
import CommunitySection from './components/CommunitySection';
import { codeContent } from './utils/codeContent';

// --- Main App Component ---
export default function App() {
    const { ref: heroRef, inView: isHeroVisible } = useInView({ threshold: 0.1 });
    const { ref: footerRef, inView: isFooterVisible } = useInView({ threshold: 0.2 });
    const [activeSection, setActiveSection] = useState('#interoduction');

    // Re-usable smooth scroll logic
    const handleSmoothScroll = useCallback((e, href) => {
        e.preventDefault();
        const targetElement = href === '#' ? document.body : document.querySelector(href);
        if(targetElement) {
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
            window.scrollTo({
                top: href === '#' ? 0 : offsetPosition,
                behavior: "smooth"
            });
            
            if (href !== '#' && history.pushState) {
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
                rootMargin: '-80px 0px -40% 0px',
                threshold: 0.1
            }
        );

        // Track all sections with an 'id'
        const sections = document.querySelectorAll('main [id]');
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
            <ScrollToTopButton 
                isVisible={!isHeroVisible && !isFooterVisible} 
                onClick={(e) => handleSmoothScroll(e, '#')}
            />

            <Header onNavLinkClick={handleSmoothScroll} activeSection={activeSection} isHeroVisible={isHeroVisible} />

            {/* --- Full Page Hero Section --- */}
            <section id="home" ref={heroRef} className="hero-container h-screen min-h-screen flex flex-col justify-center items-center text-center overflow-hidden">
                {/* Blobs for mesh gradient */}
                <div className="hero-blob one"></div>
                <div className="hero-blob two"></div>
                <div className="hero-blob three"></div>
            
                <div className="relative z-10 animate-fade-in-up">
                    <h1 className="hero-text text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
                        Viola ORM
                    </h1>
                    <p className="text-2xl text-slate-300 mb-8">
                        The Modern, Type-Safe Java ORM.
                    </p>
                    <p className="text-lg text-slate-400 mb-10 max-w-3xl mx-auto">
                        Leverage powerful compile-time code generation to build robust, maintainable, and fluent
                        Object-Oriented database queries in Java. Stop writing fragile SQL strings and start building.
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <a href="#getting-started" onClick={(e) => handleSmoothScroll(e, '#getting-started')} className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-semibold text-base px-6 py-2.5 rounded-lg shadow-lg transition-all duration-200">
                            Get Started
                        </a>
                        <a href="https://github.com/EliasMShallouf/ViolaORM/releases" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-slate-600 hover:bg-slate-800 text-slate-300 font-medium text-base px-6 py-2.5 rounded-lg shadow-lg transition-all duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Download
                        </a>
                    </div>
                    <br/>
                    <a href="https://github.com/EliasMShallouf/ViolaORM" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 hover:text-violet-400 font-medium text-base px-6 py-2.5 rounded-lg transition-all duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                        GitHub
                    </a>
                </div>

                {/* Scroll Down Indicator */}
                <ScrollIndicator onClick={(e) => handleSmoothScroll(e, '#introduction')} href="#introduction" />
            </section>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col-reverse lg:flex-row">
                    {/* Main documentation content */}
                    <main className="lg:w-3/4 lg:pr-12 xl:pr-24 pt-12 lg:pt-16">
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
                               as a singleton bean in a Spring application, as seen in the <code>App.java</code> file.</p>
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
                            <p className="mb-4">Let's look at a "before and after" based on the <code>Employee</code> entity.</p>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="min-w-0">
                                    <h4 className="text-lg font-semibold text-slate-300 mb-2">Before: <code className="text-violet-300">Employee.java</code></h4>
                                    <CodeBlock code={codeContent.employeeEntity} language="java" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-lg font-semibold text-slate-300 mb-2">After: <code className="text-violet-300">EmployeeTable.java</code> (Generated)</h4>
                                    <CodeBlock code={codeContent.employeeTable} language="java" />
                                </div>
                            </div>
                            
                            <h3 className="!mt-8">Handling Composite IDs</h3>
                            <p className="mb-4">Viola seamlessly handles composite primary keys. If you annotate multiple fields with <code>@Id</code>,
                               the processor will generate an inner <code>...TableId</code> class that implements <code>MultiFieldId</code>
                               and configure the <code>MultiFieldIDColumn</code> automatically.
                            </p>
                            <p className="mb-4">See how the <code>Hello.java</code> entity class multi part id will be handled and the generated <code>HelloTable.java</code> for a perfect example:</p>
                            <CodeBlock code={codeContent.helloEntity} language="java" />
                            <br />
                            <CodeBlock code={codeContent.helloTable} language="java" />

                        </section>
                        
                        <section id="core-concepts" className="mb-16 scroll-mt-20">
                            <h2>Core Concepts</h2>
                            <p className="mb-4">The <code>orm-core</code> provides the runtime and fluent API for interacting with your database.
                               You will primarily use the generated <code>...Table</code> classes to perform queries.</p>
        
                            <SectionH3 id="core-concepts-crud">EntityManager & CRUD</SectionH3>
                            <p className="mb-4">The <code>EntityManager</code> is your main entry point for database operations. You get one
                               from your generated table class.</p>
                            <CodeBlock code={codeContent.crud} language="java" />

                            <SectionH3 id="core-concepts-query">The Fluent Query Builder</SectionH3>
                            <p className="mb-4">This is the most powerful part of Viola. You build complex, type-safe SQL queries using
                               a fluent Java API. You access this by calling <code>manager.query()</code>. The main class that enables this magic to happens is (<code>SelectQuery</code>).</p>

                            <h4 className="text-lg font-semibold text-slate-300 mt-6 mb-2">Example 1: Simple <code>WHERE</code> Clause</h4>
                            <p className="mb-4">From the <code>EmployeeService</code>, finding an employee by full name. Notice the use
                               of <code>Concat</code> and <code>valueOf</code>.</p>
                            <CodeBlock code={codeContent.whereClause} language="java" />

                            <h4 className="text-lg font-semibold text-slate-300 mt-6 mb-2">Example 2: Joins, Aggregates & Group By</h4>
                            <p className="mb-4">From the <code>CustomerService.getCustomersWithTotals()</code>. This query joins three tables,
                               calculates a sum with arithmetic, groups the results, and orders them.</p>
                            <CodeBlock code={codeContent.joins} language="java" />

                            <h4 className="text-lg font-semibold text-slate-300 mt-6 mb-2">Example 3: Subqueries</h4>
                            <p className="mb-4">From the <code>SalesOrderService</code>. This query builds a complete <code>SubQuery</code> object
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

                            <h3 className="!mt-8">Download Full Java Example</h3>
                            <p className="mb-4">
                                To see all these concepts in action, you can download a complete Java project. This example application demonstrates advanced use-cases and best practices for Viola ORM, including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 mt-4 pl-2 mb-6">
                                <li>A suite of 11 complex queries from an MSc thesis, showcasing joins, subqueries, and aggregations.</li>
                                <li>Handling entities with composite primary keys.</li>
                                <li>Defining entities programmatically without using the annotation processor.</li>
                                <li>Implementing pagination for large result sets.</li>
                                <li>Constructing fluent <code>UPDATE</code> queries with custom logic using <code>CASE...WHEN</code> statements.</li>
                                <li>Managing database transactions for data integrity.</li>
                                <li>Fetching query results into flexible formats like <code>Map&lt;String, Object&gt;</code> and <code>Object[]</code>.</li>
                            </ul>
                            <a href="https://github.com/EliasMShallouf/ViolaORMJavaExample" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-base px-6 py-2.5 rounded-lg shadow-lg transition-all duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Download Example Project
                            </a>
                        </section>
                    </main>

                    {/* Right-side Table of Contents */}
                    <TableOfContents onNavLinkClick={handleSmoothScroll} activeSection={activeSection} />
                </div>

                <CommunitySection />
            </div>

            <Footer ref={footerRef}/>
        </>
    );
}