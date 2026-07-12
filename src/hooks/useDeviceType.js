import { useState, useEffect } from 'react';

/**
 * Custom hook to detect device type (mobile vs desktop)
 * @returns {Object} { isMobile: boolean }
 */
export function useDeviceType() {
    const [deviceType, setDeviceType] = useState(() => {
        if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            if (width < 768) return 'mobile';
            if (width <= 1280) return 'tablet';
            return 'desktop';
        }
        return 'desktop';
    });

    useEffect(() => {
        function handleResize() {
            const width = window.innerWidth;
            if (width < 768) {
                setDeviceType('mobile');
            } else if (width <= 1280) {
                setDeviceType('tablet');
            } else {
                setDeviceType('desktop');
            }
        }

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        deviceType
    };
}
