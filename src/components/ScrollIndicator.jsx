import React from 'react';

const ScrollIndicator = ({ onClick, href }) => {
    return (
        <a href={href} onClick={onClick} className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="mouse-scroll">
                <div className="mouse-scroll-wheel"></div>
            </div>
        </a>
    );
};

export default ScrollIndicator;