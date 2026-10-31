import type { Language } from '../i18n';
import { guideText } from './morse-text';
import './MorseGuide.css';

type Props = {
  language: Language;
  part: 'instructions' | 'alphabet';
};

// Keep the reference table separate from the translated text.
const alphabet = [
  ['A', '.-'],
  ['B', '-...'],
  ['C', '-.-.'],
  ['D', '-..'],
  ['E', '.'],
  ['F', '..-.'],
  ['G', '--.'],
  ['H', '....'],
  ['I', '..'],
  ['J', '.---'],
  ['K', '-.-'],
  ['L', '.-..'],
  ['M', '--'],
  ['N', '-.'],
  ['O', '---'],
  ['P', '.--.'],
  ['Q', '--.-'],
  ['R', '.-.'],
  ['S', '...'],
  ['T', '-'],
  ['U', '..-'],
  ['V', '...-'],
  ['W', '.--'],
  ['X', '-..-'],
  ['Y', '-.--'],
  ['Z', '--..'],
] as const;


export default function MorseGuide({ language, part }: Props) {
  const text = guideText[language];

  if (part === 'instructions') {
    return (
      <aside
        className="morse-guide"
        aria-label={text.instructionsTitle}
      >
        <h3>{text.instructionsTitle}</h3>
        <p>{text.controls}</p>
        <p>{text.timingIntro}</p>

        <dl className="morse-timing">
          {text.timing.map(([label, duration]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{duration}</dd>
            </div>
          ))}
        </dl>

        <h4>{text.practiceTitle}</h4>
        <p className="morse-example">... / --- / ...</p>
        <p>{text.practice}</p>
        <p>{text.finish}</p>
        <p className="morse-footnote">{text.timingNote}</p>
      </aside>
    );
  }

  return (
    <aside
      className="morse-guide"
      aria-label={text.alphabetTitle}
    >
      <h3>{text.alphabetTitle}</h3>
      <p>{text.symbols}</p>

      <dl className="morse-alphabet">
        {alphabet.map(([letter, code]) => (
          <div key={letter}>
            <dt>{letter}</dt>
            <dd>{code}</dd>
          </div>
        ))}
      </dl>

      <p>{text.space}</p>
    </aside>
  );
}