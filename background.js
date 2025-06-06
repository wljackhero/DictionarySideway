/* === background.js === */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'downloadVocab') {
    chrome.storage.local.get({ vocab: [] }, ({ vocab }) => {
      let content = '\uFEFF'; // UTF-8 BOM
      content += 'Word,Translation,Sentence,URL,Timestamp\n';
      content += vocab.map(v =>
        `"${v.word}","${v.translation}","${v.sentence}","${v.url}","${v.timestamp}"`
      ).join('\n');

      const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(content);

      chrome.downloads.download({
        url: dataUrl,
        filename: 'vocab.csv',
        saveAs: true
      });
    });
  }
});

