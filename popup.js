const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const exchange1 = document.getElementById('exchangeSelect1');
const exchange2 = document.getElementById('exchangeSelect2');
const symbol = document.getElementById('symbol');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const spreadInTxt = document.getElementById('spreadIn');
const spreadOutTxt = document.getElementById('spreadOut');
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
  const selectedExchange1 = exchange1.value;
  const selectedExchange2 = exchange2.value;
  const enteredSymbol = symbol.value.toUpperCase().trim();

  if (!selectedExchange1 || !enteredSymbol || !selectedExchange2) {
    alert('Выберите биржи и введите монету.');
    return;
  }

  console.log("Отправка данных:", selectedExchange1, selectedExchange2, enteredSymbol);

  chrome.runtime.sendMessage({
    type: 'start-tracking',
    exchange1: selectedExchange1,
    exchange2: selectedExchange2,
    symbol: enteredSymbol
  });
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'stop-tracking' });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "spread-update") {
    const { spreadIn, spreadOut } = message.spread;

    spreadInTxt.textContent = spreadIn;
    spreadOutTxt.textContent = spreadOut;
    // messageElement.textContent = `Текущий спред: ${spread}`;
  }
});


loadData();