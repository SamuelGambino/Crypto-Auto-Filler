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

// Функция запускает заполнение полей, но только если вкладка разрешена
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

// Получаем ID текущей вкладки перед запуском логики
chrome.runtime.sendMessage({ action: "getCurrentTabId" }, (response) => {
    if (!response || !response.currentTabId) {
        console.warn("❌ AutoFiller: Не удалось получить ID вкладки.");
        return;
    }
    checkAndStartFilling(response.currentTabId);
});

// Останавливаем наблюдение при выгрузке страницы
window.addEventListener("beforeunload", () => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
});
