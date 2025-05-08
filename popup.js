const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const exchange = document.getElementById('exchangeSelect1');
const symbol = document.getElementById('symbol');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
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

startBtn.addEventListener('click', () => {
  exchange.value
  console.log(exchange.value);
  symbol.value.toUpperCase().trim();

  if (!exchange || !symbol) {
    alert('Выберите биржу и введите монету.');
    return;
  }

  chrome.runtime.sendMessage({
    type: 'start-tracking',
    exchange,
    symbol
  });
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'stop-tracking' });
});

loadData();