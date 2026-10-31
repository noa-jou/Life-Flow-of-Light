import type { Language } from '../i18n';
import { morseText } from './morse-text';
import MorseGuide from './MorseGuide';
import './MorsePanel.css';

type Props = {
  expanded: boolean;
  language: Language;
};

export default function MorsePanel({ expanded, language }: Props) {
  const text = morseText[language];

  if (!expanded) return null;

  return (
    <div className="morse-panel">
      <p className="morse-description">
        {text.description}
      </p>

      <MorseGuide language={language} part="instructions" />
      <MorseGuide language={language} part="alphabet" />
    </div>
  );
}