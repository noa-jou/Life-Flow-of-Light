import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../i18n';
import { historyText } from './history-text';

type Props = {
    language: Language;
    title: string;
    zoom: number;
    children: ReactNode;
};

function formatMinutes(value: number): string {
    const minutes = Math.max(0, Math.min(1440, Math.round(value)));
    const hours = Math.floor(minutes / 60);

    return (
        `${String(hours).padStart(2, '0')}:` +
        String(minutes % 60).padStart(2, '0')
    );
}

export default function HistoryScroll({
    language,
    title,
    zoom,
    children,
}: Props) {
    const text = historyText[language];
    const viewport = useRef<HTMLDivElement>(null);

    // Remember the relative position even when the whole day fits.
    const scrollRatio = useRef(0);

    const [view, setView] = useState({
        left: 0,
        max: 0,
        from: 0,
        to: 1440,
    });

    useLayoutEffect(() => {
        const node = viewport.current;
        const axis = node?.querySelector<HTMLElement>(
            '.history-gantt-axis',
        );

        if (!node || !axis) return;

        let frame = 0;

        function restorePosition() {
            if (!node) return;

            const max = Math.max(0, node.scrollWidth - node.clientWidth);

            // Restore the same proportion of the available scroll distance.
            node.scrollLeft = scrollRatio.current * max;
        }

        function measure() {
            if (!node || !axis) return;

            const viewportRect = node.getBoundingClientRect();
            const axisRect = axis.getBoundingClientRect();

            if (axisRect.width === 0) return;

            const max = Math.max(0, node.scrollWidth - node.clientWidth);
            const left = Math.max(0, Math.min(node.scrollLeft, max));

            // Keep the remembered position when scrolling is unavailable.
            if (max > 0) {
                scrollRatio.current = left / max;
            }

            const visibleLeft = viewportRect.left + node.clientLeft;
            const visibleRight = visibleLeft + node.clientWidth;

            const toMinutes = (x: number) =>
                Math.max(
                    0,
                    Math.min(
                        1440,
                        ((x - axisRect.left) / axisRect.width) * 1440,
                    ),
                );

            setView({
                left,
                max,
                from: toMinutes(visibleLeft),
                to: toMinutes(visibleRight),
            });
        }

        function scheduleMeasure() {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        }

        // Restore the position before the browser paints the zoomed chart.
        restorePosition();
        scheduleMeasure();

        const observer = new ResizeObserver(() => {
            restorePosition();
            scheduleMeasure();
        });

        observer.observe(node);
        observer.observe(axis);
        node.addEventListener('scroll', scheduleMeasure);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            node.removeEventListener('scroll', scheduleMeasure);
        };
    }, [zoom]);

    const rangeText =
        `${formatMinutes(view.from)}–${formatMinutes(view.to)}`;

    return (
        <>
            <div className="history-scroll-controls">
                <span className="history-scroll-range">
                    {text.visibleTime}: {rangeText}
                </span>

                <input
                    className="history-scroll-slider"
                    type="range"
                    min={0}
                    max={view.max}
                    step="any"
                    value={Math.min(view.left, view.max)}
                    disabled={view.max === 0}
                    aria-label={`${title}: ${text.scrollTimeline}`}
                    aria-valuetext={rangeText}
                    onChange={(event) => {
                        const left = Number(event.target.value);
                        const node = viewport.current;

                        if (!node) return;

                        const max = Math.max(0, node.scrollWidth - node.clientWidth);

                        if (max > 0) {
                            scrollRatio.current = left / max;
                        }

                        node.scrollLeft = left;
                        setView((current) => ({ ...current, left }));
                    }}
                />
            </div>

            <div className="history-gantt-scroll" ref={viewport}>
                {children}
            </div>
        </>
    );
}