import React from 'react';

const CardTitle = ({header = '',text = '',bottom = '', icon = ''}) => {
    return (
        <div className="card bg-border rounded-2xl pr-10 w-full pl-4 py-3 gap-1 flex flex-col items-start justify-start">
            {icon && (<img src={icon} alt="" />)}
            <p className="text-opacity-50 text-white text-xs">{header}</p>
            <span className="text-md">{text}</span>
            {bottom && (
                <span
                className="text-xs px-1.5 py-0.5 text-yellow-400 rounded-md text-opacity-80 bg-yellow-500 bg-opacity-10">{bottom}</span>
            )}

        </div>
    );
};

export default CardTitle;