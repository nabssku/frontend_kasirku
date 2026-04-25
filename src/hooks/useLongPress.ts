import { useCallback, useRef, useState } from 'react';

interface LongPressOptions {
    shouldPreventDefault?: boolean;
    delay?: number;
}

export const useLongPress = (
    onLongPress: (e: any) => void,
    onClick?: () => void,
    { shouldPreventDefault = true, delay = 500 }: LongPressOptions = {}
) => {
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const target = useRef<EventTarget | null>(null);
    const startPos = useRef<{ x: number; y: number } | null>(null);

    const start = useCallback(
        (event: any) => {
            if (shouldPreventDefault && event.target) {
                event.target.addEventListener("touchend", preventDefault, {
                    passive: false
                });
                target.current = event.target;
            }

            // Record start position to detect movement (scroll)
            const touch = event.touches ? event.touches[0] : event;
            startPos.current = { x: touch.clientX, y: touch.clientY };

            timeout.current = setTimeout(() => {
                onLongPress(event);
                setLongPressTriggered(true);
            }, delay);
        },
        [onLongPress, delay, shouldPreventDefault]
    );

    const clear = useCallback(
        (event: any, shouldTriggerClick = true) => {
            if (timeout.current) clearTimeout(timeout.current);
            if (shouldTriggerClick && !longPressTriggered && onClick) {
                onClick();
            }
            setLongPressTriggered(false);
            if (shouldPreventDefault && target.current) {
                target.current.removeEventListener("touchend", preventDefault);
            }
            startPos.current = null;
        },
        [shouldPreventDefault, onClick, longPressTriggered]
    );

    const move = useCallback(
        (event: any) => {
            if (!startPos.current) return;
            
            const touch = event.touches ? event.touches[0] : event;
            const diffX = Math.abs(touch.clientX - startPos.current.x);
            const diffY = Math.abs(touch.clientY - startPos.current.y);
            
            // If moved more than 10px, it's likely a scroll or drag, cancel long press
            if (diffX > 10 || diffY > 10) {
                if (timeout.current) clearTimeout(timeout.current);
                startPos.current = null;
            }
        },
        []
    );

    return {
        onMouseDown: (e: any) => start(e),
        onMouseUp: (e: any) => clear(e),
        onMouseLeave: (e: any) => clear(e, false),
        onMouseMove: (e: any) => move(e),
        onTouchStart: (e: any) => start(e),
        onTouchEnd: (e: any) => clear(e),
        onTouchMove: (e: any) => move(e),
    };
};

const preventDefault = (event: Event) => {
    if (!event.cancelable) return;
    event.preventDefault();
};
