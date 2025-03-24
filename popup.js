const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const messageElement = document.getElementById("message");
const select1 = document.getElementById("exchangeSelect1");
const select2 = document.getElementById("exchangeSelect2");
const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

document.addEventListener("DOMContentLoaded", function () {
    storage.sync.get(["savedValue"]).then((result) => {
        valueInput.value = result.savedValue ?? "";
    }).catch(error => {
        console.error("Error getting saved value:", error);
    });

    chrome.storage.local.get(["exchangeTabs", "selectedTabId1", "selectedTabId2"], (data) => {
        if (chrome.runtime.lastError) {
            console.error("Ошибка получения exchangeTabs:", chrome.runtime.lastError);
            return;
        }
        if (data.exchangeTabs && Array.isArray(data.exchangeTabs)) {
            updateExchangeSelects(data.exchangeTabs, data.selectedTabId1, data.selectedTabId2);
        }
    });
});

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

    if (selected1) select1.value = selected1;
    if (selected2) select2.value = selected2;
}

select1.addEventListener("change", () => {
    chrome.storage.local.set({ selectedTabId1: select1.value });
});

select2.addEventListener("change", () => {
    chrome.storage.local.set({ selectedTabId2: select2.value });
});

saveButton.addEventListener("click", () => {
    const value = valueInput.value;
    storage.sync.set({ savedValue: value }).then(() => {
        messageElement.textContent = "Сохранено!";
        setTimeout(() => { messageElement.textContent = ""; }, 2000);
        window.close();
    }).catch(error => {
        console.error("Error saving value:", error);
    });
});
