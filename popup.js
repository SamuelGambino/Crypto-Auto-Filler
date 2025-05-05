const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const exchangesListDiv = document.getElementById("exchangesList");
const saveExchangesButton = document.getElementById("saveExchanges");
const messageElement = document.getElementById("message");

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
