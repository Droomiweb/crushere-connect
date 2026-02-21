import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HumbleMascot } from './HumbleMascot';

interface PullToRefreshProps {
  onRefresh?: () => Promise<void>;
  children: React.ReactNode;
}

type RefreshStatus = 'idle' | 'pulling' | 'threshold' | 'refreshing' | 'success';

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [status, setStatus] = useState<RefreshStatus>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const lastY = useRef(0);
  const isPulling = useRef(false);
  const threshold = 140;
  const maxPull = 220;

  // Handle non-passive touch events to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0 && status === 'idle') {
        startY.current = e.touches[0].pageY;
        lastY.current = e.touches[0].pageY;
        isPulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || status === 'refreshing' || status === 'success') return;

      const currentY = e.touches[0].pageY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Prevent browser scroll/bounce
        if (e.cancelable) e.preventDefault();

        // Snapchat Elasticity: Initial linear move, then log/power dampened
        let finalDist;
        if (diff <= 80) {
          finalDist = diff;
        } else {
          finalDist = 80 + Math.pow(diff - 80, 0.65) * 3.5;
        }

        finalDist = Math.min(finalDist, maxPull);
        setPullDistance(finalDist);
        setStatus(finalDist >= threshold ? 'threshold' : 'pulling');
      } else {
        isPulling.current = false;
        setPullDistance(0);
        setStatus('idle');
      }
    };

    const onTouchEnd = async () => {
      if (!isPulling.current || status === 'refreshing' || status === 'success') return;
      isPulling.current = false;

      if (pullDistance >= threshold && onRefresh) {
        setStatus('refreshing');
        setPullDistance(100); // Snap to threshold for loading
        try {
          await onRefresh();
          setStatus('success');
        } catch (error) {
          setStatus('idle');
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
        setStatus('idle');
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullDistance, status, onRefresh]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setPullDistance(0);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const progress = Math.min(pullDistance / threshold, 1);
  const revealProgress = Math.min(pullDistance / 60, 1);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-y-auto scroll-hidden bg-background overscroll-none"
    >
      {/* Snapchat Tray Layer - Revealed BEHIND content */}
      <div 
        className="absolute top-0 left-0 right-0 overflow-hidden flex flex-col items-center justify-center pointer-events-none"
        style={{ height: `${pullDistance}px`, background: 'radial-gradient(circle at top, rgba(168,85,247,0.15) 0%, transparent 70%)' }}
      >
        <div 
          className="relative flex flex-col items-center gap-3 transition-all duration-500 ease-out"
          style={{ 
            opacity: revealProgress,
            transform: `translateY(${(1 - progress) * -40}px) scale(${0.8 + progress * 0.2})`
          }}
        >
          {/* Character Reveal */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {status === 'refreshing' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[88px] h-[88px] border-4 border-primary/20 border-t-primary rounded-full animate-[spin_1s_cubic-bezier(0.5,0.1,0.5,0.9)_infinite]" />
                <div className="absolute w-[100px] h-[100px] border-2 border-primary/10 border-b-primary rounded-full animate-[spin_1.5s_cubic-bezier(0.5,0.1,0.5,0.9)_infinite_reverse]" />
              </div>
            )}
            
            <HumbleMascot 
              status={status}
              className={`w-20 h-20 transition-all duration-500 ${status === 'threshold' ? 'scale-110 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]'}`}
            />
            
            {status === 'success' && (
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="absolute w-[120px] h-[120px] bg-green-500/20 rounded-full animate-ping" />
                 <div className="absolute w-[80px] h-[80px] bg-green-500/40 rounded-full animate-ping delay-75" />
              </div>
            )}
          </div>

          <div className="h-6 flex items-center justify-center">
            <div className={`transition-all duration-300 ${status === 'threshold' ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.4em] ${status === 'threshold' ? 'text-primary drop-shadow-md' : 'text-muted-foreground'} ${status === 'success' ? 'text-green-500' : ''}`}>
                {status === 'pulling' && "Pull deeper"}
                {status === 'threshold' && "Release!"}
                {status === 'refreshing' && "Finding crushes..."}
                {status === 'success' && "Done ✨"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layer - Pushes down to reveal mascot behind it */}
      <div 
        ref={contentRef}
        className="relative w-full min-h-full bg-background z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Check({ size, className, strokeWidth }: { size: number, className?: string, strokeWidth?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth || 2} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
