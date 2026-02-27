import { useState, useRef, useEffect } from 'react';

export const useCartDraggable = (showDetails: boolean, setShowDetails: (show: boolean) => void) => {
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef<number | null>(null);

    const handleDragStart = (y: number) => {
        startY.current = y;
        setIsDragging(true);
    };

    const handleDragMove = (y: number) => {
        if (startY.current === null) return;
        const deltaY = y - startY.current;
        // Resistance when pulling further than allowed
        if (!showDetails && deltaY > 0) return; // Can't pull down when already closed
        setDragOffset(deltaY);
    };

    const handleDragEnd = () => {
        if (startY.current === null) return;
        setIsDragging(false);

        // Threshold to toggle: 50px
        if (Math.abs(dragOffset) > 50) {
            if (dragOffset < 0 && !showDetails) {
                setShowDetails(true);
            } else if (dragOffset > 0 && showDetails) {
                setShowDetails(false);
            }
        }

        setDragOffset(0);
        startY.current = null;
    };

    // Global listeners for mouse up/move to handle dragging outside the handle
    useEffect(() => {
        if (!isDragging) return;

        const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
        const onMouseUp = () => handleDragEnd();

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, dragOffset, showDetails]);

    return {
        dragOffset,
        isDragging,
        handleDragStart,
        handleDragMove,
        handleDragEnd
    };
};
