// Трекер + Gemini + пароль + история + фото

const CORRECT_PIN = "1202";
let currentPin = "";
let selectedImage = null; // { data: base64, mimeType }

// ===== LOCK =====
function initLock() {
    if (sessionStorage.getItem("trackerUnlocked") === "true") {
        unlockSite();
        return;
    }
    document.querySelectorAll(".pin-btn[data-num]").forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentPin.length < 4) {
                currentPin += btn.dataset.num;
                updateDots();
                if (currentPin.length === 4) setTimeout(checkPin, 200);
            }
        });
    });
    document.getElementById("pin-delete").addEventListener("click", () => {
        currentPin = currentPin.slice(0, -1);
        updateDots();
        document.getElementById("lock-error").textContent = "";
    });
}

function updateDots() {
    document.querySelectorAll(".dot").forEach((dot, i) => {
        dot.classList.remove("filled", "error");
        if (i < currentPin.length) dot.classList.add("filled");
    });
}

function checkPin() {
    if (currentPin === CORRECT_PIN) {
        sessionStorage.setItem("trackerUnlocked", "true");
        unlockSite();
    } else {
        document.querySelectorAll(".dot").forEach(d => d.classList.add("error"));
        document.getElementById("lock-error").textContent = "Неверный пароль";
        setTimeout(() => {
            currentPin = "";
            updateDots();
            document.getElementById("lock-error").textContent = "";
        }, 600);
    }
}

function unlockSite() {
    document.getElementById("lock-screen").classList.add("hidden");
    document.getElementById("main-content").style.display = "block";
    initApp();
}

// ===== DATA =====
const WATER_GOAL_GLASSES = 10;
const ML_PER_GLASS = 250;

const MEALS = {
    breakfast: [
        { name: "Яйца 3 шт + 2 ржаных хлеба с творожным сыром + огурец", kcal: 480 },
        { name: "Тонкий лаваш + твёрдый сыр 50г + курица (сухая сковорода)", kcal: 420 },
        { name: "Овсянка 60г на молоке+воде + яйцо + банан", kcal: 450 },
        { name: "Творог 5% 200г + сметана 1 ст.л. + мёд 1 ч.л. + ягоды", kcal: 380 },
        { name: "Омлет 3 яйца + 50мл молока + 2 ломтика сыра + помидор", kcal: 410 }
    ],
    lunch: [
        { name: "Гречка 200г + куриное филе 180г + огурец/помидор", kcal: 520 },
        { name: "Макароны твёрдых сортов 200г + куриные бёдра без кожи + капуста", kcal: 560 },
        { name: "Рис 200г + гуляш из индейки 180г + тушёный кабачок", kcal: 540 },
        { name: "Картофельное пюре 200г + домашние котлеты (без хлеба) + огурец", kcal: 580 },
        { name: "Булгур 200г + куриные сердечки в сметане 10% + помидор", kcal: 510 }
    ],
    snack: [
        { name: "Яблоко/груша + 25г орехов (миндаль/кешью/грецкий)", kcal: 220 },
        { name: "Йогурт натуральный без сахара + 1 ч.л. мёда/изюм", kcal: 160 },
        { name: "2 рисовых хлебца + творожный сыр + ветчина из индейки", kcal: 190 }
    ],
    dinner: [
        { name: "Омлет 3 яйца с замороженными овощами (горошек, кукуруза)", kcal: 320 },
        { name: "Тушёная капуста с куриным фаршем/филе", kcal: 340 },
        { name: "Творог 5% 180г с кефиром или йогуртом без сахара", kcal: 280 }
    ]
};

const SCHEDULE_WEEKDAY = [
    { id: "breakfast", time: "07:45–08:00", name: "Плотный завтрак", required: true },
    { id: "college", time: "08:30–14:45", name: "Учёба (только вода / Nemoloko)", required: false },
    { id: "lunch", time: "15:15–15:45", name: "Сытный обед", required: true },
    { id: "snack", time: "18:00–18:30", name: "Лёгкий перекус", required: false },
    { id: "dinner", time: "20:15–20:45", name: "Белковый ужин", required: true }
];

const SCHEDULE_WEEKEND = [
    { id: "breakfast", time: "09:00–10:30", name: "Завтрак (можно позже)", required: true },
    { id: "lunch", time: "13:00–14:30", name: "Обед", required: true },
    { id: "snack", time: "16:30–17:30", name: "Перекус (по желанию)", required: false },
    { id: "dinner", time: "19:30–20:30", name: "Ужин", required: true }
];

const DAY_NAMES = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

function getTodaySchedule() {
    const day = new Date().getDay();
    return (day === 0 || day === 6) ? SCHEDULE_WEEKEND : SCHEDULE_WEEKDAY;
}

function getDayName() {
    return DAY_NAMES[new Date().getDay()];
}

function isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6;
}

// ===== STATE =====
let state = {
    water: 0,
    foods: [],
    weights: [],
    date: new Date().toDateString(),
    chatHistory: [],
    history: [],
    apiKey: localStorage.getItem("geminiApiKey") || ""
};

function loadState() {
    const saved = localStorage.getItem("geminiFoodTracker");
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toDateString()) {
            state = { ...state, ...parsed };
        } else {
            if (parsed.foods?.length > 0 || parsed.water > 0) {
                const hist = parsed.history || [];
                hist.unshift({ date: parsed.date, foods: parsed.foods || [], water: parsed.water || 0 });
                state.history = hist.slice(0, 14);
            } else {
                state.history = parsed.history || [];
            }
            state.date = new Date().toDateString();
            state.water = 0;
            state.foods = [];
            state.weights = parsed.weights || [];
            state.chatHistory = parsed.chatHistory || [];
            saveState();
        }
    }
    state.apiKey = localStorage.getItem("geminiApiKey") || "";
    render();
    renderChat();
    renderHistory();
    updateApiStatus();
}

function saveState() {
    localStorage.setItem("geminiFoodTracker", JSON.stringify({
        water: state.water,
        foods: state.foods,
        weights: state.weights,
        date: state.date,
        chatHistory: state.chatHistory,
        history: state.history
    }));
}

function buildSystemPrompt() {
    const foodsToday = state.foods.map(f => `• ${f.time} [${f.mealType || "своё"}] ${f.name} (~${f.kcal} ккал)`).join("\n") || "Пока ничего не отмечено";
    const lastWeight = state.weights.length ? state.weights[state.weights.length - 1] : null;
    const dayName = getDayName();
    const isWeekEnd = isWeekend();

    let historyText = "";
    if (state.history.length > 0) {
        historyText = "\nИСТОРИЯ ПРЕДЫДУЩИХ ДНЕЙ:\n";
        state.history.slice(0, 5).forEach(day => {
            const totalKcal = day.foods.reduce((s, f) => s + (f.kcal || 0), 0);
            historyText += `\n${day.date} (вода: ${day.water} стаканов, ~${totalKcal} ккал):\n`;
            day.foods.forEach(f => {
                historyText += `  • ${f.time || ""} ${f.name} (~${f.kcal} ккал)\n`;
            });
        });
    }

    return `Ты — Google Gemini, умный помощник по питанию внутри персонального трекера.

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
- Возраст: 16 лет (растущий организм, жёсткие диеты и голодание ЗАПРЕЩЕНЫ)
- Рост: 183 см
- Текущий вес: ${lastWeight ? lastWeight.weight + " кг" : "119 кг"}
- Целевой вес: 75 кг
- Безопасный темп: 3–4 кг в месяц
- Целевая калорийность: 2300–2400 ккал в день
- Норма воды: 2.5 литра (10 стаканов по 250 мл)

ЖЁСТКИЕ ИСКЛЮЧЕНИЯ (никогда не предлагай):
- Рыба — полностью запрещена
- Цитрусовые — запрещены
- Сложная зелень и листовые салаты — запрещены
- Разрешены только простые овощи: огурцы, помидоры, капуста, кабачки, замороженные овощные смеси
- Белый хлеб заменить на ржаной/цельнозерновой
- Сахар в напитках исключить
- Сладкое только после обеда как десерт (до 150-200 ккал)

СЕГОДНЯ: ${dayName} (${isWeekEnd ? "ВЫХОДНОЙ" : "будний день"})

РАСПИСАНИЕ СЕГОДНЯ:
${isWeekEnd ? 
`- 09:00–10:30 — завтрак
- 13:00–14:30 — обед
- 16:30–17:30 — перекус
- 19:30–20:30 — ужин` :
`- 07:45–08:00 — завтрак
- 08:30–14:45 — учёба (только вода/Nemoloko)
- 15:15–15:45 — обед
- 18:00–18:30 — перекус
- 20:15–20:45 — ужин`}

СЕГОДНЯ НА САЙТЕ:
- Вода: ${state.water} стаканов (${state.water * 250} мл из 2500)
- Съедено:
${foodsToday}
- Калории сегодня: ~${state.foods.reduce((s, f) => s + (f.kcal || 0), 0)} ккал
${historyText}

ПРАВИЛА:
- Отвечай по-русски, дружелюбно и по делу
- Учитывай сегодня и историю предыдущих дней
- Если прислали фото еды — оцени калории, состав, можно ли есть
- Предлагай только разрешённые продукты
- Не предлагай голодание`;
}

function updateApiStatus() {
    const el = document.getElementById("api-status");
    if (state.apiKey) {
        el.textContent = "Gemini подключён ✓";
        el.classList.add("ok");
    } else {
        el.textContent = "API-ключ не задан • нажми ⚙️";
        el.classList.remove("ok");
    }
}

function renderChat() {
    const container = document.getElementById("chat-messages");
    container.innerHTML = `<div class="message ai"><div class="bubble">Привет! Я Gemini. Можешь писать и отправлять фото еды — я помогу разобрать калории и что можно съесть.</div></div>`;
    state.chatHistory.forEach(msg => {
        const div = document.createElement("div");
        div.className = `message ${msg.role}`;
        let content = escapeHtml(msg.text);
        if (msg.image) {
            content = `<img src="data:${msg.image.mimeType};base64,${msg.image.data}" style="max-width:160px;border-radius:10px;margin-bottom:6px;display:block;">` + content;
        }
        div.innerHTML = `<div class="bubble">${content}</div>`;
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function clearSelectedPhoto() {
    selectedImage = null;
    document.getElementById("photo-preview").style.display = "none";
    document.getElementById("preview-img").src = "";
    document.getElementById("photo-input").value = "";
}

async function sendToGemini(userText) {
    if (!state.apiKey) {
        alert("Сначала добавь API-ключ Gemini (кнопка ⚙️)");
        return;
    }
    if (!userText && !selectedImage) return;

    const msg = { role: "user", text: userText || "Что на фото?" };
    if (selectedImage) {
        msg.image = { ...selectedImage };
    }
    state.chatHistory.push(msg);
    renderChat();
    saveState();

    const imageToSend = selectedImage;
    clearSelectedPhoto();

    const container = document.getElementById("chat-messages");
    const typing = document.createElement("div");
    typing.className = "message ai";
    typing.id = "typing";
    typing.innerHTML = `<div class="bubble typing">Gemini думает...</div>`;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    try {
        const systemPrompt = buildSystemPrompt();
        const parts = [{ text: systemPrompt }];

        // История + текущее сообщение
        const contents = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Понял контекст. Готов помогать, в том числе по фото." }] }
        ];

        state.chatHistory.slice(-10).forEach(m => {
            const p = [];
            if (m.image) {
                p.push({
                    inline_data: {
                        mime_type: m.image.mimeType,
                        data: m.image.data
                    }
                });
            }
            p.push({ text: m.text || "" });
            contents.push({
                role: m.role === "user" ? "user" : "model",
                parts: p
            });
        });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${state.apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
                })
            }
        );
        const data = await response.json();
        document.getElementById("typing")?.remove();

        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            state.chatHistory.push({ role: "ai", text: data.candidates[0].content.parts[0].text });
        } else {
            state.chatHistory.push({ role: "ai", text: `Ошибка: ${data.error?.message || "нет ответа"}` });
        }
        saveState();
        renderChat();
    } catch (err) {
        document.getElementById("typing")?.remove();
        state.chatHistory.push({ role: "ai", text: "Ошибка соединения. Проверь интернет и API-ключ." });
        saveState();
        renderChat();
    }
}

function getCurrentHour() {
    return new Date().getHours() + new Date().getMinutes() / 60;
}

function hasMeal(type) {
    return state.foods.some(f => f.mealType === type);
}

function renderTimeline() {
    const container = document.getElementById("timeline");
    container.innerHTML = "";
    const hour = getCurrentHour();
    const schedule = getTodaySchedule();
    const header = document.querySelector(".schedule-card .card-header h2");
    if (header) header.textContent = `📅 Расписание сегодня • ${getDayName()}`;

    schedule.forEach(item => {
        const el = document.createElement("div");
        el.className = "timeline-item";
        let status = "";
        if (item.id === "college") {
            status = "только вода / Nemoloko";
        } else if (hasMeal(item.id)) {
            status = "✓ отмечено";
            el.classList.add("done");
        } else {
            const startHour = parseFloat(item.time.split("–")[0].replace(":", "."));
            if (hour > startHour + 1.5 && item.required) {
                status = "пропущено?";
                el.classList.add("missed");
            } else if (hour >= startHour - 0.5 && hour <= startHour + 1.5) {
                status = "сейчас";
                el.classList.add("current");
            } else status = "ожидается";
        }
        el.innerHTML = `<span class="time">${item.time}</span><span class="meal-name">${item.name}</span><span class="status">${status}</span>`;
        container.appendChild(el);
    });
}

function renderMealOptions(type = "breakfast") {
    const container = document.getElementById("meal-options");
    container.innerHTML = "";
    MEALS[type].forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerHTML = `${opt.name}<small>~${opt.kcal} ккал</small>`;
        btn.addEventListener("click", () => addFood(opt.name, type, opt.kcal));
        container.appendChild(btn);
    });
}

function addFood(name, mealType, kcal) {
    const now = new Date();
    state.foods.unshift({
        name,
        mealType: mealType || "своё",
        kcal: Number(kcal) || 0,
        time: now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        timestamp: now.getTime()
    });
    saveState();
    render();
}

function renderHistory() {
    const container = document.getElementById("history-content");
    if (!state.history || state.history.length === 0) {
        container.innerHTML = `<p class="empty-state">Пока нет данных за предыдущие дни</p>`;
        return;
    }
    container.innerHTML = "";
    state.history.forEach(day => {
        const totalKcal = day.foods.reduce((s, f) => s + (f.kcal || 0), 0);
        const div = document.createElement("div");
        div.className = "history-day";
        let items = day.foods.map(f => `<div class="history-item">${f.time || ""} ${f.name} — ${f.kcal} ккал</div>`).join("");
        if (!items) items = `<div class="history-item">Ничего не записано</div>`;
        div.innerHTML = `
            <div class="history-day-title">${day.date}</div>
            ${items}
            <div class="history-summary">Вода: ${day.water} стаканов • Всего ~${totalKcal} ккал</div>
        `;
        container.appendChild(div);
    });
}

function render() {
    const percent = Math.min((state.water / WATER_GOAL_GLASSES) * 100, 100);
    document.getElementById("water-fill").style.height = percent + "%";
    document.getElementById("water-count").textContent = `${state.water} / ${WATER_GOAL_GLASSES}`;
    document.getElementById("glasses-drunk").textContent = state.water;
    document.getElementById("ml-drunk").textContent = state.water * ML_PER_GLASS;
    document.getElementById("water-percent").textContent = Math.round(percent) + "%";

    const list = document.getElementById("food-list");
    const empty = document.getElementById("empty-food");
    list.innerHTML = "";

    if (state.foods.length === 0) {
        empty.style.display = "block";
    } else {
        empty.style.display = "none";
        state.foods.forEach((food, index) => {
            const item = document.createElement("div");
            item.className = "food-item";
            item.innerHTML = `
                <div class="food-meta">
                    <span>${food.name}</span>
                    <span class="food-time">${food.time} • ${food.mealType || "своё"} • ~${food.kcal} ккал</span>
                </div>
                <button class="food-remove" data-index="${index}">×</button>
            `;
            list.appendChild(item);
        });
    }

    document.getElementById("meals-count").textContent = state.foods.length;
    document.getElementById("calories-est").textContent = "~" + state.foods.reduce((s, f) => s + (f.kcal || 0), 0);

    const wh = document.getElementById("weight-history");
    if (state.weights.length > 0) {
        const last = state.weights[state.weights.length - 1];
        wh.textContent = `Последний: ${last.weight} кг (${last.date})`;
    } else {
        wh.textContent = "Пока нет записей";
    }

    renderTimeline();
}

function initApp() {
    document.getElementById("send-btn").addEventListener("click", () => {
        const input = document.getElementById("chat-input");
        const text = input.value.trim();
        if (text || selectedImage) {
            input.value = "";
            sendToGemini(text);
        }
    });

    document.getElementById("chat-input").addEventListener("keydown", e => {
        if (e.key === "Enter") document.getElementById("send-btn").click();
    });

    // Фото
    document.getElementById("photo-input").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) {
            alert("Фото слишком большое (макс 4 МБ)");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(",")[1];
            selectedImage = {
                data: base64,
                mimeType: file.type || "image/jpeg"
            };
            document.getElementById("preview-img").src = reader.result;
            document.getElementById("photo-preview").style.display = "block";
        };
        reader.readAsDataURL(file);
    });

    document.getElementById("remove-photo").addEventListener("click", clearSelectedPhoto);

    document.getElementById("clear-chat").addEventListener("click", () => {
        if (confirm("Очистить историю чата?")) {
            state.chatHistory = [];
            saveState();
            renderChat();
        }
    });

    document.getElementById("settings-btn").addEventListener("click", () => {
        document.getElementById("api-key-input").value = state.apiKey;
        document.getElementById("settings-modal").classList.add("active");
    });

    document.getElementById("cancel-settings").addEventListener("click", () => {
        document.getElementById("settings-modal").classList.remove("active");
    });

    document.getElementById("save-settings").addEventListener("click", () => {
        state.apiKey = document.getElementById("api-key-input").value.trim();
        localStorage.setItem("geminiApiKey", state.apiKey);
        document.getElementById("settings-modal").classList.remove("active");
        updateApiStatus();
    });

    document.getElementById("add-water").addEventListener("click", () => {
        if (state.water < 15) { state.water++; saveState(); render(); }
    });

    document.getElementById("remove-water").addEventListener("click", () => {
        if (state.water > 0) { state.water--; saveState(); render(); }
    });

    document.getElementById("food-list").addEventListener("click", e => {
        if (e.target.classList.contains("food-remove")) {
            state.foods.splice(parseInt(e.target.dataset.index), 1);
            saveState();
            render();
        }
    });

    document.querySelectorAll(".meal-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".meal-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            renderMealOptions(tab.dataset.meal);
        });
    });

    document.getElementById("add-custom-food").addEventListener("click", () => {
        const name = document.getElementById("custom-name").value.trim();
        const kcal = parseInt(document.getElementById("custom-kcal").value);
        if (name && kcal > 0) {
            addFood(name, "своё", kcal);
            document.getElementById("custom-name").value = "";
            document.getElementById("custom-kcal").value = "";
        } else {
            alert("Напиши название и калории");
        }
    });

    document.getElementById("save-weight").addEventListener("click", () => {
        const val = parseFloat(document.getElementById("weight-input").value);
        if (val && val > 40 && val < 250) {
            state.weights.push({ weight: val, date: new Date().toLocaleDateString("ru-RU") });
            document.getElementById("weight-input").value = "";
            saveState();
            render();
        }
    });

    renderMealOptions("breakfast");
    loadState();
}

initLock();
