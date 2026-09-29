import React, { useState, useEffect, useMemo } from 'react';
import { educationData } from '../../data/educationData';
import { useAnimationsEnabled } from '../../utils/useAnimations';
import { sound } from '../../utils/sound';
import { GraduationCap, CheckCircle, Sparkles } from 'lucide-react';

// Compute real-time degree progress between 2024 and 2028
function calculateDegreeProgress(): { percent: number; monthsRemaining: number; currentYearOfStudy: number } {
  const now = new Date();
  const start = new Date(2024, 6, 1); // July 1, 2024
  const end = new Date(2028, 5, 30); // June 30, 2028

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = Math.max(0, now.getTime() - start.getTime());
  const ratio = Math.min(1, Math.max(0, elapsed / totalDuration));
  const percent = Math.round(ratio * 100);

  const msRemaining = Math.max(0, end.getTime() - now.getTime());
  const monthsRemaining = Math.round(msRemaining / (1000 * 60 * 60 * 24 * 30.4375));

  // Year 1, 2, 3, or 4
  const yearDiff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const currentYearOfStudy = Math.min(4, Math.max(1, Math.floor(yearDiff) + 1));

  return { percent, monthsRemaining, currentYearOfStudy };
}

// Hook to count up numbers (e.g. 91%, 80%, 8.0)
function useCountUp(targetStr: string, isVisible: boolean, animated: boolean): string {
  const [displayValue, setDisplayValue] = useState<string>(animated ? '0' : targetStr);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(targetStr);
      return;
    }
    if (!isVisible) {
      setDisplayValue('0');
      return;
    }

    const isPercent = targetStr.endsWith('%');
    const isDecimal = targetStr.includes('.');
    const numericTarget = parseFloat(targetStr.replace('%', ''));

    if (isNaN(numericTarget)) {
      setDisplayValue(targetStr);
      return;
    }

    let start = 0;
    const duration = 1000; // ms
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + (numericTarget - start) * ease;

      if (isDecimal) {
        setDisplayValue(`${current.toFixed(1)}${isPercent ? '%' : ''}`);
      } else {
        setDisplayValue(`${Math.round(current)}${isPercent ? '%' : ''}`);
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(targetStr);
      }
    };

    const frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [targetStr, isVisible, animated]);

  return displayValue;
}

// Hook for short terminal typewriter effect
function useTypewriter(text: string, isVisible: boolean, animated: boolean, delay: number = 0): string {
  const [typed, setTyped] = useState<string>(animated ? '' : text);

  useEffect(() => {
    if (!animated) {
      setTyped(text);
      return;
    }
    if (!isVisible) {
      setTyped('');
      return;
    }

    let timer: ReturnType<typeof setInterval>;
    const startTimeout = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        index++;
        setTyped(text.slice(0, index));
        if (index >= text.length) {
          clearInterval(interval);
        }
      }, 18);
      timer = interval;
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (timer) clearInterval(timer);
    };
  }, [text, isVisible, animated, delay]);

  return typed;
}

// Helper to format field labels in clean sentence case
const formatLabel = (key: string): string => {
  const map: Record<string, string> = {
    board: 'Board',
    year: 'Year',
    result: 'Result',
    degree: 'Degree',
    duration: 'Duration',
    cgpa: 'CGPA',
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

// Single generic row renderer with clean typography
const GenericFieldRow: React.FC<{
  label: string;
  value: string;
  isVisible: boolean;
  animated: boolean;
  delayIndex: number;
  isCurrent?: boolean;
}> = ({ label, value, isVisible, animated, delayIndex, isCurrent }) => {
  const isNumericStat = /^\d+(\.\d+)?%?$/.test(value);
  const countUpVal = useCountUp(value, isVisible, animated && isNumericStat);
  const typedText = useTypewriter(
    isNumericStat ? countUpVal : value,
    isVisible,
    animated && !isNumericStat,
    delayIndex * 80
  );

  return (
    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/40 last:border-none">
      <span className="font-sans text-xs text-slate-400 font-normal">
        {formatLabel(label)}
      </span>
      <span
        className={
          isNumericStat
            ? `font-mono font-semibold text-sm ${isCurrent ? 'text-pink-300' : 'text-emerald-400'}`
            : 'font-sans font-medium text-xs text-slate-200'
        }
      >
        {isNumericStat ? countUpVal : typedText}
      </span>
    </div>
  );
};

export const EducationTimeline: React.FC = () => {
  const animationsEnabled = useAnimationsEnabled();
  const degreeProgress = useMemo(() => calculateDegreeProgress(), []);

  // Animation timeline progression states
  const [lineDrawn, setLineDrawn] = useState(!animationsEnabled);
  const [visibleStages, setVisibleStages] = useState<Record<string, boolean>>({
    secondary: !animationsEnabled,
    'higher-secondary': !animationsEnabled,
    current: !animationsEnabled,
  });

  useEffect(() => {
    if (!animationsEnabled) {
      setLineDrawn(true);
      setVisibleStages({
        secondary: true,
        'higher-secondary': true,
        current: true,
      });
      return;
    }

    // Reset when opened
    setLineDrawn(false);
    setVisibleStages({
      secondary: false,
      'higher-secondary': false,
      current: false,
    });

    // Step 1: Start line drawing
    const t0 = setTimeout(() => {
      setLineDrawn(true);
      sound.playClick();
    }, 150);

    // Step 2: Node 1 (Secondary) pops in
    const t1 = setTimeout(() => {
      setVisibleStages((prev) => ({ ...prev, secondary: true }));
    }, 400);

    // Step 3: Node 2 (Higher Secondary) pops in
    const t2 = setTimeout(() => {
      setVisibleStages((prev) => ({ ...prev, 'higher-secondary': true }));
    }, 900);

    // Step 4: Node 3 (Current) pops in
    const t3 = setTimeout(() => {
      setVisibleStages((prev) => ({ ...prev, current: true }));
      sound.playNotification();
    }, 1400);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [animationsEnabled]);

  // Current progress bar width count up
  const animatedProgressPercent = useCountUp(
    `${degreeProgress.percent}%`,
    visibleStages.current,
    animationsEnabled
  );

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-6 relative select-none font-sans">
      {/* Top Banner */}
      <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-100 tracking-normal">
              Academic Journey &amp; Milestones
            </h2>
            <p className="font-sans text-xs text-slate-400 mt-0.5">
              Foundations in science to engineering degree
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="font-sans text-xs text-slate-400">
            3 milestones recorded
          </span>
          <div className="px-3 py-1 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 flex items-center gap-1.5 font-sans text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
            <span>Phase 3: Active</span>
          </div>
        </div>
      </div>

      {/* Vertical Timeline Container */}
      <div className="relative pl-6 sm:pl-10">
        {/* Animated Vertical Line */}
        <div
          className="absolute left-2.5 sm:left-4 top-4 bottom-4 w-1 bg-slate-800/80 rounded-full overflow-hidden"
          style={{ zIndex: 0 }}
        >
          <div
            className={`w-full bg-gradient-to-b from-emerald-500 via-purple-500 to-pink-500 rounded-full ${
              animationsEnabled ? 'transition-all duration-1000 ease-out' : ''
            }`}
            style={{
              height: lineDrawn ? '100%' : '0%',
              boxShadow: '0 0 12px rgba(192, 132, 252, 0.4)',
            }}
          />
        </div>

        {/* Timeline Items */}
        <div className="space-y-8">
          {educationData.map((item) => {
            const isVisible = visibleStages[item.id] ?? false;
            const isCurrent = item.id === 'current';

            // Generic fields: everything other than id, step, stage, institution, status
            const excludedKeys = new Set(['id', 'step', 'stage', 'institution', 'status']);
            const genericEntries = Object.entries(item).filter(([k]) => !excludedKeys.has(k));

            return (
              <div
                key={item.id}
                className={`relative flex items-start gap-4 sm:gap-6 ${
                  animationsEnabled
                    ? `transition-all duration-700 ${
                        isVisible
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-6 pointer-events-none'
                      }`
                    : 'opacity-100'
                }`}
              >
                {/* Node circle on the vertical line */}
                <div
                  className={`relative -ml-[18px] sm:-ml-[26px] z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono text-[10px] sm:text-xs font-bold border-2 transition-all duration-500 ${
                    isCurrent
                      ? 'bg-slate-950 border-pink-400 text-pink-300 shadow-[0_0_16px_rgba(244,63,94,0.6)]'
                      : isVisible
                      ? 'bg-slate-900 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {isCurrent && animationsEnabled && (
                    <span className="absolute -inset-1 rounded-full bg-pink-500/30 animate-ping pointer-events-none" />
                  )}
                  {item.step}
                </div>

                {/* Card Container */}
                <div
                  className={`flex-1 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                    isCurrent
                      ? 'bg-slate-900/90 border-pink-500/40 shadow-xl shadow-pink-500/10 p-6'
                      : 'bg-slate-900/60 border-emerald-500/20 shadow-sm opacity-90 hover:opacity-100 hover:border-emerald-500/35 p-5'
                  }`}
                >
                  {/* Card Header: Level Name + Single Status Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2.5 border-b border-slate-800/60">
                    <h3 className="font-display font-semibold text-base sm:text-lg text-slate-100 tracking-normal">
                      {item.id === 'secondary'
                        ? 'Secondary Education'
                        : item.id === 'higher-secondary'
                        ? 'Higher Secondary Education'
                        : 'Undergraduate Degree'}
                    </h3>

                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-sans text-pink-300 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                        In progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-sans text-emerald-400/90 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Institution */}
                  <p className="font-sans text-sm font-medium text-slate-300 mb-3">
                    {item.institution}
                  </p>

                  {/* Two-Column Field Rows */}
                  <div className="bg-slate-950/40 rounded-xl px-3.5 py-1.5 border border-slate-800/50 space-y-0.5 mb-3">
                    {genericEntries.map(([key, val], rIdx) => (
                      <GenericFieldRow
                        key={key}
                        label={key}
                        value={val}
                        isVisible={isVisible}
                        animated={animationsEnabled}
                        delayIndex={rIdx}
                        isCurrent={isCurrent}
                      />
                    ))}
                  </div>

                  {/* Special CURRENT Section: Degree Completion Progress Bar */}
                  {isCurrent && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                          Degree completion (Year {degreeProgress.currentYearOfStudy} of 4)
                        </span>
                        <span className="font-mono font-bold text-pink-300">
                          {animatedProgressPercent}
                        </span>
                      </div>

                      {/* Progress Track */}
                      <div className="w-full h-2.5 bg-slate-950 rounded-full p-0.5 border border-slate-800 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 ${
                            animationsEnabled ? 'transition-all duration-1000 ease-out' : ''
                          }`}
                          style={{
                            width: isVisible ? `${degreeProgress.percent}%` : '0%',
                            boxShadow: '0 0 10px rgba(236, 72, 153, 0.4)',
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-sans text-slate-400 pt-0.5">
                        <span>Started July 2024</span>
                        <span>~{degreeProgress.monthsRemaining} months until graduation (June 2028)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs font-sans text-slate-400">
        <div>Academic transcript records</div>
        <div className="text-slate-400 mt-1 sm:mt-0 font-sans">
          Type <span className="font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">subbu -education</span> in Terminal
        </div>
      </div>
    </div>
  );
};
