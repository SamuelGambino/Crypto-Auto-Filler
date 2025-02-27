document.addEventListener('DOMContentLoaded', function() {
  const valueInput = document.getElementById('valueInput');
  const saveButton = document.getElementById('saveButton');
  const messageElement = document.getElementById("message");

  // Load saved value
  browser.storage.sync.get(["savedValue"]).then((result) => {
      const savedValue = result.savedValue ?? "";
      valueInput.value = savedValue;
  }).catch(error => {
      console.error("Error getting saved value:", error); // Обработка ошибок
  });

  // Save value on button click
  saveButton.addEventListener('click', function() {
    const value = valueInput.value;
    browser.storage.sync.set({ ["savedValue"]: value }).then(() => {
        messageElement.textContent = "Сохранено!";
        setTimeout(() => { messageElement.textContent = ""; }, 2000);

    }).catch(error => {
      console.error("Error saving value:", error); // Обработка ошибок

    });
  });
});
