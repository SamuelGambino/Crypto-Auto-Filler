const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const exchangesListDiv = document.getElementById("exchangesList");
const saveExchangesButton = document.getElementById("saveExchanges");
const messageElement = document.getElementById("message");

// Функция для отображения чекбоксов бирж
function renderExchangeCheckboxes(openExchanges, selectedExchanges) {
    exchangesListDiv.innerHTML = ""; // Очищаем

  openExchanges.forEach(exchange => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = exchange.url;
    checkbox.value = exchange.url;
    checkbox.checked = selectedExchanges.includes(exchange.url);

    const label = document.createElement("label");
    label.htmlFor = exchange.url;
    label.textContent = exchange.title;

    const container = document.createElement("div");
    container.classList.add("exchange-item"); // Добавляем класс для стилизации
    container.appendChild(checkbox);
    container.appendChild(label);
    exchangesListDiv.appendChild(container);
  });
}

// Загрузка данных и отображение
async function loadData() {
    const openExchanges = await chrome.runtime.sendMessage({ action: "getOpenExchanges" });
  const { savedValue = "" } = await chrome.runtime.sendMessage({ action: "getSavedValue" });
    const { selectedExchanges = [] } = await chrome.runtime.sendMessage({ action: "getSelectedExchanges" });

    valueInput.value = savedValue;
    renderExchangeCheckboxes(openExchanges, selectedExchanges);
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

// Сохранение выбранных бирж
  saveExchangesButton.addEventListener("click", () => {
    const selectedCheckboxes = exchangesListDiv.querySelectorAll("input[type=checkbox]:checked");
    const selectedExchanges = Array.from(selectedCheckboxes).map(cb => cb.value);

    // Проверка на максимальное количество
    if (selectedExchanges.length > 2) {
      messageElement.textContent = "Можно выбрать не более 2 бирж!";
      setTimeout(() => {
        messageElement.textContent = "";
      }, 2000);
      return; // Прерываем выполнение, если превышен лимит
    }

    chrome.runtime.sendMessage({ action: "saveSelectedExchanges", selectedExchanges }, (response) => {
        if(response.success) {
          messageElement.textContent = "Биржи сохранены!";
        } else {
          messageElement.textContent = "Ошибка при сохранении Бирж!";
        }
      setTimeout(() => { messageElement.textContent = ""; }, 2000);
       loadData(); // Обновляем
    });
  });

// Инициализация
loadData();