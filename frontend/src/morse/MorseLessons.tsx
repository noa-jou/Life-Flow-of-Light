import type { Language } from '../i18n';
import { morseText } from './morse-text';

export type LessonId = 1 | 2 | 3 | 4;

type Props = {
  language: Language;
  activeLesson: LessonId | null;
  onLessonChange: (lesson: LessonId | null) => void;
};

const lessonIds: LessonId[] = [1, 2, 3, 4];

export default function MorseLessons({
  language,
  activeLesson,
  onLessonChange,
}: Props) {
  const text = morseText[language];

  return (
    <div className="morse-lessons">
      {lessonIds.map((id) => (
        <section
          key={id}
          id={`morse-lesson-${id}`}
          className="morse-lesson-content"
          aria-labelledby={`morse-lesson-button-${id}`}
          hidden={activeLesson !== id}
        >
          <h3>{text.lessonTitles[id - 1]}</h3>
        </section>
      ))}

      <div className="morse-lesson-buttons">
        {lessonIds.map((id) => (
          <button
            key={id}
            id={`morse-lesson-button-${id}`}
            type="button"
            aria-expanded={activeLesson === id}
            aria-controls={`morse-lesson-${id}`}
            onClick={() => {
              onLessonChange(activeLesson === id ? null : id);
            }}
          >
            Lesson {id}
          </button>
        ))}
      </div>
    </div>
  );
}