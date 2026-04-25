import { useState, useEffect } from 'react';

export function useCountdown(targetDate) {
    const [countdown, setCountdown] = useState('');
    useEffect(() => {
        if (!targetDate) return;
        const timer = setInterval(() => {
            const diff = targetDate.getTime() - Date.now();
            if (diff <= 0) setCountdown('Ready for pickup');
            else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setCountdown(`${mins}m ${secs}s`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);
    return countdown;
}