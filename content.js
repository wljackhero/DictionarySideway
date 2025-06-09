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
    outline: none;
  `;

  // 先获取 sentence
  const sentence = getSentenceFromSelection();

  if (!isPending && translation.length <= 100) {
    popup.addEventListener('click', (e) => {
      saveVocab(text, translation, sentence); // 直接用提前获取的 sentence
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

  // 自动获取焦点
  popup.focus();

  // 添加失去焦点事件监听
  popup.addEventListener('blur', () => {
    setTimeout(() => {
      if (document.activeElement !== popup) {
        popup.remove();
      }
    }, 100);
  });
}

function saveVocab(word, translation, sentence) {
  const url = window.location.href;
  const timestamp = new Date().toISOString();

  // 清理 sentence 中的多余空白字符
  sentence = sentence.trim().replace(/\s+/g, ' ');
  
  // 如果 sentence 太长，截取合适长度
  if (sentence.length > 500) {
    sentence = sentence.substring(0, 497) + '...';
  }

  console.log('[Vocab Save] word:', word, '| sentence:', sentence);

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
  if (!selection.rangeCount) return selection.toString();

  const range = selection.getRangeAt(0);
  let container = range.commonAncestorContainer;
  let parent = container.nodeType === 3 ? container.parentNode : container;

  // 获取父元素文本
  const text = parent.innerText || parent.textContent || selection.toString();
  const selectedText = selection.toString().trim();

  // 用正则分割成句子
  const sentences = text.match(/[^.!?\n]+[.!?]?/g) || [text];

  // 找到包含选中单词的句子
  let found = sentences.find(s => s.includes(selectedText));
  if (!found) found = selectedText; // fallback

  return found.trim();
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

