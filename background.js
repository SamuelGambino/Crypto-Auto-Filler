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

function getAveragePrice(priceList) {
    let sum = 0;
    let count = 0;

    priceList.forEach(element => {
        let priceStr = element?.textContent.trim().replace(/,/g, '');
        let price = parseFloat(priceStr);

        if (!isNaN(price)) {
            sum += price;
            count++;
        }
    });

    if (count > 0) {
        return sum / count;
    } else {
        console.error(`Нет валидных цен для селектора: ${selector}`);
        return null;
    }
}

function getPrices() {
    let bidList = null;
    let askList = null;
    const url = window.location.hostname;

    try {
        if (url.includes("binance.com")) {
            bidList = document.querySelectorAll('.orderbook-bid-price');
            askList = document.querySelectorAll('.orderbook-ask-price');
        } else if (url.includes("bybit.com")) {
            bidList = document.querySelectorAll('.bid-price');
            askList = document.querySelectorAll('.ask-price');
        } else if (url.includes("okx.com")) {
            bidList = document.querySelectorAll('.orderlist.bids .price');
            askList = document.querySelectorAll('.orderlist.asks .price');
        } else if (url.includes("mexc.com")) {
            bidList = document.querySelectorAll('.market_tableRow__Uuhwj.market_askRow__eRJes .market_price__V_09X.market_sell__SZ_It span');
            askList = document.querySelectorAll('.market_tableRow__Uuhwj.market_bidRow__6wAE6 .market_price__V_09X.market_buy__F9O7S span');
        } else if (url.includes("lbank.com")) {
            bidList = document.querySelectorAll('.orderlist.bids .price');
            askList = document.querySelectorAll('.orderlist.asks .price');
        } else if (url.includes("gate.io")) {
            bidList = document.querySelectorAll('.depth-list-item .sc-278b8b11-4.hNNPbI');
            askList = document.querySelectorAll('.depth-list-item .sc-278b8b11-4.logTeL');
        } else {
            console.log("Неизвестная биржа: " + url);
            return;
        }

        bid = getAveragePrice(bidList);
        ask = getAveragePrice(askList);

        if (bid && ask) {
            chrome.runtime.sendMessage({
                action: "updatePrices",
                exchange: url,
                bid: bid,
                ask: ask
            });
        }
    } catch (error) {
        console.error("Ошибка при парсинге цен:", error);
    }
}

setInterval(runGetPrices, 500);