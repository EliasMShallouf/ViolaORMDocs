import React from 'react';

const TableOfContents = ({ onNavLinkClick, activeSection }) => {
    const tocLinks = [
        { href: "#introduction", label: "What is Viola ORM?" },
        { href: "#gemini-playground", label: "✨ Viola AI Assistant" },
        { href: "#getting-started", label: "Getting Started" },
        { href: "#processor", label: "Annotation Processor" },
        { href: "#core-concepts", label: "Core Concepts" },
        { href: "#core-concepts-crud", label: "EntityManager & CRUD", isSublink: true },
        { href: "#core-concepts-query", label: "Fluent Query Builder", isSublink: true },
        { href: "#core-concepts-transactions", label: "Transactions", isSublink: true },
        { href: "#api", label: "API Reference" }
    ];

    return (
        <aside className="hidden lg:block lg:w-1/4 lg:pl-8">
            <nav id="toc" className="sticky top-20 pt-16 h-screen overflow-y-auto">
                <h4 className="text-slate-100 font-semibold mb-4 text-sm">On this page</h4>
                <ul className="space-y-2 border-l border-slate-700">
                    {tocLinks.map(link => (
                        <li key={link.href}>
                            <a href={link.href} onClick={(e) => onNavLinkClick(e, link.href)} className={`toc-link block text-sm text-slate-400 hover:text-violet-300 ${activeSection === link.href ? 'active' : ''} ${link.isSublink ? 'pl-8' : 'pl-4'}`}>
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default TableOfContents;