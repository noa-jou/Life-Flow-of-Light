export const morseText = {
    en: {
        description: 'Search for Morse code messages in past lighting activity.',
        lessonTitles: [
            'Try sending SOS',
            'Try other English letters',
            'Send a sentence',
            'Write your own message',
        ],
        condition: 'Condition',
        from: 'From',
        to: 'To',
        find: 'Find',
        localTime: 'Local time',
        position: 'Position',
        bulb: 'Bulb',
        message: 'Message',
        notSearched: 'Choose a time range to search.',
        invalidDateRange:
            'To must be at least one minute after From.',
        searching: 'Searching…',
        noData: 'No data',
        searchFailed:
            'Search failed. Please check the backend connection or try a shorter time range.',
        oldestFirst: 'Oldest first',
        newestFirst: 'Newest first',
        living_room: 'Living Room',
        bedroom: 'Bedroom',
        bathroom: 'Bathroom',
    },
    'zh-Hant': {
        description: '從過去的燈光活動中搜尋摩斯密碼訊息。',
        lessonTitles: [
            '試試傳送 SOS',
            '試試其他英文字母',
            '傳送一句英文句子',
            '自己組一句訊息',
        ],
        condition: '查詢條件',
        from: '開始',
        to: '結束',
        find: '搜尋',
        localTime: '本地時間',
        position: '房間',
        bulb: '燈泡',
        message: '訊息',
        notSearched: '請選擇時間範圍進行搜尋。',
        invalidDateRange:
            '結束時間必須比開始時間晚至少一分鐘。',
        searching: '搜尋中…',
        noData: '沒有資料',
        searchFailed:
            '搜尋失敗。請檢查後端連線，或縮短搜尋時間範圍後重試。',
        oldestFirst: '時間由舊到新',
        newestFirst: '時間由新到舊',
        living_room: '客廳',
        bedroom: '臥室',
        bathroom: '浴室',
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

export const lessonText = {
  en: {
    preparation:
      'Collapse House to use its buttons as Morse keys. Choose a position with an installed bulb, and use the same bulb for the whole message.',
    watch:
      'Watch the live light cells in History. Each cell represents one second. Hold the button to light the bulb; release it to turn it off.',
    timing:
      'Dot: hold for 2 seconds. Dash: hold for 6 seconds. Between signals within one letter: release for 2 seconds.',
    letterGap:
      'Between letters in the same word, release for 6 seconds.',
    wordGap:
      'Between words, release for 14 seconds.',
    noAdding:
      'Use only the gap required at that boundary. Do not add the 2-second signal gap to a letter or word gap.',
    finish:
      'After the final signal, keep the bulb off for at least 18 seconds before searching.',
    check:
      'Set From to before your first signal and To to after your last signal. The search range must be at least one minute long. Click Find to check your message.',
    sosIntro:
      'Send S, then O, then S. Follow the actions below from left to right.',
    lettersIntro:
      'Choose a letter from the A–Z table and practise sending it. You can then combine several letters into a word.',
    sentenceIntro:
      'Your target is I CAN USE MORSE CODE. Send one word at a time, following the actions below.',
    ownIntro:
      'Choose a short English sentence of your own. Use the A–Z table to work out its signals.',
    punctuation:
      'This PoC currently decodes A–Z and spaces only. For now, leave out punctuation and numbers; punctuation decoding has not been added yet.',
    alphabet: 'A–Z reference',
    actions: 'Actions',
    letter: 'Letter',
    code: 'Code',
    hold: 'Hold',
    release: 'Release',
    seconds: 's',
    nextLetter: 'Next letter',
    nextWord: 'Next word',
    end: 'Message complete',
  },
  'zh-Hant': {
    preparation:
      '收合 House，讓按鈕變成摩斯密碼按鍵。選擇已安裝燈泡的位置，整段訊息都使用同一顆燈泡。',
    watch:
      '留意 History 的即時燈光格子，每格代表一秒。按住按鈕會亮燈，放開就會關燈。',
    timing:
      'Dot：按住 2 秒。Dash：按住 6 秒。同一字母內，兩個訊號之間放開 2 秒。',
    letterGap:
      '同一單字內，兩個字母之間放開 6 秒。',
    wordGap:
      '不同單字之間放開 14 秒。',
    noAdding:
      '每個交界只使用該處需要的間隔，不要把訊號間的 2 秒再加到字母或單字間隔上。',
    finish:
      '最後一個訊號結束後，保持關燈至少 18 秒，再進行搜尋。',
    check:
      '將 From 設在第一個訊號之前，To 設在最後一個訊號之後，整個搜尋範圍至少一分鐘。按 Find 檢查自己的訊息。',
    sosIntro:
      '依序傳送 S、O、S，按照下方動作由左至右操作。',
    lettersIntro:
      '從 A–Z 對照表選一個字母，練習傳送。熟悉後，再把幾個字母組成單字。',
    sentenceIntro:
      '目標是傳送 I CAN USE MORSE CODE。按照下方動作，一個單字接著一個單字傳送。',
    ownIntro:
      '自己想一句簡短的英文句子，利用 A–Z 對照表找出需要的訊號。',
    punctuation:
      '這個 PoC 目前只解讀 A–Z 和空格，尚未加入標點符號與數字的解碼。這一階段練習時，請先省略標點與數字。',
    alphabet: 'A–Z 對照表',
    actions: '操作步驟',
    letter: '字母',
    code: '訊號',
    hold: '按住',
    release: '放開',
    seconds: '秒',
    nextLetter: '下一個字母',
    nextWord: '下一個單字',
    end: '訊息完成',
  },
};