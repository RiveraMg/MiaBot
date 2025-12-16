import React from 'react';

const PageHeader = ({ title, subtitle, icon: Icon, iconColor = 'blue', actions, children }) => {
    const colorClasses = {
        blue: 'bg-blue-900/30 text-blue-400',
        purple: 'bg-purple-900/30 text-purple-400',
        green: 'bg-green-900/30 text-green-400',
        orange: 'bg-orange-900/30 text-orange-400',
        red: 'bg-red-900/30 text-red-400',
        yellow: 'bg-yellow-900/30 text-yellow-400',
        pink: 'bg-pink-900/30 text-pink-400',
        gray: 'bg-dark-800 text-dark-300',
        primary: 'bg-primary-900/30 text-primary-400'
    };

    const iconClass = colorClasses[iconColor] || colorClasses.blue;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Title Area */}
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={`p-2 rounded-xl ${iconClass}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-dark-50">{title}</h1>
                        {subtitle && <p className="text-sm text-dark-400">{subtitle}</p>}
                    </div>
                </div>

                {/* Actions Area */}
                {actions && (
                    <div className="flex flex-wrap items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>

            {/* Optional Content (like filters) */}
            {children && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
