const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const messageElement = document.getElementById("message");
const select1 = document.getElementById("exchangeSelect1");
const select2 = document.getElementById("exchangeSelect2");
const spreadIn = document.getElementById("spread-in");
const spreadOut = document.getElementById("spread-out");

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

function getAveragePrice(priceList) {
    let sum = 0;
    let count = 0;

    priceList.forEach(priceStr => {
        let price = parseFloat(priceStr.replace(/,/g, ''));

        if (!isNaN(price)) {
            sum += price;
            count++;
        }
    });

    return count > 0 ? (sum / count) : null;
}

function updatePopupUI(prices) {
    console.log("Полученные цены в updatePopupUI:", prices); // Логируем приходящие данные

    if (!prices || Object.keys(prices).length === 0) {
        console.warn("Нет данных о ценах!");
        spreadIn.textContent = "Нет данных";
        spreadOut.textContent = "Нет данных";
        return;
    }

    let exchanges = Object.keys(prices);
    console.log("Биржи с ценами:", exchanges);

    let bestBid = null;
    let bestAsk = null;

    exchanges.forEach(exchange => {
        let priceData = prices[exchange];
        if (!priceData || !priceData.bid || !priceData.ask) {
            console.warn(`Нет данных для ${exchange}`);
            return;
        }

        let bid = getAveragePrice(priceData.bid);
        let ask = getAveragePrice(priceData.ask);

        if (bid && (!bestBid || bid > bestBid)) {
            bestBid = bid;
        }

        if (ask && (!bestAsk || ask < bestAsk)) {
            bestAsk = ask;
        }
    });

    if (bestBid !== null && bestAsk !== null) {
        let spreadBuy = bestBid - bestAsk;
        let spreadBuyPercentage = (spreadBuy / bestBid * 100).toFixed(2);
        spreadIn.textContent = `${spreadBuyPercentage}%`;

        let spreadSell = bestAsk - bestBid;
        let spreadSellPercentage = (spreadSell / bestAsk * 100).toFixed(2);
        spreadOut.textContent = `${spreadSellPercentage}%`;
    } else {
        console.warn("Не удалось вычислить спред");
        spreadIn.textContent = "Ошибка";
        spreadOut.textContent = "Ошибка";
    }
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