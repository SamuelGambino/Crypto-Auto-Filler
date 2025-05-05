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
<<<<<<< Updated upstream

    storage.sync.get(["savedValue"]).then((result) => {
        const savedValue = result.savedValue ?? "";

        if (targetField.value === "" || targetField.value === "0") {
            targetField.value = savedValue;
            const event = new Event('input', { bubbles: true });
            targetField.dispatchEvent(event);
            console.log("Auto Filler: Field filled:", targetField);
        }
    }).catch(error => {
        console.error("AutoFiller: Error getting saved value:", error); // Обработка ошибок
=======
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
>>>>>>> Stashed changes
    });
}

const debouncedFillAllFields = debounce(() => {
    const textFields = document.querySelectorAll('input[type="text"]');
    textFields.forEach(fillField);
}, 200);

let observer = null; // Переменная для хранения observer

function startObserving() {
<<<<<<< Updated upstream
    if (!document.body) { // Проверяем наличие document.body
        console.warn("AutoFiller: document.body not ready yet.");
        return;
    }
    debouncedFillAllFields();

    if (observer) {
        observer.disconnect(); // Если уже наблюдаем — отключаем
    }

    observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Обрабатываем случай, когда target === null
            if (mutation.target === null) {
                return; //Пропускаем
            }
            debouncedFillAllFields();
        });
    });
=======
    if (!document.body) {
        console.warn("AutoFiller: document.body not ready yet.");
        return;
    }

    debouncedFillAllFields();

    if (observer) {
        observer.disconnect();
    }

    observer = new MutationObserver(debouncedFillAllFields);
>>>>>>> Stashed changes

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['value', 'type']
    });

<<<<<<< Updated upstream
    // Дополнительные обработчики событий (на случай, если MutationObserver что-то пропустит)
    document.body.addEventListener("input", debouncedFillAllFields);
    document.body.addEventListener("change", debouncedFillAllFields);
    document.body.addEventListener("blur", debouncedFillAllFields, true); // capturing phase
}

// Запускаем наблюдение
startObserving();

// Отменяем наблюдение при выгрузке скрипта
=======
    document.body.addEventListener("input", debouncedFillAllFields);
    document.body.addEventListener("change", debouncedFillAllFields);
    document.body.addEventListener("blur", debouncedFillAllFields, true);
}
startObserving();

>>>>>>> Stashed changes
window.addEventListener("beforeunload", () => {
    if (observer) {
        observer.disconnect();
        observer = null; // Очищаем observer
    }
});