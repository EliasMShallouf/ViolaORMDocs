import React from 'react';
import avatar from '../assets/avatar.png';

const socialLinks = [
    {
        name: 'LinkedIn',
        href: 'https://www.linkedin.com/in/elias-shallouf/',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
        )
    },
    {
        name: 'GitHub',
        href: 'https://github.com/Elias-Shallouf',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
        )
    },
    {
        name: 'Gmail',
        href: 'mailto:elias.shallouf@gmail.com',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        )
    },
    {
        name: 'WhatsApp',
        href: 'https://wa.me/963935537635',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        )
    },
    {
        name: 'Dribbble',
        href: 'https://dribbble.com/Elias_Shallouf',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 4.66-13.84 2.3"></path><path d="M17.58 3.96c-3.14 1.43-6.96 1.7-10.41 1.25"></path></svg>
        )
    }
];

const Footer = ({ ref }) => {
    return (
        <footer className="border-t border-slate-800 mt-16 bg-slate-900/50" ref={ref}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Left side: Logo and copyright */}
                    <div className="flex flex-col items-center md:items-start">
                        <a href="#introduction" className="flex flex-col items-center md:items-start text-slate-200 hover:text-violet-400 transition-colors">
                             <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                                <path d="M4 4L10 20L12 12L20 4L4 4Z" fill="url(#footer-grad1)"/>
                                <path opacity="0.7" d="M12 12L10 20L16 16L12 12Z" fill="url(#footer-grad2)"/>
                                <defs>
                                    <linearGradient id="footer-grad1" x1="4" y1="4" x2="20" y2="4" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#C4B5FD"/>
                                        <stop offset="1" stopColor="#A78BFA"/>
                                    </linearGradient>
                                    <linearGradient id="footer-grad2" x1="10" y1="20" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#D8B4FE"/>
                                        <stop offset="1" stopColor="#C4B5FD"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="text-2xl font-bold">Viola ORM</span>
                        </a>
                        <p className="mt-2 text-slate-500 text-sm">
                            &copy; 2025 Viola ORM. All rights reserved.
                        </p>
                    </div>

                    {/* Right side: Author info & Socials */}
                    <div className="flex flex-col items-center md:items-end gap-4">
                        <div className="flex items-end gap-4">
                            <div className="text-right">
                                <p className="font-medium text-slate-400">Developed with ❤️ by</p>
                                <p className="font-bold text-slate-200">Elias Shallouf</p>
                            </div>
                            <img src={avatar} alt="Author Avatar" className="w-16 h-16 rounded-full border-2 border-slate-700 bg-white/10 p-1" />
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            {socialLinks.map(link => (
                                <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.name} className="text-slate-500 hover:text-violet-400 transition-colors">
                                    {link.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;