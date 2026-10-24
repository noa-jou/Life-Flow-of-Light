import type { Language } from '../i18n';

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

const guideText = {
  en: {
    instructionsTitle: 'Try light Morse code',
    controls:
      'Use the same bulb for the whole message. Click once to turn it on, then click again to turn it off.',
    timingIntro: 'Aim for these durations:',
    timing: [
      ['Dot (.)', 'On for 2 seconds'],
      ['Dash (-)', 'On for 6 seconds'],
      ['Within a letter', 'Off for 2 seconds'],
      ['Between letters', 'Off for 6 seconds'],
      ['Between words', 'Off for 14 seconds'],
    ],
    practiceTitle: 'Try SOS',
    practice:
      'Send three dots, three dashes, then three dots. Pause for 2 seconds between signals within each letter, and 6 seconds between letters.',
    finish:
      'After the final signal, leave the bulb off for at least 18 seconds before checking for a completed message.',
    timingNote:
      'Steady timing matters more than speed. These timings match this PoC; network delays may affect recognition.',
    alphabetTitle: 'A–Z reference',
    symbols: '. = dot · - = dash',
    space:
      'A space has no light pattern. Leave the bulb off for 14 seconds between words.',
  },
  'zh-Hant': {
    instructionsTitle: '試玩燈光摩斯密碼',
    controls:
      '整段訊息請使用同一顆燈泡。點一下開燈，再點一下關燈。',
    timingIntro: '請盡量按照以下時間操作：',
    timing: [
      ['點（.）', '亮 2 秒'],
      ['劃（-）', '亮 6 秒'],
      ['同一字母內', '熄燈 2 秒'],
      ['字母之間', '熄燈 6 秒'],
      ['單字之間', '熄燈 14 秒'],
    ],
    practiceTitle: '試試 SOS',
    practice:
      '依序發出三個點、三個劃、三個點。同一字母的訊號之間熄燈 2 秒，字母之間熄燈 6 秒。',
    finish:
      '最後一個訊號結束後，請保持熄燈至少 18 秒，再查詢完整訊息。',
    timingNote:
      '節奏穩定比手速重要。這些時間配合本 PoC 的規則；網路延遲可能影響辨識。',
    alphabetTitle: 'A–Z 對照表',
    symbols: '. = 點 · - = 劃',
    space:
      '空格沒有獨立的閃燈組合。單字之間保持熄燈 14 秒，就表示空格。',
  },
};

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