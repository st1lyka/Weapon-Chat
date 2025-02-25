const promptHeader = "Ты чат-бот, отвечай только на тему оружия, отклоняй любые другие темы";

async function prompt() {
    const userInput = document.getElementById("userInput").value;
    const chatBox = document.getElementById("chatBox");

    if (!userInput.trim()) return;

    // Добавляем сообщение пользователя в чат
    const userMessage = document.createElement("div");
    userMessage.classList.add("message", "user-message");
    userMessage.textContent = userInput;
    chatBox.appendChild(userMessage);

    // Прокрутка вниз
    chatBox.scrollTop = chatBox.scrollHeight;

    // Ожидание ответа от сервера Ollama
    const responseBox = document.createElement("div");
    responseBox.classList.add("message", "bot-message");
    responseBox.textContent = "Ожидание ответа...";
    chatBox.appendChild(responseBox);
    chatBox.scrollTop = chatBox.scrollHeight;

    const response = await sendRequest(userInput);

    // Обновляем ответ в чате
    responseBox.textContent = response;

    // Очищаем поле ввода
    document.getElementById("userInput").value = '';  // Очистка поля ввода
}

async function sendRequest(userInput) {
    const requestBody = {
        model: "mistral",
        prompt: promptHeader + '\n Запрос: ' + userInput
    };

    try {
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.text();

            let answer = "";

            data.split('\n').forEach(token => {
                if (token.length === 0)
                    return;

                const tokenData = JSON.parse(token);

                answer += tokenData.response;
            });

            return answer;
        } else {
            return "Ошибка сервера Ollama.";
        }
    } catch (error) {
        return "Ошибка: " + error.message;
    }
}

// Функция для отображения/скрытия эмодзи
function toggleEmojiPicker() {
    const emojiContainer = document.getElementById("emojiContainer");
    emojiContainer.style.display = emojiContainer.style.display === "none" ? "block" : "none";
}

// Функция для вставки эмодзи в поле ввода
function insertEmoji(emoji) {
    const userInput = document.getElementById("userInput");
    userInput.value += emoji;
    toggleEmojiPicker(); // Скрыть эмодзи после вставки
}