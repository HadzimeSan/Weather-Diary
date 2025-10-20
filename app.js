// Constants
function getApiKey() {
    const lsKey = localStorage.getItem('wd.apiKey');
    return (lsKey && lsKey.trim()) || (window.__WEATHER_API_KEY__ || '');
}
function setApiKey(value) {
    if (value && value.trim()) {
        localStorage.setItem('wd.apiKey', value.trim());
    }
}
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const ICON_URL = 'https://openweathermap.org/img/wn/';
const STORAGE_KEYS = {
    history: 'wd.history',
    diary: 'wd.diary',
    lang: 'wd.lang'
};

// Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const historyEl = document.getElementById('history');
const currentEl = document.getElementById('current-weather');
const forecastEl = document.getElementById('forecast');
const tplForecastItem = document.getElementById('forecast-item-tpl');

const diaryForm = document.getElementById('diary-form');
const diaryDate = document.getElementById('diary-date');
const diaryCity = document.getElementById('diary-city');
const diaryNote = document.getElementById('diary-note');
const diaryList = document.getElementById('diary-list');
const langSelect = document.getElementById('lang-select');

// i18n helpers
function getLang() {
    return localStorage.getItem(STORAGE_KEYS.lang) || 'ru';
}
function setLang(lang) {
    localStorage.setItem(STORAGE_KEYS.lang, lang);
}

const TRANSLATIONS = {
    ru: {
        'app.title': 'Персональный Дневник Погоды',
        'app.language': 'Язык',
        'search.placeholder': 'Введите город (например, Москва)',
        'search.button': 'Найти',
        'section.now': 'Сейчас',
        'section.forecast': 'Прогноз на 5 дней',
        'section.diary': 'Дневник',
        'diary.cityPlaceholder': 'Город для заметки',
        'diary.notePlaceholder': 'Ваши ощущения от погоды, планы, наблюдения...',
        'diary.save': 'Сохранить заметку',
        'footer.source': 'Данные погоды: OpenWeatherMap',
        'footer.link': 'Сайт API',
        'message.start': 'Введите город и нажмите Найти',
        'message.enterCity': 'Введите название города',
        'message.needKey': 'Требуется API ключ OpenWeather. Введите ключ, затем повторите поиск.',
        'message.promptKey': 'Введите ваш OpenWeather API ключ (https://openweathermap.org/)',
        'message.promptKeyShort': 'Введите ваш OpenWeather API ключ',
        'message.keyInvalidConfirm': 'Неверный ключ. Ввести новый сейчас?',
        'message.error': 'Ошибка',
        'message.fetchFail': 'не удалось получить данные',
        'label.feels': 'Ощущается как',
        'label.humidity': 'Влажн',
        'label.wind': 'Ветер',
        'diary.empty': 'Заметок пока нет',
        'diary.delete': 'Удалить',
        'loading': 'Загружаю...'
    },
    en: {
        'app.title': 'Personal Weather Diary',
        'app.language': 'Language',
        'search.placeholder': 'Enter city (e.g., London)',
        'search.button': 'Search',
        'section.now': 'Now',
        'section.forecast': '5-day Forecast',
        'section.diary': 'Diary',
        'diary.cityPlaceholder': 'City for note',
        'diary.notePlaceholder': 'Your weather feelings, plans, observations…',
        'diary.save': 'Save Note',
        'footer.source': 'Weather data: OpenWeatherMap',
        'footer.link': 'API Website',
        'message.start': 'Type a city and press Search',
        'message.enterCity': 'Please enter a city name',
        'message.needKey': 'OpenWeather API key required. Enter the key and retry.',
        'message.promptKey': 'Enter your OpenWeather API key (https://openweathermap.org/)',
        'message.promptKeyShort': 'Enter your OpenWeather API key',
        'message.keyInvalidConfirm': 'Invalid key. Enter a new one now?',
        'message.error': 'Error',
        'message.fetchFail': 'failed to fetch data',
        'label.feels': 'Feels like',
        'label.humidity': 'Humidity',
        'label.wind': 'Wind',
        'diary.empty': 'No notes yet',
        'diary.delete': 'Delete',
        'loading': 'Loading...'
    },
    es: {
        'app.title': 'Diario Personal del Clima',
        'app.language': 'Idioma',
        'search.placeholder': 'Ingrese ciudad (p. ej., Madrid)',
        'search.button': 'Buscar',
        'section.now': 'Ahora',
        'section.forecast': 'Pronóstico de 5 días',
        'section.diary': 'Diario',
        'diary.cityPlaceholder': 'Ciudad para la nota',
        'diary.notePlaceholder': 'Sensaciones del clima, planes, observaciones…',
        'diary.save': 'Guardar nota',
        'footer.source': 'Datos del clima: OpenWeatherMap',
        'footer.link': 'Sitio del API',
        'message.start': 'Escriba una ciudad y presione Buscar',
        'message.enterCity': 'Ingrese el nombre de una ciudad',
        'message.needKey': 'Se requiere clave de OpenWeather. Introdúzcala y vuelva a intentar.',
        'message.promptKey': 'Ingrese su clave de OpenWeather (https://openweathermap.org/)',
        'message.promptKeyShort': 'Ingrese su clave de OpenWeather',
        'message.keyInvalidConfirm': 'Clave inválida. ¿Ingresar una nueva ahora?',
        'message.error': 'Error',
        'message.fetchFail': 'no se pudieron obtener los datos',
        'label.feels': 'Sensación',
        'label.humidity': 'Humedad',
        'label.wind': 'Viento',
        'diary.empty': 'Aún no hay notas',
        'diary.delete': 'Eliminar',
        'loading': 'Cargando...'
    }
};

function t(key) {
    const lang = getLang();
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', t(key));
    });
}

// Utils
function toCelsius(kelvin) {
    return Math.round(kelvin - 273.15);
}

function fmtTempRange(minK, maxK) {
    return `${toCelsius(minK)}° / ${toCelsius(maxK)}°`;
}

function fmtDate(tsSec, options = {}) {
    const d = new Date(tsSec * 1000);
    const locales = { ru: 'ru-RU', en: 'en-US', es: 'es-ES' };
    return d.toLocaleDateString(locales[getLang()] || 'en-US', { weekday: 'short', day: '2-digit', month: 'short', ...options });
}

function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
}

function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function loadJSON(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}

// History
function getHistory() { return loadJSON(STORAGE_KEYS.history, []); }
function setHistory(list) { saveJSON(STORAGE_KEYS.history, list.slice(0, 8)); }
function addToHistory(city) {
    const list = getHistory();
    const normalized = city.trim();
    const idx = list.findIndex(c => c.toLowerCase() === normalized.toLowerCase());
    if (idx !== -1) list.splice(idx, 1);
    list.unshift(normalized);
    setHistory(list);
    renderHistory();
}
function renderHistory() {
    const list = getHistory();
    historyEl.innerHTML = '';
    list.forEach(city => {
        const chip = createEl('button', 'chip');
        chip.type = 'button';
        chip.textContent = city;
        chip.addEventListener('click', () => {
            cityInput.value = city;
            doSearch(city);
        });
        historyEl.appendChild(chip);
    });
}

// Diary
function getDiary() { return loadJSON(STORAGE_KEYS.diary, []); }
function setDiary(entries) { saveJSON(STORAGE_KEYS.diary, entries); }
function addDiaryEntry(entry) {
    const entries = getDiary();
    entries.unshift(entry);
    setDiary(entries);
    renderDiary();
}
function deleteDiaryEntry(id) {
    const entries = getDiary().filter(e => e.id !== id);
    setDiary(entries);
    renderDiary();
}
function renderDiary() {
    const entries = getDiary();
    diaryList.innerHTML = '';
    if (!entries.length) {
        diaryList.appendChild(createEl('div', 'placeholder', t('diary.empty')));
        return;
    }
    for (const e of entries) {
        const card = createEl('div', 'card diary-item');
        const meta = createEl('div', 'meta', `${e.date} — ${e.city}`);
        const note = createEl('div', 'note');
        note.textContent = e.note;
        const actions = createEl('div', 'actions');
        const del = createEl('button', 'btn-link btn-danger', t('diary.delete'));
        del.type = 'button';
        del.addEventListener('click', () => deleteDiaryEntry(e.id));
        actions.appendChild(del);
        card.appendChild(meta);
        card.appendChild(note);
        card.appendChild(actions);
        diaryList.appendChild(card);
    }
}

// Weather API
async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            if (data && (data.message || data.cod)) {
                message = `${message} — ${data.message || data.cod}`;
            }
        } catch {}
        const err = new Error(message);
        err._status = res.status;
        throw err;
    }
    return await res.json();
}

async function getWeatherByCity(city) {
    const q = encodeURIComponent(city.trim());
    const apiKey = getApiKey();
    const lang = getLang();
    const currentUrl = `${BASE_URL}/weather?q=${q}&appid=${apiKey}&lang=${lang}`;
    const forecastUrl = `${BASE_URL}/forecast?q=${q}&appid=${apiKey}&lang=${lang}`;
    const [current, forecast] = await Promise.all([
        fetchJSON(currentUrl),
        fetchJSON(forecastUrl)
    ]);
    return { current, forecast };
}

function renderCurrent(data) {
    const { name, sys, main, weather, wind } = data;
    const icon = weather?.[0]?.icon;
    const desc = weather?.[0]?.description ?? '';
    const temp = toCelsius(main.temp);
    const feels = toCelsius(main.feels_like);
    const humidity = main.humidity;
    const windMs = Math.round(wind.speed);

    currentEl.innerHTML = '';
    const card = createEl('div', 'card');
    const row = createEl('div', 'row');
    const title = createEl('div', 'title', `${name}, ${sys.country}`);
    const iconImg = document.createElement('img');
    iconImg.width = 64; iconImg.height = 64; iconImg.alt = 'Иконка';
    iconImg.src = `${ICON_URL}${icon}@2x.png`;
    row.appendChild(title);
    row.appendChild(iconImg);

    const tempEl = createEl('div', 'temp-big', `${temp}°C`);
    const descEl = createEl('div', 'muted', desc);
    const windUnit = getLang() === 'en' ? 'm/s' : (getLang() === 'es' ? 'm/s' : 'м/с');
    const more = createEl('div', 'muted', `${t('label.feels')}: ${feels}°C · ${t('label.humidity')}: ${humidity}% · ${t('label.wind')}: ${windMs} ${windUnit}`);

    card.appendChild(row);
    card.appendChild(descEl);
    card.appendChild(tempEl);
    card.appendChild(more);
    currentEl.appendChild(card);
}

function pickDailyFrom3hList(list) {
    const byDay = new Map();
    for (const it of list) {
        const day = new Date(it.dt * 1000).toISOString().slice(0, 10);
        const arr = byDay.get(day) || [];
        arr.push(it);
        byDay.set(day, arr);
    }
    const days = Array.from(byDay.entries())
        .map(([day, arr]) => {
            const min = Math.min(...arr.map(a => a.main.temp_min));
            const max = Math.max(...arr.map(a => a.main.temp_max));
            const atNoon = arr.find(a => a.dt_txt.includes('12:00:00')) || arr[Math.floor(arr.length/2)];
            return { day, min, max, icon: atNoon.weather?.[0]?.icon, desc: atNoon.weather?.[0]?.description, ts: atNoon.dt };
        })
        .sort((a, b) => a.ts - b.ts)
        .slice(0, 5);
    return days;
}

function renderForecast(data) {
    forecastEl.innerHTML = '';
    const days = pickDailyFrom3hList(data.list);
    for (const d of days) {
        const node = tplForecastItem.content.firstElementChild.cloneNode(true);
        node.querySelector('.date').textContent = fmtDate(d.ts, { weekday: 'short', day: '2-digit' });
        node.querySelector('.icon').src = `${ICON_URL}${d.icon}.png`;
        node.querySelector('.icon').alt = d.desc || 'Иконка';
        node.querySelector('.temp').textContent = fmtTempRange(d.min, d.max);
        node.querySelector('.desc').textContent = d.desc || '';
        forecastEl.appendChild(node);
    }
}

async function doSearch(city) {
    const q = (city ?? cityInput.value).trim();
    if (!q) {
        currentEl.innerHTML = `<div class="card placeholder">${t('message.enterCity')}</div>`;
        forecastEl.innerHTML = '';
        return;
    }
    if (!getApiKey()) {
        currentEl.innerHTML = `<div class="card placeholder">${t('message.needKey')}</div>`;
        const entered = window.prompt(t('message.promptKey'));
        if (entered) setApiKey(entered);
    }
    currentEl.innerHTML = `<div class="card placeholder">${t('loading')}</div>`;
    forecastEl.innerHTML = '';
    try {
        const { current, forecast } = await getWeatherByCity(q);
        renderCurrent(current);
        renderForecast(forecast);
        addToHistory(current.name);
        diaryCity.value = current.name;
        if (!diaryDate.value) diaryDate.value = new Date().toISOString().slice(0,10);
        lastCitySearched = current.name;
    } catch (err) {
        if (err && err._status === 401) {
            const tryNew = window.confirm(t('message.keyInvalidConfirm'));
            if (tryNew) {
                const entered = window.prompt(t('message.promptKeyShort'));
                if (entered) {
                    setApiKey(entered);
                    return doSearch(q);
                }
            }
        }
        currentEl.innerHTML = `<div class=\"card placeholder\">${t('message.error')}: ${(err && err.message) || t('message.fetchFail')}</div>`;
    }
}

// Events
searchBtn.addEventListener('click', () => doSearch());
cityInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });

let lastCitySearched = null;

if (langSelect) {
    langSelect.addEventListener('change', () => {
        setLang(langSelect.value);
        applyTranslations();
        // Refresh displayed data in the new language if we have a recent city
        const city = lastCitySearched || cityInput.value;
        if (city && city.trim()) {
            doSearch(city);
        }
    });
}

diaryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = diaryDate.value || new Date().toISOString().slice(0,10);
    const city = (diaryCity.value || cityInput.value || '').trim();
    const note = diaryNote.value.trim();
    if (!city || !note) return;
    addDiaryEntry({ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, date, city, note });
    diaryNote.value = '';
});

// Init
function init() {
    // initialize language UI and texts
    if (langSelect) langSelect.value = getLang();
    applyTranslations();
    renderHistory();
    renderDiary();
    const last = getHistory()[0];
    if (last) {
        cityInput.value = last;
        doSearch(last);
    }
}

document.addEventListener('DOMContentLoaded', init);


