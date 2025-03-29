const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function fillField(targetField) {
    if (!targetField) {
        return;
    }

    storage.sync.get(["savedValue"]).then((result) => {
        const savedValue = result.savedValue ?? "";

        if (targetField.value === "" || targetField.value === "0") {
            targetField.value = savedValue;
            const event = new Event("input", { bubbles: true });
            targetField.dispatchEvent(event);
            console.log("Auto Filler: Field filled:", targetField);
        }
    }).catch(error => {
        console.error("AutoFiller: Error getting saved value:", error);
    });
}

const debouncedFillAllFields = debounce(() => {
    const textFields = document.querySelectorAll('input[type="text"]');
    textFields.forEach(fillField);
}, 200);

let observer = null;

function checkAndStartFilling(currentTabId) {
    chrome.storage.local.get(["selectedTabId1", "selectedTabId2"], function (result) {
        if (result.selectedTabId1 == currentTabId || result.selectedTabId2 == currentTabId) {
            console.log(`✅ AutoFiller работает на вкладке ${currentTabId}`);
            debouncedFillAllFields();

            if (!observer) {
                observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.target === null) return;
                        debouncedFillAllFields();
                    });
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ["value", "type"]
                });

                document.body.addEventListener("input", debouncedFillAllFields);
                document.body.addEventListener("change", debouncedFillAllFields);
                document.body.addEventListener("blur", debouncedFillAllFields, true);
            }
        } else {
            console.log(`❌ AutoFiller НЕ работает на вкладке ${currentTabId} (не выбрана)`);
        }
    });
}

chrome.runtime.sendMessage({ action: "getCurrentTabId" }, (response) => {
    if (!response || !response.currentTabId) {
        console.warn("❌ AutoFiller: Не удалось получить ID вкладки.");
        return;
    }
    checkAndStartFilling(response.currentTabId);
});

window.addEventListener("beforeunload", () => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
});

function getPrices() {
    let bid = null;
    let ask = null;
    
    const url = window.location.hostname;

    if (url.includes("binance.com")) {
        bid = document.querySelector('.orderbook-bid-price')?.textContent.trim();
        ask = document.querySelector('.orderbook-ask-price')?.textContent.trim();
    } else if (url.includes("bybit.com")) {
        bid = document.querySelector('.bid-price')?.textContent.trim();
        ask = document.querySelector('.ask-price')?.textContent.trim();
    } else if (url.includes("okx.com")) {
        bid = document.querySelector('.orderlist.bids .price')?.textContent.trim();
        ask = document.querySelector('.orderlist.asks .price')?.textContent.trim();
    } else if (url.includes("mexc.com")) {
        bid = document.querySelector('.market_tableRow__Uuhwj.market_askRow__eRJes .market_price__V_09X.market_sell__SZ_It span')?.textContent.trim().replace(/,/g, '');
        ask = document.querySelector('.market_tableRow__Uuhwj.market_bidRow__6wAE6 .market_price__V_09X.market_buy__F9O7S span')?.textContent.trim().replace(/,/g, '');
    } else if (url.includes("lbank.com")) {
        bid = document.querySelector('.orderlist.bids .price')?.textContent.trim().replace(/,/g, '');
        ask = document.querySelector('.orderlist.asks .price')?.textContent.trim().replace(/,/g, '');
    } else if (url.includes("gate.io")) {
        bid = document.querySelector('.depth-list-item .sc-278b8b11-4.hNNPbI')?.textContent.trim().replace(/,/g, '');
        ask = document.querySelector('.depth-list-item .sc-278b8b11-4.logTeL')?.textContent.trim().replace(/,/g, '');
    } else {
        console.log("Неизвестная биржа: " + url);
        return;
    }

    if (bid && ask) {
        bid = parseFloat(bid);
        ask = parseFloat(ask);

        chrome.runtime.sendMessage({
            action: "updatePrices",
            exchange: url,
            bid: bid,
            ask: ask
        });
    }
}

setInterval(getPrices, 1000);