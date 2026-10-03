// Beautiful Food & Water Tracker
// Local storage + AI-ready structure

const WATER_GOAL = 8; // glasses
const ML_PER_GLASS = 250;

// Quick food suggestions (можно заменить на список из диалога Google AI)
const QUICK_FOODS = [
    "Овсянка",
    "Яйца",
    "Курица",
    "Салат",
    "Рис",
    "Банан",
    "Йогурт",
    "Рыба",
    "Овощи",
    "Орехи"
];

// State
let state = {
    water: 0,
    foods: [],
    date: new Date().toDateString()
};

// Load from localStorage
function loadState() {
    const saved = localStorage.getItem('foodWaterTracker');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Reset if new day
        if (parsed.date === new Date().toDateString()) {
            state = parsed;
        } else {
            // Keep history if needed, but start fresh for today
            state.date = new Date().toDateString();
            state.water = 0;
            state.foods = [];
            saveState();
        }
    }
    render();
}

function saveState() {
    localStorage.setItem('foodWaterTracker', JSON.stringify(state));
}

// Render everything
function render() {
    // Water
    const percent = Math.min((state.water / WATER_GOAL) * 100, 100);
    document.getElementById('water-fill').style.height = percent + '%';
    document.getElementById('water-count').textContent = `${state.water} / ${WATER_GOAL}`;
    document.getElementById('glasses-drunk').textContent = state.water;
    document.getElementById('ml-drunk').textContent = state.water * ML_PER_GLASS;
    document.getElementById('water-goal').textContent = Math.round(percent) + '%';

    // Foods
    const list = document.getElementById('food-list');
    const empty = document.getElementById('empty-food');
    list.innerHTML = '';

    if (state.foods.length === 0) {
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        state.foods.forEach((food, index) => {
            const item = document.createElement('div');
            item.className = 'food-item';
            item.innerHTML = `
                <div class="food-info">
                    <span class="food-name">${escapeHtml(food.name)}</span>
                    <span class="food-time">${food.time || 'сегодня'}</span>
                </div>
                <button class="food-remove" data-index="${index}" title="Удалить">×</button>
            `;
            list.appendChild(item);
        });
    }

    document.getElementById('total-meals').textContent = state.foods.length;

    // Quick foods
    const quick = document.getElementById('quick-foods');
    if (quick.children.length === 0) {
        QUICK_FOODS.forEach(food => {
            const btn = document.createElement('button');
            btn.className = 'quick-btn';
            btn.textContent = food;
            btn.addEventListener('click', () => addFood(food));
            quick.appendChild(btn);
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Water actions
document.getElementById('add-water').addEventListener('click', () => {
    if (state.water < 20) { // soft limit
        state.water++;
        saveState();
        render();
        // Nice feedback
        createSplash();
    }
});

document.getElementById('remove-water').addEventListener('click', () => {
    if (state.water > 0) {
        state.water--;
        saveState();
        render();
    }
});

function createSplash() {
    // Simple visual feedback - could expand to particles
    const fill = document.getElementById('water-fill');
    fill.style.transition = 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
}

// Food actions
function addFood(name, time = null) {
    const now = new Date();
    const timeStr = time || now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    state.foods.unshift({ name, time: timeStr, timestamp: now.getTime() });
    saveState();
    render();
}

document.getElementById('add-food-btn').addEventListener('click', () => {
    document.getElementById('food-modal').classList.add('active');
    document.getElementById('food-name').focus();
});

document.getElementById('cancel-food').addEventListener('click', () => {
    document.getElementById('food-modal').classList.remove('active');
    document.getElementById('food-name').value = '';
    document.getElementById('food-time').value = '';
});

document.getElementById('save-food').addEventListener('click', () => {
    const name = document.getElementById('food-name').value.trim();
    if (name) {
        const time = document.getElementById('food-time').value.trim() || null;
        addFood(name, time);
        document.getElementById('food-modal').classList.remove('active');
        document.getElementById('food-name').value = '';
        document.getElementById('food-time').value = '';
    }
});

// Remove food
document.getElementById('food-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('food-remove')) {
        const index = parseInt(e.target.dataset.index);
        state.foods.splice(index, 1);
        saveState();
        render();
    }
});

// AI demo tip
document.getElementById('get-ai-tip').addEventListener('click', () => {
    const tips = [
        state.water < 4 ? "Выпей ещё стакан воды — ты ещё не на половине цели 💧" :
        state.water >= WATER_GOAL ? "Отлично! Ты выполнил норму воды сегодня 🎉" :
        "Продолжай в том же духе с водой!",

        state.foods.length === 0 ? "Добавь первый приём пищи, чтобы AI мог давать точные советы 🍽️" :
        state.foods.length < 3 ? "Попробуй добавить больше разнообразия в рацион" :
        "Хороший баланс приёмов пищи сегодня!",

        "Совет: пей воду за 30 минут до еды — это помогает пищеварению",
        "Не забывай про белок и овощи в каждом приёме",
        "Вечером лучше пить меньше воды, чтобы не нарушать сон"
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    const content = document.getElementById('ai-content');
    content.innerHTML = `
        <p style="color: var(--text); line-height: 1.6; margin-bottom: 12px;">✨ ${randomTip}</p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Это демо-совет. Подключи Google Gemini API для настоящих персональных рекомендаций на основе твоего рациона.</p>
        <button class="btn btn-ai" id="get-ai-tip">Ещё совет</button>
    `;
    // Re-bind
    document.getElementById('get-ai-tip').addEventListener('click', arguments.callee);
});

// Enter key in modal
document.getElementById('food-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('save-food').click();
});

// Init
loadState();
