const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const messageElement = document.getElementById("message");
const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

storage.sync.get(["savedValue"]).then((result) => { // Используем .then()
    const savedValue = result.savedValue ?? "";
    valueInput.value = savedValue;
}).catch(error => {
    console.error("Error getting saved value:", error); // Обработка ошибок
});

saveButton.addEventListener("click", () => {
    const value = valueInput.value;

    document.getElementById('exchangeSelect1').addEventListener('change', function() {
        const selectedTabId1 = this.value;
        chrome.storage.local.set({ selectedTabId1 });
    });
      
    document.getElementById('exchangeSelect2').addEventListener('change', function() {
        const selectedTabId2 = this.value;
        chrome.storage.local.set({ selectedTabId2 });
    });
      
    storage.sync.set({ ["savedValue"]: value }).then(() => { // Используем .then()
        messageElement.textContent = "Сохранено!";
        setTimeout(() => { messageElement.textContent = ""; }, 2000);
        window.close();
    }).catch(error => {
        console.error("Error saving value:", error); // Обработка ошибок
      });
});

document.addEventListener("DOMContentLoaded", function () {
    chrome.runtime.sendMessage({ action: "getExchangeTabs" }, response => {
        if (response && response.tabs) {
            updateExchangeSelects(response.tabs);
        }
    });

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "updateTabs") {
            updateExchangeSelects(message.tabs);
        }
    });
});

function updateExchangeSelects(tabs) {
    const select1 = document.getElementById("exchangeSelect1");
    const select2 = document.getElementById("exchangeSelect2");

    select1.innerHTML = "";
    select2.innerHTML = "";

    tabs.forEach(tab => {
        const option1 = document.createElement("option");
        option1.value = tab.id;
        option1.textContent = tab.title;
        select1.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = tab.id;
        option2.textContent = tab.title;
        select2.appendChild(option2);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateTabs") {
        updateExchangeSelects(message.tabs);
        sendResponse({ status: "ok" });
    }
});
  