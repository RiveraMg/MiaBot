import { Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({
    size = 'medium',
    message = '',
    centered = true,
    className = ''
}) => {
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    const spinnerSize = sizeClasses[size] || sizeClasses.medium;

    const content = (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            <Loader2 className={`${spinnerSize} animate-spin text-primary-500`} />
            {message && (
                <p className="text-sm text-dark-400 animate-pulse">{message}</p>
            )}
        </div>
    );

    if (centered) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                {content}
            </div>
        );
    }

    return content;
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    message: PropTypes.string,
    centered: PropTypes.bool,
    className: PropTypes.string
};

export default LoadingSpinner;
