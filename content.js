function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
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
    // Запрашиваем savedValue у background script'а
    chrome.runtime.sendMessage({action: "getSavedValue"}, (response) => {
        if (chrome.runtime.lastError) { //Проверяем, не было ли ошибки
          console.error("Error getting saved value:", chrome.runtime.lastError);
          return;
        }

        const savedValue = response.savedValue ?? "";
        if (targetField.value === "" || targetField.value === "0") {
            try { //Оборачиваем в try...catch
                targetField.value = savedValue;
                const event = new Event('input', { bubbles: true });
                targetField.dispatchEvent(event);
                console.log("Auto Filler: Field filled:", targetField);
            } catch (error) {
               if (error.message === "Extension context invalidated."){
                 // Обрабатываем ошибку
                 console.warn("AutoFiller: Extension context invalidated while filling field.");
               } else {
                    console.error("AutoFiller: Error filling field:", error);
                }
            }
        }
    });
}

const debouncedFillAllFields = debounce(() => {
    const textFields = document.querySelectorAll('input[type="text"]');
    textFields.forEach(fillField);
}, 200);

let observer = null; // Переменная для хранения observer

function startObserving() {
    if (!document.body) {
        console.warn("AutoFiller: document.body not ready yet.");
        return;
    }

    debouncedFillAllFields();

    if (observer) {
        observer.disconnect();
    }

    observer = new MutationObserver(debouncedFillAllFields);

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['value', 'type']
    });

    document.body.addEventListener("input", debouncedFillAllFields);
    document.body.addEventListener("change", debouncedFillAllFields);
    document.body.addEventListener("blur", debouncedFillAllFields, true);
}
startObserving();

window.addEventListener("beforeunload", () => {
    if (observer) {
        observer.disconnect();
        observer = null; // Очищаем observer
    }
});