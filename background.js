chrome.runtime.onInstalled.addListener(() => {
    console.log("Расширение установлено");
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
                return false; 
            }
        });

        chrome.storage.local.set({ exchangeTabs: exchangeTabs.filter(tab => tab.id) }, () => { // TODO: add filter
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

let exchangePrices = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updatePrices") {
        chrome.storage.local.get("prices", (data) => {
            let prices = data.prices || {};
            prices[message.exchange] = { bid: message.bid, ask: message.ask };
            chrome.storage.local.set({ prices }, () => {
                console.log(`Цены обновлены для ${message.exchange}:`, prices[message.exchange]);
                console.log("Все данные в storage:", prices);
            });
        });
    } else if (message.action === "getPrices") {
        chrome.storage.local.get("prices", (data) => {
            sendResponse({ prices: data.prices || {} });
        });
        return true;
    }
});

function runGetPrices() {
    chrome.storage.local.get("exchangeTabs", (data) => {
        if (!data.exchangeTabs || !Array.isArray(data.exchangeTabs) || data.exchangeTabs.length === 0) {
            console.log("Нет биржевых вкладок для парсинга.");
            return;
        }

        data.exchangeTabs.forEach((tab) => {
            if (tab.id) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: getPrices
                }).catch(err => console.error(`Ошибка при выполнении getPrices на вкладке ${tab.id}:`, err));
            }
        });
    });
}

function getPrices() {
    let bidList = [];
    let askList = [];
    const url = window.location.hostname;

    try {
        if (url.includes("binance.com")) {
            bidList = [...document.querySelectorAll('.orderbook-bid-price')].map(el => el.textContent.trim());
            askList = [...document.querySelectorAll('.orderbook-ask-price')].map(el => el.textContent.trim());
        } else if (url.includes("bybit.com")) {
            bidList = [...document.querySelectorAll('.bid-price')].map(el => el.textContent.trim());
            askList = [...document.querySelectorAll('.ask-price')].map(el => el.textContent.trim());
        } else if (url.includes("okx.com")) {
            bidList = [...document.querySelectorAll('.orderlist.bids .price')].map(el => el.textContent.trim());
            askList = [...document.querySelectorAll('.orderlist.asks .price')].map(el => el.textContent.trim());
        } else if (url.includes("mexc.com")) {
            bidList = [...document.querySelectorAll('.market_tableRow__Uuhwj.market_askRow__eRJes .market_price__V_09X.market_sell__SZ_It span')].map(el => el.textContent.trim());
            askList = [...document.querySelectorAll('.market_tableRow__Uuhwj.market_bidRow__6wAE6 .market_price__V_09X.market_buy__F9O7S span')].map(el => el.textContent.trim());
        } else if (url.includes("lbank.com")) {
            bidList = [...document.querySelectorAll('.orderlist.bids .price')].map(el => el.textContent.trim());
            askList = [...document.querySelectorAll('.orderlist.asks .price')].map(el => el.textContent.trim());
        } else if (url.includes("gate.io")) {
            bidList = [...document.querySelectorAll('.depth-list-item .sc-278b8b11-4.hNNPbI')].map(el => el.textContent.trim());
            askList = [...document.querySelectorAll('.depth-list-item .sc-278b8b11-4.logTeL')].map(el => el.textContent.trim());
        } else {
            console.log("Неизвестная биржа: " + url);
            return;
        }

        if (bidList.length > 0 && askList.length > 0) {
            chrome.runtime.sendMessage({
                action: "updatePrices",
                exchange: url,
                bid: bidList,
                ask: askList
            });
        } else {
            console.error("Цены не найдены на " + url);
        }
    } catch (error) {
        console.error("Ошибка при парсинге цен:", error);
    }
}

setInterval(runGetPrices, 500);