document.querySelector('#capture').addEventListener('click', async () => {
  const status = document.querySelector('#status');
  status.textContent = 'İlanlar okunuyor…';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const r = await chrome.tabs.sendMessage(tab.id, { action: 'RESCAN' });
    status.textContent = r?.message || 'Pusula’dan arama başlat.';
  } catch { status.textContent = 'Pusula’nın açtığı iş arama sekmesinde kullan. Eklentiyi yeni kurduysan sayfayı yenile.'; }
});
