const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const exchange1 = document.getElementById('exchangeSelect1');
const exchange2 = document.getElementById('exchangeSelect2');
const symbol = document.getElementById('symbol');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const spreadInTxt = document.getElementById('spreadIn');
const spreadOutTxt = document.getElementById('spreadOut');
const tabsContainer = document.getElementById("tabsContainer");
const addTabBtn = document.getElementById("addTab");
const messageElement = document.getElementById("message");
const select1 = document.getElementById("exchangeSelect1");
const select2 = document.getElementById("exchangeSelect2");
const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

let currentTabId = null;
const state = {};

// Загрузка данных и отображение
async function loadData() {
  const { savedValue = "" } = await chrome.runtime.sendMessage({ action: "getSavedValue" });
};

// Генерация id вкладки
function generateTabId() {
  return 'tab-' + Math.random().toString(36).substring(2, 9);
}

function switchTab(tabId) {
  currentTabId = tabId;
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector(`.tab[data-id="${tabId}"]`).classList.add('active');

  const tabState = state[tabId];
  if (tabState) {
    exchange1.value = tabState.exchange1;
    exchange2.value = tabState.exchange2;
    symbol.value = tabState.symbol;
    spreadInTxt.textContent = tabState.spreadIn || '';
    spreadOutTxt.textContent = tabState.spreadOut || '';
  } else {
    exchange1.value = '';
    exchange2.value = '';
    symbol.value = '';
    spreadInTxt.textContent = '';
    spreadOutTxt.textContent = '';
  }
}

function createTab() {
  const tabId = generateTabId();
  state[tabId] = {};

  const tabBtn = document.createElement('button');
  tabBtn.className = 'tab';
  tabBtn.textContent = `Монета ${Object.keys(state).length}`;
  tabBtn.dataset.id = tabId;
  tabBtn.addEventListener('click', () => switchTab(tabId));

  tabsContainer.appendChild(tabBtn);
  switchTab(tabId);
}

addTabBtn.addEventListener('click', createTab);

saveButton.addEventListener("click", () => {
    const value = valueInput.value;
    storage.sync.set({ savedValue: value }).then(() => {
        messageElement.textContent = "Сохранено!";
        setTimeout(() => { messageElement.textContent = ""; }, 2000);
        window.close();
    }).catch(error => {
        console.error("Error saving value:", error);
    });
});

startBtn.addEventListener('click', () => {
  if (!currentTabId) return;

  const selectedExchange1 = exchange1.value;
  const selectedExchange2 = exchange2.value;
  const enteredSymbol = symbol.value.toUpperCase().trim();

  if (!selectedExchange1 || !enteredSymbol || !selectedExchange2) {
    alert('Выберите биржи и введите монету.');
    return;
  }

  state[currentTabId] = {
    exchange1: selectedExchange1,
    exchange2: selectedExchange2,
    symbol: enteredSymbol
  };

  chrome.runtime.sendMessage({
    type: 'start-tracking',
    tabId: currentTabId,
    exchange1: selectedExchange1,
    exchange2: selectedExchange2,
    symbol: enteredSymbol
  });
});

stopBtn.addEventListener('click', () => {
  if (!currentTabId) return;
  chrome.runtime.sendMessage({ type: 'stop-tracking', tabId: currentTabId });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "spread-update" && message.tabId === currentTabId) {
    const { spreadIn, spreadOut } = message.spread;

    spreadInTxt.textContent = spreadIn;
    spreadOutTxt.textContent = spreadOut;

    state[currentTabId].spreadIn = spreadIn;
    state[currentTabId].spreadOut = spreadOut;
  }
});

createTab();
loadData();
