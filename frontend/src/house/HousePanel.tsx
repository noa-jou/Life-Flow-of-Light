import { useEffect, useState } from 'react';
import type { Language } from '../i18n';
import floorPlan from '../assets/Floor-Plan.png';
import { houseText } from './house-text';
import { getBulbs } from '../bulb/bulb-api';
import type { Bulb } from '../bulb/bulb-api';
import { useBulbHeartbeats } from './useBulbHeartbeats';

import './HousePanel.css';

type Props = {
    language: Language;
    fullWidth: boolean;
    bulbRevision: number;
};

type Room = 'living_room' | 'bathroom' | 'bedroom';

type Inventory = {
    revision: number;
    attempt: number;
    bulbs: Bulb[];
    failed: boolean;
};

// These dimensions match the original image.
const IMAGE_WIDTH = 1007;
const IMAGE_HEIGHT = 951;

const BUTTON_SIZE = 76;

// Coordinates refer to the original, unrotated image.
// Each point marks the approximate center of a room.
const rooms: {
    position: Room;
    buttonId: string;
    x: number;
    y: number;
}[] = [
        {
            position: 'living_room',
            buttonId: 'living-room-light',
            x: 500,
            y: 250,
        },
        {
            position: 'bathroom',
            buttonId: 'bathroom-light',
            x: 170,
            y: 720,
        },
        {
            position: 'bedroom',
            buttonId: 'bedroom-light',
            x: 680,
            y: 725,
        },
    ];

export default function HousePanel({
    language,
    fullWidth,
    bulbRevision,
}: Props) {
    const text = houseText[language];

    // Manage the real heartbeat loops separately from the drawing.
    const {
        lights,
        startLight,
        stopLight,
        stopInvalidLights,
    } = useBulbHeartbeats();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [attempt, setAttempt] = useState(0);

    // Old data must not enable switches while a new check is pending.
    const inventoryCurrent =
        inventory !== null &&
        inventory.revision === bulbRevision &&
        inventory.attempt === attempt;

    const inventoryReady = inventoryCurrent && !inventory.failed;
    const inventoryFailed = inventoryCurrent && inventory.failed;

    useEffect(() => {
        const controller = new AbortController();

        getBulbs(controller.signal)
            .then((bulbs) => {
                if (controller.signal.aborted) return;

                setInventory({
                    revision: bulbRevision,
                    attempt,
                    bulbs,
                    failed: false,
                });

                // Clear the local preview state for rooms without a bulb.
                // Stop a loop if its bulb is no longer installed in the same room.
                stopInvalidLights(bulbs);
            })
            .catch(() => {
                if (controller.signal.aborted) return;

                // A failed request is different from an empty room.
                setInventory({
                    revision: bulbRevision,
                    attempt,
                    bulbs: [],
                    failed: true,
                });
            });

        // Ignore an outdated request when the revision changes.
        return () => controller.abort();
    }, [bulbRevision, attempt, stopInvalidLights]);

    // Keep the original landscape orientation when House is fully open.
    // Rotate clockwise when House shares the available space.
    const portrait = !fullWidth;

    const drawingWidth = portrait ? IMAGE_HEIGHT : IMAGE_WIDTH;
    const drawingHeight = portrait ? IMAGE_WIDTH : IMAGE_HEIGHT;

    function toggleLight(room: Room) {
        const status = lights[room];

        // Switching off must remain possible even during an inventory refresh.
        if (status === 'starting' || status === 'on') {
            stopLight(room);
            return;
        }

        // Starting requires a current, successful inventory check.
        if (!inventoryReady) return;

        const bulb = inventory.bulbs.find(
            (item) => item.position === room,
        );

        if (!bulb) return;

        startLight(room, bulb.id);
    }

    return (
        <div className="house-panel">
            <div className="house-preview-note">
                <p>{text.singleClientWarning}</p>
                {!inventoryCurrent && (
                    <p role="status">{text.checking}</p>
                )}

                {inventoryFailed && (
                    <p role="alert">
                        {text.loadFailed}{' '}
                        <button
                            type="button"
                            onClick={() => setAttempt((current) => current + 1)}
                        >
                            {text.retry}
                        </button>
                    </p>
                )}

                {rooms.map((room) =>
                    lights[room.position] === 'error' ? (
                        <p key={room.position} role="alert">
                            {text[room.position]}: {text.heartbeatFailed}
                        </p>
                    ) : null,
                )}
            </div>
            <svg
                className="house-floor-plan"
                viewBox={`0 0 ${drawingWidth} ${drawingHeight}`}
                preserveAspectRatio="xMidYMid meet"
                role="group"
                aria-label={text.floorPlan}
            >
                <title>{text.floorPlan}</title>

                {/* Rotate only the image. The buttons remain upright. */}
                <image
                    href={floorPlan}
                    width={IMAGE_WIDTH}
                    height={IMAGE_HEIGHT}
                    transform={
                        portrait
                            ? `translate(${IMAGE_HEIGHT} 0) rotate(90)`
                            : undefined
                    }
                />

                {rooms.map((room) => {
                    // Apply the same clockwise rotation to each room's center.
                    const centerX = portrait
                        ? IMAGE_HEIGHT - room.y
                        : room.x;
                    const centerY = portrait ? room.x : room.y;

                    const installed =
                        inventoryReady &&
                        inventory.bulbs.some(
                            (bulb) => bulb.position === room.position,
                        );

                    const lightStatus = lights[room.position];

                    const starting = lightStatus === 'starting';
                    const isOn = lightStatus === 'on';
                    const active = starting || isOn;

                    // Keep an active switch usable so the user can always switch it off.
                    const unavailable = !installed && !active;
                    const label = text[room.position];

                    const status = starting
                        ? text.starting
                        : isOn
                            ? text.on
                            : !inventoryCurrent
                                ? text.checking
                                : inventoryFailed
                                    ? text.loadFailed
                                    : !installed
                                        ? text.noBulb
                                        : lightStatus === 'error'
                                            ? text.heartbeatFailed
                                            : text.off;

                    const buttonState = unavailable
                        ? 'is-unavailable'
                        : isOn
                            ? 'is-on'
                            : 'is-off';

                    return (
                        <foreignObject
                            key={room.position}
                            x={centerX - BUTTON_SIZE / 2}
                            y={centerY - BUTTON_SIZE / 2}
                            width={BUTTON_SIZE}
                            height={BUTTON_SIZE}
                        >
                            {/* A real HTML button supports mouse and keyboard input. */}
                            <button
                                id={room.buttonId}
                                type="button"
                                className={`house-light-button ${buttonState}`}
                                aria-label={`${label}: ${status}`}
                                aria-pressed={active}
                                aria-busy={starting}
                                aria-disabled={unavailable}
                                title={`${label}: ${status}`}
                                onClick={() => toggleLight(room.position)}
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
                                    {/* Draw the bulb outline and its base. */}
                                    <path
                                        d="M9 17h6v-2.2a6 6 0 1 0-6 0V17Z"
                                    />
                                    <path d="M9 20h6M10 23h4" />
                                </svg>
                            </button>
                        </foreignObject>
                    );
                })}
            </svg>
        </div>
    );
}