import { useCallback, useEffect, useRef } from 'react';
import type { Position } from '../bulb/bulb-api';
import type { useBulbHeartbeats } from './useBulbHeartbeats';

type Props = {
  position: Position;
  bulbId: number | null;
  label: string;
  unavailableText: string;
  heartbeats: ReturnType<typeof useBulbHeartbeats>;
};

export default function MorseButton({
  position,
  bulbId,
  label,
  unavailableText,
  heartbeats,
}: Props) {
  const { lights, startLight, stopLight } = heartbeats;

  // Remember which input owns the current press.
  const heldBy = useRef<number | string | null>(null);

  const release = useCallback(() => {
    if (heldBy.current === null) return;

    heldBy.current = null;
    stopLight(position);
  }, [position, stopLight]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) release();
    }

    // Release the light if the user leaves the window or tab.
    window.addEventListener('blur', release);
    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener('blur', release);
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );

      // Expanding House removes this button and ends its press.
      release();
    };
  }, [release]);

  // End a press if its installed bulb changes or becomes unavailable.
  useEffect(() => {
    return () => release();
  }, [bulbId, release]);

  const status = lights[position];
  const isOn = status === 'on';
  const starting = status === 'starting';
  const unavailable = bulbId === null;

  const buttonState = unavailable
    ? 'is-unavailable'
    : isOn
      ? 'is-on'
      : 'is-off';

  return (
    <button
      type="button"
      className={`house-morse-button ${buttonState}`}
      disabled={unavailable}
      aria-label={label}
      aria-busy={starting}
      title={unavailable ? unavailableText : label}
      onPointerDown={(event) => {
        // Accept the main mouse button, touch, or pen.
        if (
          event.button !== 0 ||
          bulbId === null ||
          heldBy.current !== null
        ) {
          return;
        }

        // Receive the release even outside the button.
        event.currentTarget.setPointerCapture(event.pointerId);
        heldBy.current = event.pointerId;
        startLight(position, bulbId);
      }}
      onPointerUp={(event) => {
        if (heldBy.current === event.pointerId) release();
      }}
      onPointerCancel={(event) => {
        if (heldBy.current === event.pointerId) release();
      }}
      onLostPointerCapture={(event) => {
        if (heldBy.current === event.pointerId) release();
      }}
      onKeyDown={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return;

        event.preventDefault();

        // Holding a key must not start repeated presses.
        if (
          event.repeat ||
          bulbId === null ||
          heldBy.current !== null
        ) {
          return;
        }

        heldBy.current = event.key;
        startLight(position, bulbId);
      }}
      onKeyUp={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return;

        event.preventDefault();

        if (heldBy.current === event.key) release();
      }}
      onBlur={release}
      onContextMenu={(event) => event.preventDefault()}
    >
      <svg
        className="house-bulb-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 17h6v-2.2a6 6 0 1 0-6 0V17Z" />
        <path d="M9 20h6M10 23h4" />
      </svg>

      <span>{label}</span>
    </button>
  );
}