// Define the language codes shared by the entire application.
// "zh-Hant" represents Traditional Chinese.
export type Language = 'en' | 'zh-Hant';

export const appText = {
  en: {
    appName: 'Life Flow of Light',
    languageLabel: 'Language',
    expand: 'Expand',
    collapse: 'Collapse',
    singleClientWarning:
      'Use only one tab or window for this PoC to avoid interference.',
    reloadWarning:
      'Reloading or closing this page stops signals sending. All switches start off when the page opens.',
    panels: {
      1: 'Bulbs',
      2: 'House',
      3: 'History',
    },
  },
  'zh-Hant': {
    appName: '歲月流明',
    languageLabel: '語言',
    expand: '展開',
    collapse: '收合',
    singleClientWarning:
      '此 PoC 請只開啟一個分頁或視窗，避免干擾燈泡模擬。',
    reloadWarning:
      '重新整理或關閉頁面會中斷訊息發送；重新開啟後，所有開關預設為關閉。',
    panels: {
      1: '燈泡',
      2: '屋子',
      3: '歷史',
    },
  },
};

// Shared text for page dialogs.
export const dialogText = {
  en: {
    title: 'Notice',
    confirm: 'Confirm',
    cancel: 'Cancel',
    close: 'OK',
  },
  'zh-Hant': {
    title: '提示',
    confirm: '確認',
    cancel: '取消',
    close: '確定',
  },
};