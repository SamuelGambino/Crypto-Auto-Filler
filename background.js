let intervalId = null;
let activeExchange = null;
let activeSymbol = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'start-tracking') {
    const { exchange, symbol } = message;

    if (intervalId) clearInterval(intervalId);

    activeExchange = exchange;
    activeSymbol = symbol;

    if (exchange === 'mexc') {
      intervalId = setInterval(() => {
        fetch(`https://contract.mexc.com/api/v1/contract/depth.symbol?symbol=${symbol}_USDT`)
          .then(res => res.json())
          .then(data => {
            const bid = data.data?.bids?.[0]?.[0];
            const ask = data.data?.asks?.[0]?.[0];
            console.log(`[MEXC] ${symbol} — Bid: ${bid}, Ask: ${ask}`);
          })
          .catch(err => console.error('[MEXC] Ошибка:', err));
      }, 1000);
    }
  }

  if (message.type === 'stop-tracking') {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    activeExchange = null;
    activeSymbol = null;
    console.log('[INFO] Трекинг остановлен');
  }
});