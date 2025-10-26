import React from 'react';

const Card = ({ icon, title, content, buttonText, buttonHref, buttonType = 'primary', onClick }) => {
    const baseButtonClasses = "inline-block w-full text-center font-semibold text-base px-6 py-2.5 rounded-lg shadow-lg transition-all duration-200";
    
    const buttonStyles = {
        primary: "bg-violet-600 hover:bg-violet-700 text-white",
        secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
        tertiary: "border border-slate-600 hover:bg-slate-800 text-slate-300"
    };

    return (
        <div className="community-card flex flex-col bg-slate-800/50 p-6 rounded-xl border border-slate-700/80 transition-all duration-300 hover:border-violet-500/50 hover:bg-slate-800">
            <div className="flex-grow">
                <div className="text-violet-400 mb-4">{icon}</div>
                <h3 className="text-xl font-bold text-slate-100 mb-2 !mt-0">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{content}</p>
            </div>
            <a href={buttonHref} onClick={onClick} target="_blank" rel="noopener noreferrer" className={`${baseButtonClasses} ${buttonStyles[buttonType]} mt-6`}>
                {buttonText}
            </a>
        </div>
    );
};


const CommunitySection = () => {
    return (
        <section id="community" className="scroll-mt-20 md:px-20">
            <div className="text-start md:text-center mb-12">
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-100">
                    Join the Viola ORM Community
                </h2>
                <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                    Ready to simplify your Java persistence? Get involved, contribute, or ask for help.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <Card
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
                    title="Get Started Now"
                    content="Download the latest JAR, or add Viola ORM to your Maven/Gradle project."
                    buttonText="Download Latest Release"
                    buttonHref="https://github.com/EliasMShallouf/ViolaORM/releases"
                    buttonType="primary"
                />
                <Card
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>}
                    title="Contribute on GitHub"
                    content="Found a bug, have a feature idea, or want to dive into the code? We welcome all contributors."
                    buttonText="View GitHub Repository"
                    buttonHref="https://github.com/EliasMShallouf/ViolaORM"
                    buttonType="secondary"
                />
                <Card
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                    title="Ask a Question"
                    content="Join our community channel or ask on Stack Overflow. Get direct support from the maintainers."
                    buttonText="Join the Community"
                    buttonHref="https://github.com/EliasMShallouf/ViolaORM/issues"
                    buttonType="tertiary"
                />
            </div>
        </section>
    );
};

export default CommunitySection;