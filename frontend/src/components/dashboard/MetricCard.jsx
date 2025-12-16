import { ArrowRight } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const MetricCard = ({
    title,
    value,
    icon: Icon,
    iconBgColor = 'from-primary-900/40 to-primary-800/20',
    iconBorderColor = 'border-primary-700/30',
    iconColor = 'text-primary-400',
    hoverBorderColor = 'hover:border-primary-600/50',
    hoverShadowColor = 'hover:shadow-primary-500/10',
    hoverTextColor = 'group-hover:text-primary-400',
    linkTo = null,
    linkLabel = 'Ver más',
    linkColor = 'text-primary-400 hover:text-primary-300',
    decorationIcon: DecorationIcon = null,
    decorationColor = 'text-dark-700',
    badge = null,
    animationDelay = '0ms',
    className = ''
}) => {
    return (
        <div
            className={`metric-card group ${hoverBorderColor} transition-all duration-200 hover:shadow-lg ${hoverShadowColor} animate-fade-in ${className}`}
            style={{ animationDelay }}
        >
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${iconBgColor} border ${iconBorderColor} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                {badge ? (
                    badge
                ) : DecorationIcon && (
                    <DecorationIcon className={`w-8 h-8 ${decorationColor} group-hover:${decorationColor.replace('dark', 'primary')} transition-colors`} />
                )}
            </div>

            <div className="mt-4">
                <span className={`metric-value ${hoverTextColor} transition-colors`}>{value}</span>
                <p className="metric-label">{title}</p>
            </div>

            {linkTo && (
                <div className="mt-3 pt-3 border-t border-dark-700">
                    <Link to={linkTo} className={`text-xs ${linkColor} flex items-center gap-1 group/link`}>
                        {linkLabel}
                        <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                </div>
            )}
        </div>
    );
};

MetricCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType.isRequired,
    iconBgColor: PropTypes.string,
    iconBorderColor: PropTypes.string,
    iconColor: PropTypes.string,
    hoverBorderColor: PropTypes.string,
    hoverShadowColor: PropTypes.string,
    hoverTextColor: PropTypes.string,
    linkTo: PropTypes.string,
    linkLabel: PropTypes.string,
    linkColor: PropTypes.string,
    decorationIcon: PropTypes.elementType,
    decorationColor: PropTypes.string,
    badge: PropTypes.node,
    animationDelay: PropTypes.string,
    className: PropTypes.string
};

export default MetricCard;
