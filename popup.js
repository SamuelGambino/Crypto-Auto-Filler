const valueInput = document.getElementById("valueInput");
const saveButton = document.getElementById("saveButton");
const messageElement = document.getElementById("message");
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