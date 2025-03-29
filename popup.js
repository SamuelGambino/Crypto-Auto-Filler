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

function updatePopupUI(prices) {
    const exchanges = Object.keys(prices);

    if (!prices || exchanges.length === 0) {
        spreadIn.textContent = "Нет данных";
        spreadOut.textContent = "Нет данных";
        return;
    }

    exchanges.forEach((exchange1) => {
        const priceData1 = prices[exchange1];
        if (!priceData1 || !priceData1.bid || !priceData1.ask) {
            return; 
        }
        const ask1 = priceData1.ask;
        const bid1 = priceData1.bid;

        exchanges.forEach((exchange2) => {
            if (exchange1 === exchange2) {
                return;
            }

            const priceData2 = prices[exchange2];
            if (!priceData2 || !priceData2.bid || !priceData2.ask) {
                return; 
             }
            const bid2 = priceData2.bid;
            const ask2 = priceData2.ask;

            const spreadBuy = bid1 - ask2;
            const spreadBuyPercentage = (spreadBuy / bid1 * 100).toFixed(2);
            spreadIn.textContent = `${spreadBuyPercentage}%`;

            const spreadSell = ask1 - bid2;
            const spreadSellPercentage = (spreadSell / ask1 * 100).toFixed(2);
            spreadOut.textContent = `${spreadSellPercentage}%`;
        });
    });
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
    chrome.runtime.sendMessage({ action: "getPrices" }, (response) => {
        if (response && response.prices) {
            updatePopupUI(response.prices);
        } else {
            spreadIn.textContent = "Нет данных";
            spreadOut.textContent = "Нет данных";
        }
    });
}

setInterval(updateSpreads, 500);