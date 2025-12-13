import PropTypes from 'prop-types';

const LoadingCard = ({ count = 1, className = '' }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`card animate-pulse ${className}`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-dark-700 rounded-xl" />
                        <div className="w-20 h-6 bg-dark-700 rounded-lg" />
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                        <div className="w-24 h-8 bg-dark-700 rounded-lg" />
                        <div className="w-32 h-4 bg-dark-700 rounded" />
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-dark-700">
                        <div className="w-28 h-4 bg-dark-700 rounded" />
                    </div>
                </div>
            ))}
        </>
    );
};

LoadingCard.propTypes = {
    count: PropTypes.number,
    className: PropTypes.string
};

export default LoadingCard;
