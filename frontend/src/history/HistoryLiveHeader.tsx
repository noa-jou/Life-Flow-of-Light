import type { Language } from '../i18n';
import type { useLiveTimeline } from './useLiveTimeline';
import { historyText } from './history-text';
import './HistoryLiveHeader.css';

type Props = {
    language: Language;
    timeline: ReturnType<typeof useLiveTimeline>;
};

const positions = [
    'living_room',
    'bedroom',
    'bathroom',
] as const;

export default function HistoryLiveHeader({
    language,
    timeline,
}: Props) {
    const text = historyText[language];

    // Copy before reversing: the compact view still needs newest first.
    const cells = [...timeline.cells];

    const localTime = new Date(
        timeline.second * 1000,
    ).toLocaleTimeString(
        language === 'en' ? 'en-GB' : 'zh-TW',
        {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        },
    );

    return (
        <span className="history-header-live" aria-hidden="true">
            <span className="history-header-lines">
                {positions.map((position) => (
                    <span className="history-header-row" key={position}>
                        <span className="history-header-label">
                            {text[position]}
                        </span>

                        <span className="history-header-track">
                            {cells.map((cell) => (
                                <span
                                    key={cell.second}
                                    className={`history-header-cell ${cell.on[position] ? 'is-on' : ''
                                        }`}
                                />
                            ))}
                        </span>
                    </span>
                ))}
            </span>

            <span className="history-header-clock">
                <span>{text.localTime}</span>
                <span className="history-header-time">{localTime}</span>
            </span>
        </span>
    );
}