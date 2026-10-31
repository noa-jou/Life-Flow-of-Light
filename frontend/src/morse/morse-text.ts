export const morseText = {
    en: {
        description: 'Search for Morse code messages in past lighting activity.',
    },
    'zh-Hant': {
        description: '從過去的燈光活動中搜尋摩斯密碼訊息。',
    },
};

export const guideText = {
    en: {
        instructionsTitle: 'Try light Morse code',
        controls:
            'Collapse House to use its hold-to-light buttons. Use the same bulb for the whole message. Hold to turn it on; release to turn it off. Watch the live timeline in History as you practise.',
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
            '收合 House，使用按住亮燈的按鈕。整段訊息請使用同一顆燈泡：按住開燈，放開關燈。練習時可以觀察 History 的即時燈光紀錄。',
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