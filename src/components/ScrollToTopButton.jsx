import React from 'react';

const ScrollToTopButton = ({ isVisible, onClick }) => {
    return (
        <button
            onClick={onClick}
            aria-label="Scroll to top"
            className={`
                fixed bottom-8 right-8 z-50 p-3
                bg-violet-600/80 hover:bg-violet-500
                text-white rounded-full shadow-lg
                transition-all duration-300 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
            `}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5"></path>
                <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
        </button>
    );
};

export default ScrollToTopButton;
