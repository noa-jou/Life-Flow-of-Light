# Life Flow of Light — Morse Guide

[Project overview](../README.md) · [User Guide](./UserGuide.md) · [Learning Notes](./LearningNotes.md)

## Can a light carry a message?

A light can show more than whether a room is occupied.

If someone turns it on and off in a deliberate rhythm, that rhythm can represent letters. Life Flow of Light includes a small feature that looks for these patterns in recorded lighting activity.

There is also a hidden message in the demo data.

## What is Morse code?

Morse code represents characters using short and long signals:

- A **dot**, written as `.`, is a short signal.
- A **dash**, written as `-`, is a long signal.

Signals can be sounds, flashes of light, or other distinguishable events.

For this project, a signal is a period when a lamp is on. The dark gaps between signals tell us where letters and words separate.

For example:

| Letter | Morse code |
| --- | --- |
| H | `....` |
| E | `.` |
| L | `.-..` |
| P | `.--.` |

Together, these patterns spell **HELP**.

The pauses matter. Without them, a sequence of flashes would not clearly show where one letter ends and another begins.

## The hidden message in the demo

The optional seed creates three lamps:

| Lamp | Position |
| --- | --- |
| A | Living room |
| B | Bedroom |
| C | Bathroom |

It generates the previous three complete calendar days using patterns.

Most of the records represent ordinary daily lighting. On the third evening, something changes in the bedroom.

This message is an Easter egg placed deliberately in the the seed (demo data).

## Checking for messages

The backend accepts a position and a time range, then looks for possible messages in that position's stored sessions.

For example, a check might mean:

> Look at the bedroom records from yesterday evening. Is there a recognizable message?

A successful match includes:

- The detected text.
- When its first signal began.
- When its last signal is estimated to have ended.


## How we detect Morse code

The detector reads the recorded lighting activity and looks for short and long flashes:

| Light activity | Meaning |
| --- | --- |
| On for about 2 seconds | A dot (`.`) |
| On for about 6 seconds | A dash (`-`) |
| Off for about 2 seconds | Gap between signals within one letter |
| Off for about 6 seconds | Gap between letters |
| Off for about 14 seconds | A space between words |

Small timing differences are allowed. The detector combines matching patterns into letters and words.

For example, four short flashes with two-second gaps between them form `....`, which means **H**.

It recognizes A–Z and spaces, so your message does not have to be a real English word. You can try your name or invent a secret message!


## Try sending your own message

Once the frontend is available, use its controls to switch a virtual lamp on and off and write your own Morse code.

1. Choose an installed lamp.
2. Pick a letter or word from the table below.
3. Follow the on-and-off timing above.
4. After your final flash, leave the lamp off for at least **18 seconds**.
5. Select that position and a time range covering your whole message, then press **“Check for messages.”**


## Morse alphabet

A dot means a short flash. A dash means a long flash.

| Letter | Morse code | Letter | Morse code |
| --- | --- | --- | --- |
| A | `.-` | N | `-.` |
| B | `-...` | O | `---` |
| C | `-.-.` | P | `.--.` |
| D | `-..` | Q | `--.-` |
| E | `.` | R | `.-.` |
| F | `..-.` | S | `...` |
| G | `--.` | T | `-` |
| H | `....` | U | `..-` |
| I | `..` | V | `...-` |
| J | `.---` | W | `.--` |
| K | `-.-` | X | `-..-` |
| L | `.-..` | Y | `-.--` |
| M | `--` | Z | `--..` |

| Separator | How to send it in this project |
| --- | --- |
| Space between words | Leave the lamp off for about 14 seconds. |

A space has no flash pattern of its own—it is a longer pause.

## Further reading

If Morse code is new to you, see [ITU-R M.1677-1: International Morse code](https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en) for the alphabet and timing rules.


For this project's implementation history, see the [Learning Notes](./LearningNotes.md).