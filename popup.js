const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const exchangesListDiv = document.getElementById("exchangesList");
const saveExchangesButton = document.getElementById("saveExchanges");
const messageElement = document.getElementById("message");
<<<<<<< Updated upstream
const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

storage.sync.get(["savedValue"]).then((result) => { // Используем .then()
    const savedValue = result.savedValue ?? "";
    valueInput.value = savedValue;
}).catch(error => {
    console.error("Error getting saved value:", error); // Обработка ошибок
});

saveButton.addEventListener("click", () => {
    const value = valueInput.value;
    storage.sync.set({ ["savedValue"]: value }).then(() => { // Используем .then()
        messageElement.textContent = "Сохранено!";
        setTimeout(() => { messageElement.textContent = ""; }, 2000);
        window.close();
    }).catch(error => {
        console.error("Error saving value:", error); // Обработка ошибок
      });
});
=======

// Загрузка данных и отображение
async function loadData() {
    const { savedValue = "" } = await chrome.runtime.sendMessage({ action: "getSavedValue" });

    valueInput.value = savedValue;
}

// Сохранение значения
saveButton.addEventListener("click", () => {
  const value = valueInput.value;
  chrome.runtime.sendMessage({ action: "saveValue", value: value }, (response) => {
    if (response && response.success) {
      messageElement.textContent = "Сохранено!";
      setTimeout(() => { messageElement.textContent = ""; }, 2000);
    } else {
          messageElement.textContent = "Ошибка сохранения!";
          setTimeout(() => { messageElement.textContent = ""; }, 2000);
    }
  });
});

loadData();
>>>>>>> Stashed changes
