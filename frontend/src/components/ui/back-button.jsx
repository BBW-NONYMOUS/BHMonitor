import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Reusable BackButton component
 * @param {string} to - Route to navigate to (default: '/')
 * @param {string} label - Button text (default: 'Back')
 * @param {string} variant - Button variant (default: 'outline')
 * @param {string} size - Button size (default: 'default')
 * @param {boolean} showIcon - Show arrow icon (default: true)
 * @param {string} className - Additional CSS classes
 */
const BackButton = React.forwardRef(
    ({ to = '/', label = 'Back', variant = 'outline', size = 'default', showIcon = true, className, ...props }, ref) => {
        const navigate = useNavigate();

        const handleClick = () => {
            navigate(to);
        };

        return (
            <Button
                ref={ref}
                variant={variant}
                size={size}
                onClick={handleClick}
                className={cn('gap-2', className)}
                {...props}
            >
                {showIcon && <ArrowLeft className="h-4 w-4" />}
                {label}
            </Button>
        );
    }
);

BackButton.displayName = 'BackButton';

export { BackButton };
