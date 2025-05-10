let savedValue = "";
const trackers = {}; // { tabId: { intervalId, config } }

const exchangeAPIs = {
  mexc: (symbol) =>
    fetch(`https://contract.mexc.com/api/v1/contract/depth/${symbol}_USDT`)
      .then(res => res.json())
      .then(data => ({
        bid: parseFloat(data.data?.bids?.[0]?.[0]),
        ask: parseFloat(data.data?.asks?.[0]?.[0])
      })),

  mexcS: (symbol) =>
    fetch(`https://api.mexc.com/api/v3/depth?symbol=${symbol}USDT&limit=1`)
      .then(res => res.json())
      .then(data => ({
        bid: parseFloat(data.bids?.[0]?.[0]),
        ask: parseFloat(data.asks?.[0]?.[0])
      })),

  gate: (symbol) =>
    fetch(`https://api.gateio.ws/api/v4/futures/usdt/order_book?contract=${symbol}_USDT&limit=1`)
      .then(res => res.json())
      .then(data => ({
        bid: parseFloat(data.bids?.[0]?.p),
        ask: parseFloat(data.asks?.[0]?.p)
      })),
  
  gateS: (symbol) =>
    fetch(`https://api.gateio.ws/api/v4/spot/order_book?currency_pair=${symbol}_USDT&limit=1`)
      .then(res => res.json())
      .then(data => ({
        bid: parseFloat(data.bids?.[0]?.[0]),
        ask: parseFloat(data.asks?.[0]?.[0])
      })),

  // lbankS: (symbol) =>
  //   fetch(`https://corsproxy.io/?https://api.lbkex.com/v2/depth.do?symbol=${symbol.toLowerCase()}_usdt&size=1&type=step0`)
  //     .then(res => res.json())
  //     .then(data => {
  //       if (data.result !== "true" || !data.data) {
  //         console.error('[LBANK] Неверный ответ:', data);
  //         throw new Error('Некорректный ответ от LBank');
  //       }
  //       return {
  //         bid: parseFloat(data.data.bids?.[0]?.[0]),
  //         ask: parseFloat(data.data.asks?.[0]?.[0])
  //       };
  //     }),

  bitgetS: (symbol) =>
    fetch(`https://api.bitget.com/api/v2/spot/market/orderbook?symbol=${symbol}USDT&type=step0&limit=1`)
      .then(res => res.json())
      .then(data => ({
        bid: parseFloat(data.data?.bids?.[0]?.[0]),
        ask: parseFloat(data.data?.asks?.[0]?.[0])
      })),

  bitget: (symbol) =>
    fetch(`https://api.bitget.com/api/v2/mix/market/orderbook?symbol=${symbol}USDT&productType=umcbl&limit=1`)
      .then(res => res.json())
      .then(data => ({
        bid: parseFloat(data.data?.bids?.[0]?.[0]),
        ask: parseFloat(data.data?.asks?.[0]?.[0])
      })),

  kucoinS: (symbol) =>
    fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}-USDT`)
      .then(res => res.json())
      .then(data => ({
        bid: parseFloat(data.data?.bestBid),
        ask: parseFloat(data.data?.bestAsk)
      })),
        
  kucoin: (symbol) =>
    fetch(`https://api-futures.kucoin.com/api/v1/level2/snapshot?symbol=${symbol}USDTM`)
      .then(res => res.json())
      .then(data => ({
        bid: parseFloat(data.data?.bids?.[0]?.[0]),
        ask: parseFloat(data.data?.asks?.[0]?.[0])
      }))

};

function calculateSpread(data1, data2) {
  if (!data1 || !data2) return null;
  console.log(data1, data2);
  spreadIn = ((data2.bid - data1.ask) / data2.bid) * 100;
  spreadOut = ((data2.ask - data1.bid) / data2.ask) * 100;
  return [spreadIn.toFixed(2), spreadOut.toFixed(2)];
}

function startTracking(tabId, config) {
  if (trackers[tabId]?.intervalId) clearInterval(trackers[tabId].intervalId);

  const intervalId = setInterval(() => {
    const { exchange1, exchange2, symbol } = config;

    Promise.all([
      exchangeAPIs[exchange1](symbol),
      exchangeAPIs[exchange2](symbol)
    ])
      .then(([data1, data2]) => {
        const [spreadIn, spreadOut] = calculateSpread(data1, data2);
        console.log(`[SPREAD] ${symbol} — ${exchange1} vs ${exchange2}: Вход ${spreadIn}, Выход: ${spreadOut}`);

        chrome.runtime.sendMessage({
          type: "spread-update",
          tabId,
          spread: { spreadIn, spreadOut },
          data: { [exchange1]: data1, [exchange2]: data2 }
        });
      })
      .catch(err => {
        console.error(`[ERROR: ${tabId}]`, err);
      });
  }, 500);

  trackers[tabId] = { intervalId, config };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "start-tracking") {
    startTracking(message.tabId, {
      exchange1: message.exchange1,
      exchange2: message.exchange2,
      symbol: message.symbol
    });
  } else if (message.type === "stop-tracking") {
    const tabId = message.tabId;
    if (trackers[tabId]) {
      clearInterval(trackers[tabId].intervalId);
      delete trackers[tabId];
    }
    console.log('[INFO] Трекинг остановлен');
  } else if (message.action === "saveValue") {
    savedValue = message.value;
    sendResponse({ success: true });
  } else if (message.action === "getSavedValue") {
    sendResponse({ savedValue });
  }
  return true;
});

function updateExchangeTabs() {
    chrome.tabs.query({}, function (tabs) {
        const exchangeTabs = tabs.filter(tab => {
            try {
                const url = new URL(tab.url);
                return url.hostname.includes('binance.com') 
                || url.hostname.includes('bingx.com')
                || url.hostname.includes('bitget.com')
                || url.hostname.includes('bitmart.com')
                || url.hostname.includes('bitmex.com')
                || url.hostname.includes('bybit.com')
                || url.hostname.includes('bybit.global')
                || url.hostname.includes('coinex.com')
                || url.hostname.includes('coinex.net')
                || url.hostname.includes('gate.io')
                || url.hostname.includes('htx.com')
                || url.hostname.includes('htx.me')
                || url.hostname.includes('huobi.com')
                || url.hostname.includes('huobi.pro')
                || url.hostname.includes('kucoin.com')
                || url.hostname.includes('kucoin.io')
                || url.hostname.includes('lbank.com')
                || url.hostname.includes('lbank.info')
                || url.hostname.includes('mexc.com')
                || url.hostname.includes('futures.mexc.com')
                || url.hostname.includes('okx.com')
                || url.hostname.includes('poloniex.com')
                || url.hostname.includes('xt.com');
            } catch (e) {
                return false; // На случай, если url некорректен
            }
        });

        chrome.storage.local.set({ exchangeTabs: exchangeTabs }, () => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка сохранения exchangeTabs:", chrome.runtime.lastError);
            } else {
                console.log("exchangeTabs успешно сохранены");
            }
        });
    });
}

chrome.tabs.onRemoved.addListener(updateExchangeTabs);
chrome.tabs.onCreated.addListener(updateExchangeTabs);
setTimeout(() => { chrome.tabs.onUpdated.addListener(updateExchangeTabs); }, 15000);

chrome.runtime.onInstalled.addListener(updateExchangeTabs);

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === "getCurrentTabId") {
//         sendResponse({ tabId: sender.tab.id });
//     }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getCurrentTabId" && sender.tab) {
        sendResponse({ currentTabId: sender.tab.id });
    }
});