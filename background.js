const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
const MAX_SELECTED_EXCHANGES = 2; // Максимальное количество выбранных бирж

// Функция для проверки, является ли URL биржей из списка
function isExchangeUrl(url) {
  return new Promise((resolve) => {
    storage.sync.get(["selectedExchanges"], (result) => {
      const selectedExchanges = result.selectedExchanges ?? [];

      if (selectedExchanges.length === 0) {
        resolve(false);
        return;
      }

      const isSelected = selectedExchanges.some((selectedUrl) => {
        const regex = new RegExp(selectedUrl.replace(/\*/g, ".*").replace(/\//g, "\\/"));
        return regex.test(url);
      });
      resolve(isSelected);
    });
  });
}

// Функция для получения списка
async function getOpenExchanges() {
  return new Promise((resolve) => {
    const exchangeTabs = [];
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (isExchangeUrlWithoutSelected(tab.url)) {
          exchangeTabs.push({
            id: tab.id,
            title: tab.title,
            url: tab.url,
          });
        }
      });
      resolve(exchangeTabs);
    });
  });
}
//Вспомогательная
function isExchangeUrlWithoutSelected(url) {
    const exchangePatterns = [
        "*://*.binance.com/*",
        "*://*.binance.us/*",
        "*://*.binance.je/*",
        "*://*.binance.bh/*",
        "*://*.bingx.com/*",
        "*://*.bitget.com/*",
        "*://*.bitmart.com/*",
        "*://*.bitmex.com/*",
        "*://*.bybit.com/*",
        "*://*.bybit.global/*",
        "*://*.coinex.com/*",
        "*://*.coinex.net/*",
        "*://*.gate.io/*",
        "*://*.gate.ac/*",
        "*://*.gateio.ws/*",
        "*://*.gate.me/*",
        "*://*.htx.com/*",
        "*://*.htx.me/*",
        "*://*.huobi.com/*",
        "*://*.huobi.pro/*",
        "*://*.kucoin.com/*",
        "*://*.kucoin.io/*",
        "*://*.lbank.com/*",
        "*://*.lbank.info/*",
        "*://*.mexc.com/*",
        "*://*.mexc.mx/*",
        "*://*.futures.mexc.com/*",
        "*://*.okx.com/*",
        "*://*.okx.cab/*",
        "*://*.okx.lat/*",
        "*://*.poloniex.com/*",
        "*://*.xt.com/*",
        "*://*.xt.pub/*"
    ];

  return exchangePatterns.some((pattern) => {
    const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\//g, "\\/"));
    return regex.test(url);
  });
}

// Слушаем сообщения
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSavedValue") {
    storage.sync.get(["savedValue"]).then((result) => {
      sendResponse({ savedValue: result.savedValue ?? "" });
    }).catch(error => {
        console.error("Error getting saved value:", error);
        sendResponse({ savedValue: "" });
    });
    return true;
  } else if (message.action === "saveValue") {
    storage.sync.set({ ["savedValue"]: message.value }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
        console.error("Error saving value:", error);
        sendResponse({ success: false });
    });
    return true;
  } else if (message.action === "getOpenExchanges") {
    getOpenExchanges().then(sendResponse);
    return true;
  } else if (message.action === "getSelectedExchanges") {
    storage.sync.get(["selectedExchanges"]).then((result) => {
      sendResponse({ selectedExchanges: result.selectedExchanges ?? [] });
    });
    return true;
  } else if (message.action === "fillFields") {
        chrome.scripting.executeScript({
          target : {tabId : sender.tab.id},
          func: fillFieldsContentScript,
          args: [message.savedValue]
        });
    return true;
  } else if (message.action === "saveSelectedExchanges") {
    // Сохраняем выбранные биржи
    storage.sync.set({ ["selectedExchanges"]: message.selectedExchanges }).then(()=>{
          sendResponse({ success: true });
    }).catch(err => {
        console.error("Error save settings", err);
        sendResponse({ success: false});
    });
    return true;
  }
});

function fillFieldsContentScript(savedValue) {
  function fillField(targetField, value) {
    if (!targetField) {
      return;
    }

    if (targetField.value === "" || targetField.value === "0") {
      targetField.value = value;
      const event = new Event("input", { bubbles: true });
      targetField.dispatchEvent(event);
      console.log("Auto Filler: Field filled:", targetField);
    }
  }

  const textFields = document.querySelectorAll('input[type="text"]');
  textFields.forEach((field) => fillField(field, savedValue));
}
  //Добавил, чтобы сразу заполняло поля
   chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
     if (changeInfo.status === 'complete') {
         isExchangeUrl(tab.url).then(isSelected => {
          if(isSelected) {
            storage.sync.get(["savedValue"]).then((result) => {
            const savedValue = result.savedValue ?? "";
              chrome.runtime.sendMessage({ action: "fillFields", savedValue: savedValue });
          });
          }
        });
     }
   });