let intervalId = null;
let activeExchange = null;
let activeSymbol = null;
let savedValue = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveValue") {
    savedValue = message.value;
    sendResponse({ success: true });
  } else if (message.action === "getSavedValue") {
    sendResponse({ savedValue });
  } else if (message.type === "start-tracking") {
    console.log("Start tracking", message.exchange, message.symbol);
    const { exchange, symbol } = message;

    if (intervalId) clearInterval(intervalId);

    activeExchange = exchange;
    activeSymbol = symbol;

    if (exchange === 'mexc') {
      intervalId = setInterval(() => {
        fetch(`https://contract.mexc.com/api/v1/contract/depth/${symbol}_USDT`)
          .then(res => res.json())
          .then(data => {
            const bid = data.data?.bids?.[0]?.[0];
            const ask = data.data?.asks?.[0]?.[0];
            console.log(`[MEXC] ${symbol} — Bid: ${bid}, Ask: ${ask}`);
          })
          .catch(err => console.error('[MEXC] Ошибка:', err));
      }, 1000);
    }    
  } else if (message.type === "stop-tracking") {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    activeExchange = null;
    activeSymbol = null;
    console.log('[INFO] Трекинг остановлен');
  }
  return true; // важно для async-ответов
});