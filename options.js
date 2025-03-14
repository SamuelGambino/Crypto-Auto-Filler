const exchangesListDiv = document.getElementById("exchangesList");
const saveButton = document.getElementById("saveExchanges");
const messageElement = document.getElementById("message");
const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

// Функция для отображения списка бирж с чекбоксами
 function renderExchangeCheckboxes(openExchanges, selectedExchanges) {
     exchangesListDiv.innerHTML = ""; // Очищаем список

     openExchanges.forEach(exchange => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = exchange.url; // Используем URL как уникальный ID
        checkbox.value = exchange.url;
        checkbox.checked = selectedExchanges.includes(exchange.url); // Отмечаем, если биржа выбрана

        const label = document.createElement("label");
        label.htmlFor = exchange.url;
        label.textContent = exchange.title;

          const container = document.createElement("div"); // Контейнер для чекбокса и label
          container.appendChild(checkbox);
          container.appendChild(label);
         exchangesListDiv.appendChild(container);
     });
 }

// Загрузка сохраненных настроек и отображение списка бирж
  async function loadAndDisplayExchanges() {
    const openExchanges = await chrome.runtime.sendMessage({ action: "getOpenExchanges" });

    storage.sync.get(["selectedExchanges"]).then(result => {
         const selectedExchanges = result.selectedExchanges ?? [];
      renderExchangeCheckboxes(openExchanges, selectedExchanges);
    }).catch(error => console.error("Error:", error));
  }

// Сохранение выбранных бирж
saveButton.addEventListener("click", () => {
  const selectedCheckboxes = exchangesListDiv.querySelectorAll("input[type=checkbox]:checked");
  const selectedExchanges = Array.from(selectedCheckboxes).map(cb => cb.value);

  storage.sync.set({ ["selectedExchanges"]: selectedExchanges }).then(() => {
          messageElement.textContent = "Настройки сохранены!";
       setTimeout(() => { messageElement.textContent = ""; }, 2000);
       loadAndDisplayExchanges(); // Обновляем список после сохранения
  }).catch(err => console.error("Error save settings", err));
});

// Инициализация при загрузке страницы
loadAndDisplayExchanges();