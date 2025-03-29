const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const messageElement = document.getElementById("message");
const select1 = document.getElementById("exchangeSelect1");
const select2 = document.getElementById("exchangeSelect2");
const spredIn = document.getElementById("spred-in");
const spredOut = document.getElementById("spred-out");

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

    chrome.runtime.sendMessage({ action: "getPrices" }, (response) => {
        if (response && response.prices) {
            updatePopupUI(response.prices);
        } else {
            document.getElementById("spread-info").textContent = "Нет данных";
        }
    });
});
function updatePopupUI(prices) {
    const spreadContainer = document.getElementById("spread-info");
    spreadContainer.innerHTML = "";

    if (!prices || Object.keys(prices).length === 0) {
        spreadContainer.textContent = "Нет данных";
        return;
    }

    Object.keys(prices).forEach((exchange) => {
        const { bid, ask } = prices[exchange];
        if (!bid || !ask) return;

        const spread = (ask - bid).toFixed(2);
        const spreadPercentage = ((ask - bid) / ask * 100).toFixed(2);

        const spreadText = document.createElement("p");
        spreadText.textContent = `${exchange}: Спред ${spread} (${spreadPercentage}%)`;
        spreadContainer.appendChild(spreadText);
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
        if (!response || !response.prices) return;

        const exchange1 = select1.value;
        const exchange2 = select2.value;

        const prices1 = response.prices[exchange1];
        const prices2 = response.prices[exchange2];

        if (!prices1?.bid || !prices1?.ask || !prices2?.bid || !prices2?.ask) {
            spredIn.textContent = "Нет данных";
            spredOut.textContent = "Нет данных";
            return;
        }

        const spreadInValue = (prices1.ask - prices2.bid).toFixed(6);
        const spreadOutValue = (prices2.ask - prices1.bid).toFixed(6);

        spredIn.textContent = `Спред входа: ${spreadInValue}`;
        spredOut.textContent = `Спред выхода: ${spreadOutValue}`;
    });
    console.log("Выбранные вкладки:", exchange1, exchange2);
    console.log("Все доступные цены:", response.prices);
}

setInterval(updateSpreads, 1000);