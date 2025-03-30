const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const messageElement = document.getElementById("message");
const select1 = document.getElementById("exchangeSelect1");
const select2 = document.getElementById("exchangeSelect2");
const spreadIn = document.getElementById("spread-in");
const spreadOut = document.getElementById("spread-out");
let lastValidBid1 = 0;
let lastValidAsk1 = 0;
let lastValidBid2 = 0;
let lastValidAsk2 = 0;
const priceErrorThreshold = 5;

document.addEventListener("DOMContentLoaded", () => {
    storage.sync.get(["savedValue"]).then((result) => {
        valueInput.value = result.savedValue ?? "";
    }).catch(error => console.error("Ошибка получения сохраненного значения:", error));

    chrome.storage.local.get(["exchangeTabs", "selectedTabId1", "selectedTabId2"], (data) => {
        if (chrome.runtime.lastError) {
            console.error("Ошибка получения exchangeTabs:", chrome.runtime.lastError);
            return;
        }
        if (data.exchangeTabs && Array.isArray(data.exchangeTabs)) {
            updateExchangeSelects(data.exchangeTabs, data.selectedTabId1, data.selectedTabId2);
            setTimeout(updateSpreads, 500);
        }
    });
});

function getMinPrice(priceList) {
    if (!priceList || priceList.length === 0) {
        return null;
    }

    let minPrice = Infinity;
    for (const priceStr of priceList) {
        const price = parseFloat(priceStr.replace(/,/g, ''));
        if (!isNaN(price) && price < minPrice) {
            minPrice = price;
        }
    }
    return minPrice === Infinity ? null : minPrice;
}

function getMaxPrice(priceList) {
    if (!priceList || priceList.length === 0) {
        return null;
    }

    let maxPrice = -Infinity;
    for (const priceStr of priceList) {
        const price = parseFloat(priceStr.replace(/,/g, ''));
        if (!isNaN(price) && price > maxPrice) {
            maxPrice = price;
        }
    }
    return maxPrice === -Infinity ? null : maxPrice;
}

function spreadCheck(bid1, ask1, bid2, ask2) {
    const bidDifference = Math.abs(bid1 - bid2);
    const askDifference = Math.abs(ask1 - ask2);
    if (bidDifference > priceErrorThreshold || askDifference > priceErrorThreshold) {
        console.log("Цены слишком различаются, используем прошлые данные.");
        bid1 = lastValidBid1 !== null ? lastValidBid1 : null;
        ask1 = lastValidAsk1 !== null ? lastValidAsk1 : null;
        bid2 = lastValidBid2 !== null ? lastValidBid2 : null;
        ask2 = lastValidAsk2 !== null ? lastValidAsk2 : null;
    } else {
         if (bid1 !== null  && ask1 !== null) {
            lastValidBid1 = bid1;
            lastValidAsk1 = ask1;
        }
        if (bid2 !== null && ask2 !== null) {
            lastValidBid2 = bid2;
            lastValidAsk2 = ask2;
        }
    }
    return { bid1, ask1, bid2, ask2 };
}

function updatePopupUI(prices) {
    let spreadInValue = null;
    let spreadOutValue = null;

    const exchanges = Object.keys(prices);

    if (!prices || exchanges.length < 2) {
        spreadIn.textContent = "Недостаточно данных";
        spreadOut.textContent = "Недостаточно данных";
        return;
    }

    for (let i = 0; i < exchanges.length; i++) {
        const exchange1 = exchanges[i];
        const priceData1 = prices[exchange1];
        if (!priceData1 || !priceData1.bid || !priceData1.ask) continue;

        // let ask1 = getMinPrice(priceData1.ask);
        // let bid1 = getMaxPrice(priceData1.bid);

        let bid1 = getMaxPrice(priceData1.ask);
        let ask1 = getMinPrice(priceData1.bid);

        if (ask1 === null || bid1 === null) continue;

        for (let j = i + 1; j < exchanges.length; j++) {
            const exchange2 = exchanges[j];
            const priceData2 = prices[exchange2];
             if (!priceData2 || !priceData2.bid || !priceData2.ask) continue;

            let bid2 = getMaxPrice(priceData2.bid);
            let ask2 = getMinPrice(priceData2.ask);

            if (ask2 === null || bid2 === null) continue;


            const correctedPrices = spreadCheck(bid1, ask1, bid2, ask2);
            bid1 = correctedPrices.bid1;
            ask1 = correctedPrices.ask1;
            bid2 = correctedPrices.bid2;
            ask2 = correctedPrices.ask2;


             if (bid1 === null || ask1 === null || bid2 === null || ask2 === null) {
                console.log(`Пропускаем итерацию из-за null в ценах после spreadCheck`);
                continue;
            }

            const spreadBuyPercentage = ((bid1 - ask2) / ask2) * 100;
            const spreadSellPercentage = ((bid2 - ask1) / ask1) * 100;

            console.log(`---- Спред между ${exchange1} и ${exchange2} ----`);
            console.log(`[${new Date().toISOString()}] ask1: ${ask1}, bid1: ${bid1}, ask2: ${ask2}, bid2: ${bid2}`);
            console.log(`spreadBuyPercentage: ${spreadBuyPercentage}, spreadSellPercentage: ${spreadSellPercentage}`);


            if (spreadInValue === null || Math.abs(spreadBuyPercentage) > Math.abs(spreadInValue)) {
                 if (!isNaN(spreadBuyPercentage) && isFinite(spreadBuyPercentage) && Math.abs(spreadBuyPercentage) < 100) {
                    spreadInValue = spreadBuyPercentage;
                }
            }
            if (spreadOutValue === null || Math.abs(spreadSellPercentage) > Math.abs(spreadOutValue)) {
                if (!isNaN(spreadSellPercentage) && isFinite(spreadSellPercentage) && Math.abs(spreadSellPercentage) < 100){
                    spreadOutValue = spreadSellPercentage;
                }
            }
        }
    }

    spreadOut.textContent = spreadInValue !== null ? `${spreadInValue.toFixed(2) * -1}%` : "Ошибка данных";
    spreadIn.textContent = spreadOutValue !== null ? `${spreadOutValue.toFixed(2) * -1}%` : "Ошибка данных";
}

function updateExchangeSelects(tabs, selected1, selected2) {
    select1.innerHTML = "";
    select2.innerHTML = "";

    tabs.forEach(tab => {
        const option1 = document.createElement("option");
        option1.value = tab.id;
        option1.textContent = tab.title;
        select1.appendChild(option1);

        const option2 = option1.cloneNode(true);
        select2.appendChild(option2);
    });

    setTimeout(() => {
        if (selected1 && [...select1.options].some(opt => opt.value === selected1)) {
            select1.value = selected1;
        }
        if (selected2 && [...select2.options].some(opt => opt.value === selected2)) {
            select2.value = selected2;
        }
    }, 100);
}

select1.addEventListener("change", () => {
    chrome.storage.local.set({ selectedTabId1: select1.value });
    updateSpreads();
});

select2.addEventListener("change", () => {
    chrome.storage.local.set({ selectedTabId2: select2.value });
    updateSpreads();
});

saveButton.addEventListener("click", () => {
    const value = valueInput.value;
    storage.sync.set({ savedValue: value }).then(() => {
        messageElement.textContent = "Сохранено!";
        setTimeout(() => { messageElement.textContent = ""; }, 2000);
        window.close();
    }).catch(error => console.error("Ошибка сохранения:", error));
});

function updateSpreads() {
    console.log("Запрос цен у background.js...");
    chrome.runtime.sendMessage({ action: "getPrices" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Ошибка при запросе цен:", chrome.runtime.lastError);
            spreadIn.textContent = "Ошибка запроса";
            spreadOut.textContent = "Ошибка запроса";
            return;
        }

        console.log("Ответ от background.js:", response);

        if (response && response.prices) {
            updatePopupUI(response.prices);
        } else {
            console.warn("Нет данных в ответе!");
            spreadIn.textContent = "Нет данных";
            spreadOut.textContent = "Нет данных";
        }
    });
}


setInterval(updateSpreads, 500);