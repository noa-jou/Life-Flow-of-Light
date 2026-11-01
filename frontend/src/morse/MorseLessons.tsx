import type { Language } from '../i18n';
import { lessonText, morseText } from './morse-text';

export type LessonId = 1 | 2 | 3 | 4;

type Props = {
  language: Language;
  activeLesson: LessonId | null;
  onLessonChange: (lesson: LessonId | null) => void;
};

const lessonIds: LessonId[] = [1, 2, 3, 4];

const alphabet: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
};

type LessonLabels = (typeof lessonText)[Language];

function AlphabetTable({ text }: { text: LessonLabels }) {
  return (
    <div className="morse-alphabet">
      {Object.entries(alphabet).map(([letter, code]) => (
        <div className="morse-alphabet-item" key={letter}>
          <strong>{letter}</strong>
          <code aria-label={`${text.code}: ${code}`}>
            {code.replaceAll('.', '·').replaceAll('-', '−')}
          </code>
        </div>
      ))}
    </div>
  );
}

function SignalActions({
  message,
  text,
}: {
  message: string;
  text: LessonLabels;
}) {
  const words = message.split(' ');

  return (
    <div className="morse-action-guide">
      {words.map((word, wordIndex) => (
        <section className="morse-word-guide" key={`${wordIndex}-${word}`}>
          <h4>{word}</h4>

          {Array.from(word).map((letter, letterIndex) => {
            const code = alphabet[letter];
            const lastLetter = letterIndex === word.length - 1;
            const lastWord = wordIndex === words.length - 1;
            const finished = lastLetter && lastWord;

            // The boundary gap replaces the signal gap; it is not added.
            const boundarySeconds = finished
              ? 18
              : lastLetter
                ? 14
                : 6;

            const boundaryLabel = finished
              ? text.end
              : lastLetter
                ? text.nextWord
                : text.nextLetter;

            return (
              <div
                className="morse-letter-guide"
                key={`${letterIndex}-${letter}`}
              >
                <div className="morse-letter-heading">
                  <strong>{letter}</strong>
                  <code>
                    {code.replaceAll('.', '·').replaceAll('-', '−')}
                  </code>
                </div>

                <ol className="morse-action-list" aria-label={text.actions}>
                  {Array.from(code).map((signal, signalIndex) => (
                    <li key={signalIndex}>
                      <span className="morse-action-on">
                        {text.hold} {signal === '.' ? 2 : 6} {text.seconds}
                      </span>

                      {signalIndex < code.length - 1 && (
                        <>
                          <span aria-hidden="true"> → </span>
                          <span className="morse-action-off">
                            {text.release} 2 {text.seconds}
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ol>

                <p className="morse-boundary-gap">
                  {text.release} {boundarySeconds} {text.seconds}
                  {' — '}
                  {boundaryLabel}
                </p>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

export default function MorseLessons({
  language,
  activeLesson,
  onLessonChange,
}: Props) {
  const text = lessonText[language];
  const panelText = morseText[language];

  function renderContent(lesson: LessonId) {
    switch (lesson) {
      case 1:
        return (
          <>
            <p>{text.preparation}</p>
            <p>{text.watch}</p>
            <p>{text.sosIntro}</p>
            <p>{text.letterGap}</p>

            <SignalActions message="SOS" text={text} />

            <p>{text.finish}</p>
          </>
        );

      case 2:
        return (
          <>
            <p>{text.preparation}</p>
            <p>{text.lettersIntro}</p>
            <p className="morse-timing-lines">{text.timing}</p>
            <p>{text.letterGap}</p>
            <h4>{text.alphabet}</h4>
            <AlphabetTable text={text} />

            <p>{text.finish}</p>
          </>
        );

      case 3:
        return (
          <>
            <p>{text.preparation}</p>
            <p>{text.sentenceIntro}</p>
            <p>{text.wordGap}</p>

            <SignalActions message="I CAN USE MORSE CODE" text={text} />

            <p>{text.finish}</p>
          </>
        );

      case 4:
        return (
          <>
            <p>{text.preparation}</p>
            <p>{text.ownIntro}</p>

            <h4>{text.alphabet}</h4>
            <AlphabetTable text={text} />

            <p>{text.letterGap}</p>
            <p>{text.wordGap}</p>
            <p>{text.punctuation}</p>
            <p>{text.finish}</p>
          </>
        );
    }
  }

  return (
    <div className="morse-lessons">
      {lessonIds.map((lesson) => (
        <section
          key={lesson}
          id={`morse-lesson-${lesson}`}
          className="morse-lesson-content"
          aria-labelledby={`morse-lesson-button-${lesson}`}
          hidden={activeLesson !== lesson}
        >
          <h3>{panelText.lessonTitles[lesson - 1]}</h3>
          {renderContent(lesson)}
        </section>
      ))}

      <div className="morse-lesson-buttons">
        {lessonIds.map((lesson) => (
          <button
            key={lesson}
            id={`morse-lesson-button-${lesson}`}
            type="button"
            aria-expanded={activeLesson === lesson}
            aria-controls={`morse-lesson-${lesson}`}
            onClick={() => {
              onLessonChange(activeLesson === lesson ? null : lesson);
            }}
          >
            Lesson {lesson}
          </button>
        ))}
      </div>
    </div>
  );
}