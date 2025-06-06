/* === content.js === */
document.addEventListener('mouseup', async () => {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  if (!text) return;

  const range = selection.getRangeAt(0);
  showPopup(text, 'Working...', range, true); // immediate feedback

  try {
    const translation = await fetch(`https://api.mymemory.translated.net/get?q=${text}&langpair=en|zh-CN`)
      .then(res => res.json())
      .then(data => data.responseData.translatedText);

    console.log('trans:', translation);
    showPopup(text, translation, range, false);
  } catch (err) {
    console.error('Translation fetch failed:', err);
    showPopup(text, 'Translation unavailable', range, false);
  }
});

function showPopup(text, translation, range, isPending = false) {
  const oldPopup = document.getElementById('popupEl');
  if (oldPopup) oldPopup.remove();

  const popup = document.createElement('span');
  popup.id = 'popupEl';
  popup.textContent = isPending ? 'Working...' :
    translation.length > 100 ? 'Selection too long, try fewer words' :
    `(${translation}) [+]`;

  popup.style.cssText = `
    background: yellow;
    border: 1px solid #888;
    padding: 3px 6px;
    font-size: 12px;
    color: black;
    border-radius: 5px;
    position: absolute;
    z-index: 99999;
    max-width: 300px;
    white-space: normal;
    cursor: pointer;
  `;

  if (!isPending && translation.length <= 100) {
    popup.addEventListener('click', (e) => {
      const sentence = getSentenceFromSelection();
      saveVocab(text, translation, sentence);
      popup.remove();
      showSavedToast(e.pageX, e.pageY);
    });
  }

  const rect = range.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  let top = rect.bottom + scrollTop + 5;
  let left = rect.left + scrollLeft;

  const maxBottom = scrollTop + window.innerHeight - 40;
  const maxRight = scrollLeft + window.innerWidth - 200;
  if (top > maxBottom) top = maxBottom;
  if (left > maxRight) left = maxRight;

  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
  document.body.appendChild(popup);
}

document.addEventListener('mousedown', function handleClickOutside(e) {
  const popup = document.getElementById('popupEl');
  if (popup && !popup.contains(e.target)) {
    popup.remove();
    document.removeEventListener('mousedown', handleClickOutside);
  }
});


function saveVocab(word, translation, sentence) {
  const url = window.location.href;
  const timestamp = new Date().toISOString();

  chrome.storage.local.get({ vocab: [] }, ({ vocab }) => {
    const exists = vocab.some(v => v.word === word && v.sentence === sentence);
    if (!exists) {
      vocab.push({ word, translation, sentence, url, timestamp });
      chrome.storage.local.set({ vocab });
      console.log('Saved:', { word, translation, sentence });
    }
  });
}

function getSentenceFromSelection() {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const parent = container.nodeType === 3 ? container.parentNode : container;
  return parent.innerText || selection.toString();
}

function showSavedToast(x, y) {
  const toast = document.createElement('div');
  toast.textContent = '✓ Saved!';
  toast.style.cssText = `
    position: absolute;
    top: ${y - 30}px;
    left: ${x}px;
    background: #4caf50;
    color: white;
    padding: 5px 10px;
    font-size: 12px;
    border-radius: 5px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    z-index: 100000;
    transition: opacity 0.3s ease;
    opacity: 1;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 800);
}

