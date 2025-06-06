function renderVocabList() {
  chrome.storage.local.get({ vocab: [] }, ({ vocab }) => {
    const list = document.getElementById('vocab-list');
    list.innerHTML = '';
    vocab.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = `${item.word} (${item.translation})`;
      const removeBtn = document.createElement('span');
      removeBtn.textContent = 'x';
      removeBtn.className = 'remove';
      removeBtn.addEventListener('click', () => {
        vocab.splice(index, 1);
        chrome.storage.local.set({ vocab }, renderVocabList);
      });
      li.appendChild(removeBtn);
      list.appendChild(li);
    });
  });
}

document.getElementById('export').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'downloadVocab' });
});

document.addEventListener('DOMContentLoaded', renderVocabList);


document.getElementById('clearAll').addEventListener('click', () => {
  chrome.storage.local.set({ vocab: [] }, renderVocabList);
});
