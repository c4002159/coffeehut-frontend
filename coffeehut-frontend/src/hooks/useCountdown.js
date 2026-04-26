import { useState, useEffect } from 'react';

export function useCountdown(targetDate) {
    const calc = (target) => {
        if (!target) return '';
        const diff = target.getTime() - Date.now();
        if (diff <= 0) return 'Ready for pickup';
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `${mins}m ${secs}s`;
    };

    const [countdown, setCountdown] = useState(() => calc(targetDate));

    useEffect(() => {
        if (!targetDate) return;
        setCountdown(calc(targetDate)); // 立即算一次，避免第一秒空白
        const timer = setInterval(() => setCountdown(calc(targetDate)), 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return countdown;
}
