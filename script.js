const promptHeader = "Ты чат бот, отвечай на тему только оружия, все что было связанно с оружием";
const storageKey = "chatHistory";  // Ключ для сохранения в localStorage
const MAX_REQUESTS = 1;  // Максимальное количество запросов
let requestCount = 0;  // Счетчик запросов

// Функция для загрузки данных из localStorage
function loadChatHistory() {
    const chatHistory = localStorage.getItem(storageKey);
    return chatHistory ? JSON.parse(chatHistory) : [];
}

// Функция для сохранения данных в localStorage
function saveChatHistory(chatHistory) {
    localStorage.setItem(storageKey, JSON.stringify(chatHistory));
}

// Функция для получения текста всей истории общения
function getHistoryText(chatHistory) {
    return chatHistory.map(entry => `${entry.role === "user" ? "Пользователь" : "Бот"}: ${entry.message}`).join('\n');
}

// Функция для отображения истории чата в UI
function displayChatHistory(chatHistory) {
    const chatBox = document.getElementById("chatBox");

    chatHistory.forEach(entry => {
        const message = document.createElement("div");
        message.classList.add("message", entry.role === "user" ? "user-message" : "bot-message");
        message.textContent = entry.message;
        chatBox.appendChild(message);
    });

    // Прокрутка вниз после добавления сообщений
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function prompt() {
    const userInput = document.getElementById("userInput").value;
    const chatBox = document.getElementById("chatBox");

    if (!userInput.trim()) return;

    // Проверка на превышение лимита запросов
    if (requestCount >= MAX_REQUESTS) {
        const limitMessage = document.createElement("div");
        limitMessage.classList.add("message", "bot-message");
        limitMessage.textContent = "Вы достигли максимального количества запросов. ";
        chatBox.appendChild(limitMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        return;
    }

    // Загружаем историю чата из localStorage
    let chatHistory = loadChatHistory();

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

    // Добавляем вопрос пользователя в историю
    chatHistory.push({ role: "user", message: userInput });

    const response = await sendRequest(userInput);

    // Обновляем ответ в чате
    responseBox.textContent = response;

    // Добавляем ответ бота в историю
    chatHistory.push({ role: "bot", message: response });

    // Сохраняем обновленную историю чата в localStorage
    saveChatHistory(chatHistory);

    // Увеличиваем счетчик запросов
    requestCount++;

    // Очищаем поле ввода
    document.getElementById("userInput").value = '';  // Очистка поля ввода
}

async function sendRequest(userInput) {
    const chatHistory = loadChatHistory();
    const requestBody = {
        model: "mistral",
        prompt: promptHeader + '\n История общения:\n' + getHistoryText(chatHistory) + '\n Запрос: ' + userInput
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
                if (token.length === 0) return;

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

// Восстановление истории чата при загрузке страницы
window.onload = function() {
    const chatHistory = loadChatHistory();
    displayChatHistory(chatHistory);
};

// Функция для переключения темы
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-theme');

    // Изменение иконки на кнопке в зависимости от темы
    const themeButton = document.querySelector('.theme-toggle-btn');
    if (body.classList.contains('dark-theme')) {
        themeButton.textContent = '🌞'; // Темная тема -> кнопка солнце
    } else {
        themeButton.textContent = '🌙'; // Светлая тема -> кнопка луна
    }
}

// Функция для очистки всех cookie
function clearCookies() {
    localStorage.clear();
}

// Функция для очистки чата и cookies
function clearChat() {
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = '';  // Очищаем все содержимое чата
    const initialMessage = document.createElement("div");
    initialMessage.classList.add("message", "bot-message");
    initialMessage.textContent = "Привет! Задавай вопросы об истории оружия или другой теме!";
    chatBox.appendChild(initialMessage);  // Добавляем приветственное сообщение
    chatBox.scrollTop = chatBox.scrollHeight;  // Прокручиваем чат до последнего сообщения

    // Очищаем все cookies
    clearCookies();

    // Сброс счетчика запросов
    requestCount = 0;
}
