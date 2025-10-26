import React, { useState } from 'react';

const Header = ({ onNavLinkClick, activeSection, isHeroVisible }) => {
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
        <header className={`
            fixed top-4 z-50 w-fit justify-self-center
            transition-all duration-500 border ${isHeroVisible ? 'border-slate-800' : 'border-slate-700/80'} ${isMobileMenuOpen ? 'rounded-2xl' : 'rounded-[32px]'} backdrop-blur-2xl
            overflow-hidden
            ${isHeroVisible ? 'bg-slate-900/20' : 'bg-slate-900/50'}
        `}>
            <nav className="px-6 sm:px-8">
                <div className="flex justify-between items-center h-16 md:gap-40 gap-24">
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
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isHeroVisible ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
                            <a href="#" onClick={(e) => handleLinkClick(e, '#')} className="text-white text-2xl font-bold whitespace-nowrap">
                                Viola ORM
                            </a>
                        </div>
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button id="mobile-menu-button" className="text-slate-300 hover:text-white focus:outline-none bg-transparent" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:items-center md:space-x-8">
                        {navLinks.map(link => (
                            <a key={link.href} href={link.href} onClick={(e) => handleLinkClick(e, link.href)} className={`nav-link text-slate-300 hover:text-white font-medium ${activeSection.startsWith(link.href) ? 'active' : ''}`}>
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </nav>
 
            {/* Mobile Menu (Hidden by default) */}
            <div
                id="mobile-menu"
                className={`md:hidden overflow-hidden transition-all ease-in-out duration-300 ${
                    isMobileMenuOpen ? 'max-h-96' : 'max-h-0'
                }`}
            >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navLinks.map(link => (
                        <a key={link.href} href={link.href} onClick={(e) => handleLinkClick(e, link.href)} className={`nav-link text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium ${activeSection.startsWith(link.href) ? 'active' : ''}`}>
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>
        </header>
    );
};

export default Header;