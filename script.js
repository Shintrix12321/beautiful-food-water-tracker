// Печальный Трекер Питания и Воды
// Контекст: 16 лет, 183 см, 119→75 кг, колледж ГАПОУ ИНК ЭС2-26

const WATER_GOAL_ML = 2500;
const ML_PER_GLASS = 250;
const WATER_GOAL_GLASSES = 10;

// База еды строго по ограничениям
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

const SCHEDULE = [
    { id: "breakfast", time: "07:45–08:00", name: "Плотный завтрак", required: true },
    { id: "college", time: "08:30–14:45", name: "Учёба (только вода / Nemoloko)", required: false },
    { id: "lunch", time: "15:15–15:45", name: "Сытный обед", required: true },
    { id: "snack", time: "18:00–18:30", name: "Лёгкий перекус", required: false },
    { id: "dinner", time: "20:15–20:45", name: "Белковый ужин", required: true }
];

// Печальные фразы ИИ
const SAD_PHRASES = {
    morning: [
        "Утро... Ты уже поел? Тело ждёт топлива. Без завтрака всё замедляется.",
        "Я тихо надеюсь, что ты не пропустил завтрак. Это важно...",
        "07:45. Время плотного завтрака. Не игнорируй его, пожалуйста."
    ],
    noBreakfast: [
        "Ты не отметил завтрак до 09:30... Метаболизм уже начал грустить. Выпей Nemoloko на перемене и добавь 50 г углеводов к обеду.",
        "Завтрак пропущен. Мне жаль. Теперь придётся компенсировать на обеде. Не голодай.",
        "Без завтрака день становится тяжелее. Я предупреждал... Добавь углеводов к обеду."
    ],
    lowWater: [
        "К 16:00 меньше 3 стаканов... Вода важна. Иначе тело путает жажду с голодом.",
        "Ты пьёшь слишком мало. Мне тревожно. Выпей хотя бы стакан сейчас.",
        "Вода... её почти нет. Ложное чувство голода уже близко."
    ],
    goodWater: [
        "С водой сегодня лучше. Это радует... хоть немного.",
        "Ты пьёшь. Хорошо. Продолжай."
    ],
    evening: [
        "Вечер. Ужин должен быть белковым и не слишком поздним.",
        "Скоро ужин. Не переедай. Тело устало за день."
    ],
    default: [
        "Я здесь. Просто смотрю. Не торопись с весом. 3–4 кг в месяц — это правильно.",
        "Растущий организм... нельзя спешить. Я буду рядом.",
        "119 → 75. Долгий путь. Но мы пройдём его спокойно.",
        "Если тяжело — просто отметь воду. Маленький шаг тоже считается."
    ],
    weightDown: [
        "Вес снизился... Тихая радость. Но не ускоряйся.",
        "Минус есть. Хорошо. Продолжай в том же темпе."
    ],
    weightSame: [
        "Вес стоит. Бывает. Главное — не срываться и не голодать."
    ]
};

let state = {
    water: 0,
    foods: [],
    weights: [],
    date: new Date().toDateString(),
    lastAiMessage: ""
};

function loadState() {
    const saved = localStorage.getItem('sadFoodWaterTracker');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toDateString()) {
            state = parsed;
        } else {
            // Новый день
            state.date = new Date().toDateString();
            state.water = 0;
            state.foods = [];
            state.weights = parsed.weights || [];
            saveState();
        }
    }
    render();
    updateAiMessage();
}

function saveState() {
    localStorage.setItem('sadFoodWaterTracker', JSON.stringify(state));
}

function getCurrentHour() {
    return new Date().getHours() + new Date().getMinutes() / 60;
}

function hasMeal(type) {
    return state.foods.some(f => f.mealType === type);
}

function updateAiMessage() {
    const hour = getCurrentHour();
    let message = "";

    // Пропущенный завтрак
    if (hour >= 9.5 && !hasMeal("breakfast")) {
        message = SAD_PHRASES.noBreakfast[Math.floor(Math.random() * SAD_PHRASES.noBreakfast.length)];
    }
    // Мало воды к 16:00
    else if (hour >= 16 && state.water < 3) {
        message = SAD_PHRASES.lowWater[Math.floor(Math.random() * SAD_PHRASES.lowWater.length)];
    }
    // Утро
    else if (hour >= 7 && hour < 9) {
        message = SAD_PHRASES.morning[Math.floor(Math.random() * SAD_PHRASES.morning.length)];
    }
    // Вечер
    else if (hour >= 19 && hour < 21) {
        message = SAD_PHRASES.evening[Math.floor(Math.random() * SAD_PHRASES.evening.length)];
    }
    // Хорошая вода
    else if (state.water >= 6) {
        message = SAD_PHRASES.goodWater[Math.floor(Math.random() * SAD_PHRASES.goodWater.length)];
    }
    else {
        message = SAD_PHRASES.default[Math.floor(Math.random() * SAD_PHRASES.default.length)];
    }

    document.getElementById("ai-main-message").textContent = message;
    state.lastAiMessage = message;
}

function renderTimeline() {
    const container = document.getElementById("timeline");
    container.innerHTML = "";
    const hour = getCurrentHour();

    SCHEDULE.forEach(item => {
        const el = document.createElement("div");
        el.className = "timeline-item";

        let status = "";
        let statusClass = "";

        if (item.id === "college") {
            status = "только вода / Nemoloko";
        } else if (hasMeal(item.id)) {
            status = "✓ отмечено";
            el.classList.add("done");
        } else {
            // Примерное время
            const startHour = parseFloat(item.time.split("–")[0].replace(":", "."));
            if (hour > startHour + 1.5 && item.required) {
                status = "пропущено?";
                el.classList.add("missed");
            } else if (hour >= startHour - 0.5 && hour <= startHour + 1) {
                status = "сейчас";
                el.classList.add("current");
            } else {
                status = "ожидается";
            }
        }

        el.innerHTML = `
            <span class="time">${item.time}</span>
            <span class="meal-name">${item.name}</span>
            <span class="status">${status}</span>
        `;
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
        btn.addEventListener("click", () => {
            addFood(opt.name, type, opt.kcal);
        });
        container.appendChild(btn);
    });
}

function addFood(name, mealType, kcal) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    state.foods.unshift({
        name,
        mealType,
        kcal,
        time: timeStr,
        timestamp: now.getTime()
    });
    saveState();
    render();
    updateAiMessage();
}

function render() {
    // Water
    const percent = Math.min((state.water / WATER_GOAL_GLASSES) * 100, 100);
    document.getElementById("water-fill").style.height = percent + "%";
    document.getElementById("water-count").textContent = `${state.water} / ${WATER_GOAL_GLASSES}`;
    document.getElementById("glasses-drunk").textContent = state.water;
    document.getElementById("ml-drunk").textContent = state.water * ML_PER_GLASS;
    document.getElementById("water-percent").textContent = Math.round(percent) + "%";

    // Foods
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
                    <span class="food-time">${food.time} • ${food.mealType} • ~${food.kcal} ккал</span>
                </div>
                <button class="food-remove" data-index="${index}">×</button>
            `;
            list.appendChild(item);
        });
    }

    // Stats
    document.getElementById("meals-count").textContent = state.foods.length;
    const totalKcal = state.foods.reduce((sum, f) => sum + (f.kcal || 0), 0);
    document.getElementById("calories-est").textContent = "~" + totalKcal;

    // Weight history
    const wh = document.getElementById("weight-history");
    if (state.weights.length > 0) {
        const last = state.weights[state.weights.length - 1];
        wh.textContent = `Последний: ${last.weight} кг (${last.date})`;
    } else {
        wh.textContent = "Пока нет записей. Можно вносить раз в 2 недели.";
    }

    renderTimeline();
}

// Events
document.getElementById("add-water").addEventListener("click", () => {
    if (state.water < 15) {
        state.water++;
        saveState();
        render();
        updateAiMessage();
    }
});

document.getElementById("remove-water").addEventListener("click", () => {
    if (state.water > 0) {
        state.water--;
        saveState();
        render();
        updateAiMessage();
    }
});

document.getElementById("food-list").addEventListener("click", (e) => {
    if (e.target.classList.contains("food-remove")) {
        const index = parseInt(e.target.dataset.index);
        state.foods.splice(index, 1);
        saveState();
        render();
        updateAiMessage();
    }
});

document.querySelectorAll(".meal-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".meal-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        renderMealOptions(tab.dataset.meal);
    });
});

document.getElementById("save-weight").addEventListener("click", () => {
    const val = parseFloat(document.getElementById("weight-input").value);
    if (val && val > 40 && val < 250) {
        const today = new Date().toLocaleDateString("ru-RU");
        state.weights.push({ weight: val, date: today });
        document.getElementById("weight-input").value = "";
        saveState();
        render();

        // Печальный комментарий
        const prev = state.weights.length > 1 ? state.weights[state.weights.length - 2].weight : 119;
        if (val < prev) {
            document.getElementById("ai-main-message").textContent =
                SAD_PHRASES.weightDown[Math.floor(Math.random() * SAD_PHRASES.weightDown.length)];
        } else {
            document.getElementById("ai-main-message").textContent =
                SAD_PHRASES.weightSame[Math.floor(Math.random() * SAD_PHRASES.weightSame.length)];
        }
    }
});

// Init
renderMealOptions("breakfast");
loadState();

// Обновлять ИИ каждые 5 минут
setInterval(updateAiMessage, 5 * 60 * 1000);
