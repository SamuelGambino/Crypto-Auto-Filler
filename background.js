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

        chrome.runtime.sendMessage({ action: "updateTabs", tabs: exchangeTabs }, response => {
            if (chrome.runtime.lastError) {
                console.warn("Ошибка при отправке сообщения:", chrome.runtime.lastError);
            } else {
                console.log("Сообщение успешно отправлено!", response);
            }
        });
    });
}

chrome.tabs.onUpdated.addListener(updateExchangeTabs);
chrome.tabs.onRemoved.addListener(updateExchangeTabs);
chrome.tabs.onCreated.addListener(updateExchangeTabs);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getExchangeTabs") {
        updateExchangeTabs();
    }
});
