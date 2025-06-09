function renderVocabList() {
  chrome.storage.local.get({ vocab: [] }, ({ vocab }) => {
    const list = document.getElementById('vocab-list');
    list.innerHTML = '';
    
    if (vocab.length === 0) {
      list.innerHTML = '<div class="empty-state">No saved vocabulary yet</div>';
      return;
    }

    vocab.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'vocab-item';
      
      const content = document.createElement('div');
      content.className = 'vocab-content';
      
      const word = document.createElement('div');
      word.className = 'vocab-word';
      word.textContent = item.word;
      
      const translation = document.createElement('div');
      translation.className = 'vocab-translation';
      translation.textContent = item.translation;
      
      content.appendChild(word);
      content.appendChild(translation);
      
      const removeBtn = document.createElement('span');
      removeBtn.textContent = 'x';
      removeBtn.className = 'remove';
      removeBtn.title = 'Remove this word';
      removeBtn.addEventListener('click', () => {
        vocab.splice(index, 1);
        chrome.storage.local.set({ vocab }, renderVocabList);
      });
      
      li.appendChild(content);
      li.appendChild(removeBtn);
      list.appendChild(li);
    });
  });
}

document.getElementById('export').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'downloadVocab' });
});

document.getElementById('clearAll').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all saved vocabulary?')) {
    chrome.storage.local.set({ vocab: [] }, renderVocabList);
  }
});

document.addEventListener('DOMContentLoaded', renderVocabList);
