const origin = 'https://pusula-is-arama.zeynepaktaserden.chatgpt.site';
window.addEventListener('message', async event => {
  if (event.source !== window || event.origin !== origin || event.data?.channel !== 'pusula-app') return;
  const { action, requestId, query, city, sources } = event.data;
  if (!['PING', 'START', 'CANCEL'].includes(action)) return;
  try {
    const result = await chrome.runtime.sendMessage({ action, requestId, query, city, sources });
    window.postMessage({ channel: 'pusula-extension', ...result }, origin);
  } catch {
    window.postMessage({ channel: 'pusula-extension', type: 'ERROR', requestId, message: 'Eklenti bağlantısı kesildi. Sayfayı yenile.' }, origin);
  }
});
chrome.runtime.onMessage.addListener(message => {
  window.postMessage({ ...message, channel: 'pusula-extension' }, origin);
});
