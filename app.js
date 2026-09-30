"use strict";

const STORAGE_KEY = "desafio30Dias.v1";
const CHECK_KEYS = ["breakfast", "lunch", "dinner", "workout", "sugar", "gluten", "dairy"];
const MEAL_KEYS = ["breakfast", "lunch", "dinner"];

const allowedFoods = {
  "Proteínas": ["Ovos", "Frango", "Carne bovina", "Peixe", "Sardinha", "Atum", "Camarão", "Carne suína sem ingredientes proibidos"],
  "Carboidratos sem glúten": ["Arroz", "Feijão", "Mandioca/macaxeira", "Batata", "Batata-doce", "Inhame", "Cuscuz de milho", "Tapioca", "Milho", "Quinoa"],
  "Frutas": ["Banana", "Maçã", "Mamão", "Melancia", "Melão", "Laranja", "Abacaxi", "Morango", "Abacate", "Manga"],
  "Verduras e legumes": ["Alface", "Tomate", "Cenoura", "Pepino", "Brócolis", "Couve", "Abóbora", "Chuchu", "Beterraba", "Outras verduras e legumes"],
  "Gorduras boas": ["Azeite", "Abacate", "Castanhas", "Amendoim", "Coco"]
};

const avoidFoods = {
  "Açúcar": ["Açúcar adicionado", "Doces e sobremesas", "Bolos e biscoitos convencionais", "Xaropes e caldas açucaradas"],
  "Glúten e trigo": ["Pães convencionais", "Macarrão de trigo", "Farinha de trigo", "Bolos e biscoitos com trigo"],
  "Lactose e laticínios": ["Leite e derivados, conforme seu objetivo", "Queijos e iogurtes, se estiver evitando laticínios"],
  "Bebidas": ["Refrigerantes", "Bebidas açucaradas", "Sucos industrializados adoçados"],
  "Ultraprocessados": ["Produtos com ingredientes incompatíveis com seu objetivo", "Produtos sem conferência do rótulo"]
};

let state = loadState();
let selectedDay = getCurrentDayIndex();

function localDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function todayAtNoon() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

function defaultState() {
  return {
    version: 1,
    startDate: localDateString(todayAtNoon()),
    waterGoal: 2000,
    glassSize: 250,
    days: {},
    pantry: {}
  };
}

function loadState() {
  const fallback = defaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return fallback;
    return {
      ...fallback,
      ...saved,
      days: saved.days && typeof saved.days === "object" ? saved.days : {},
      pantry: saved.pantry && typeof saved.pantry === "object" ? saved.pantry : {}
    };
  } catch (error) {
    console.warn("Não foi possível ler os dados salvos; iniciando com valores padrão.", error);
    return fallback;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Não foi possível salvar no localStorage.", error);
  }
}

function emptyDay() {
  return {
    breakfast: false, lunch: false, dinner: false, workout: false,
    sugar: false, gluten: false, dairy: false, waterCups: 0
  };
}

function getDay(index) {
  const key = String(index);
  if (!state.days[key]) state.days[key] = emptyDay();
  return state.days[key];
}

function getCurrentDayIndex() {
  const start = parseLocalDate(state.startDate);
  const today = todayAtNoon();
  const diff = Math.floor((today - start) / 86400000);
  return Math.max(0, Math.min(29, diff));
}

function dateForDay(index) {
  const date = parseLocalDate(state.startDate);
  date.setDate(date.getDate() + index);
  return date;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function waterAmount(day) {
  return Math.max(0, Number(day.waterCups) || 0) * Number(state.glassSize);
}

function waterReached(day) {
  return waterAmount(day) >= Number(state.waterGoal);
}

function isDayComplete(index) {
  const day = getDay(index);
  return CHECK_KEYS.every((key) => Boolean(day[key])) && waterReached(day);
}

function isCleanDay(index) {
  const day = getDay(index);
  return Boolean(day.sugar && day.gluten && day.dairy);
}

function completedDaysCount() {
  return Array.from({ length: 30 }, (_, i) => i).filter(isDayComplete).length;
}

function currentStreak() {
  const today = getCurrentDayIndex();
  let streak = 0;
  for (let i = today; i >= 0; i--) {
    if (!isDayComplete(i)) break;
    streak++;
  }
  return streak;
}

function formatMl(value) {
  return `${new Intl.NumberFormat("pt-BR").format(value)} ml`;
}

function renderDays() {
  const grid = document.getElementById("day-grid");
  grid.innerHTML = "";
  for (let i = 0; i < 30; i++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-dot";
    button.textContent = String(i + 1);
    button.setAttribute("aria-label", `Dia ${i + 1}${isDayComplete(i) ? ", concluído" : ""}`);
    if (isDayComplete(i)) button.classList.add("done");
    if (i === selectedDay) button.classList.add("selected");
    button.addEventListener("click", () => {
      selectedDay = i;
      renderAll();
      showPage("diario");
    });
    grid.appendChild(button);
  }
}

function renderStats() {
  const completed = completedDaysCount();
  const meals = Array.from({ length: 30 }, (_, i) => getDay(i))
    .reduce((total, day) => total + MEAL_KEYS.filter((key) => day[key]).length, 0);
  const workouts = Array.from({ length: 30 }, (_, i) => getDay(i).workout).filter(Boolean).length;
  const cleanDays = Array.from({ length: 30 }, (_, i) => isCleanDay(i)).filter(Boolean).length;
  const progress = Math.round((completed / 30) * 100);
  const today = getCurrentDayIndex();
  const selected = dateForDay(selectedDay);

  document.getElementById("current-day-stat").textContent = `${today + 1} / 30`;
  document.getElementById("challenge-date").textContent = formatDate(dateForDay(today));
  document.getElementById("completed-days-stat").textContent = String(completed);
  document.getElementById("streak-stat").textContent = String(currentStreak());
  document.getElementById("workouts-stat").textContent = String(workouts);
  document.getElementById("progress-label").textContent = `${progress}%`;
  document.getElementById("challenge-progress-fill").style.width = `${progress}%`;
  document.getElementById("challenge-progress").setAttribute("aria-valuenow", String(progress));
  document.getElementById("meals-count").textContent = `${meals} refeições cumpridas`;
  document.getElementById("clean-days-count").textContent = `${cleanDays} dias sem itens evitados`;
  document.getElementById("selected-day-title").textContent = `Dia ${selectedDay + 1} · ${formatDate(selected)}`;
}

function renderWater() {
  const day = getDay(selectedDay);
  const consumed = waterAmount(day);
  const goal = Number(state.waterGoal);
  const percent = goal > 0 ? Math.min(100, Math.round((consumed / goal) * 100)) : 0;
  document.getElementById("water-count").textContent = formatMl(consumed);
  document.getElementById("water-goal-label").textContent = `Meta: ${formatMl(goal)}`;
  document.getElementById("water-progress-fill").style.width = `${percent}%`;
  document.getElementById("water-progress").setAttribute("aria-valuenow", String(percent));
  document.getElementById("daily-water-hint").textContent =
    `${formatMl(consumed)} de ${formatMl(goal)} · copo de ${formatMl(Number(state.glassSize))}`;
}

function renderDaily() {
  const select = document.getElementById("day-select");
  select.innerHTML = "";
  for (let i = 0; i < 30; i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `Dia ${i + 1}`;
    select.appendChild(option);
  }
  select.value = String(selectedDay);
  document.getElementById("day-date-label").textContent = formatDate(dateForDay(selectedDay));

  const day = getDay(selectedDay);
  document.querySelectorAll("[data-check]").forEach((input) => {
    const key = input.dataset.check;
    input.checked = key === "water" ? waterReached(day) : Boolean(day[key]);
    input.disabled = key === "water";
  });
}

function renderSummary() {
  const day = getDay(selectedDay);
  const items = [
    ["Café da manhã", day.breakfast],
    ["Almoço", day.lunch],
    ["Jantar", day.dinner],
    ["Meta de água", waterReached(day)],
    ["Treino", day.workout],
    ["Sem açúcar adicionado", day.sugar],
    ["Sem glúten", day.gluten],
    ["Objetivo para laticínios", day.dairy]
  ];
  document.getElementById("today-summary").innerHTML = items.map(([label, done]) =>
    `<div class="summary-item ${done ? "done" : ""}"><strong>${done ? "✓ " : "○ "}${label}</strong>${done ? "Concluído" : "Pendente"}</div>`
  ).join("");
}

function renderFoodSections() {
  const allowedRoot = document.getElementById("allowed-foods");
  allowedRoot.innerHTML = "";
  Object.entries(allowedFoods).forEach(([category, foods]) => {
    const card = document.createElement("article");
    card.className = "card food-card";
    const heading = document.createElement("h2");
    heading.textContent = category;
    const list = document.createElement("div");
    list.className = "food-list";

    foods.forEach((food) => {
      const id = `food-${category}-${food}`;
      const label = document.createElement("label");
      label.className = "food-check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(state.pantry[food]);
      input.setAttribute("aria-label", `${food}: já tenho em casa`);
      input.addEventListener("change", () => {
        state.pantry[food] = input.checked;
        saveState();
      });
      const text = document.createElement("span");
      text.textContent = food;
      label.htmlFor = id;
      input.id = id;
      label.append(input, text);
      list.appendChild(label);
    });

    card.append(heading, list);
    allowedRoot.appendChild(card);
  });

  const avoidRoot = document.getElementById("avoid-foods");
  avoidRoot.innerHTML = "";
  Object.entries(avoidFoods).forEach(([category, foods]) => {
    const card = document.createElement("article");
    card.className = "card food-card";
    const heading = document.createElement("h2");
    heading.textContent = category;
    const list = document.createElement("div");
    list.className = "food-list";
    foods.forEach((food) => {
      const item = document.createElement("div");
      item.className = "food-check";
      item.textContent = `• ${food}`;
      list.appendChild(item);
    });
    card.append(heading, list);
    avoidRoot.appendChild(card);
  });
}

function renderSettings() {
  document.getElementById("water-goal-input").value = state.waterGoal;
  document.getElementById("glass-size-input").value = state.glassSize;
  document.getElementById("start-date-input").value = state.startDate;
}

function renderAll() {
  renderStats();
  renderWater();
  renderDaily();
  renderSummary();
  renderDays();
  renderFoodSections();
  renderSettings();
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.id === pageId);
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.target === pageId);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.target));
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.go));
});

document.getElementById("day-select").addEventListener("change", (event) => {
  selectedDay = Number(event.target.value);
  renderAll();
});

document.querySelectorAll("[data-check]").forEach((input) => {
  input.addEventListener("change", () => {
    const day = getDay(selectedDay);
    const key = input.dataset.check;

    if (key === "water") {
      day.waterCups = input.checked
        ? Math.max(Number(day.waterCups) || 0, Math.ceil(Number(state.waterGoal) / Number(state.glassSize)))
        : 0;
    } else {
      day[key] = input.checked;
    }

    saveState();
    renderAll();
  });
});

document.getElementById("add-water").addEventListener("click", () => {
  const day = getDay(selectedDay);
  day.waterCups = (Number(day.waterCups) || 0) + 1;
  saveState();
  renderAll();
});

document.getElementById("remove-water").addEventListener("click", () => {
  const day = getDay(selectedDay);
  day.waterCups = Math.max(0, (Number(day.waterCups) || 0) - 1);
  saveState();
  renderAll();
});

function saveSettings() {
  const goal = Number(document.getElementById("water-goal-input").value);
  const glass = Number(document.getElementById("glass-size-input").value);
  const start = document.getElementById("start-date-input").value;
  const message = document.getElementById("settings-message");

  if (!Number.isFinite(goal) || goal < 1 || goal > 10000 ||
      !Number.isFinite(glass) || glass < 1 || glass > 2000 || !start) {
    message.textContent = "Confira os valores. A meta e o copo devem ser maiores que zero.";
    return;
  }

  state.waterGoal = goal;
  state.glassSize = glass;
  state.startDate = start;
  selectedDay = getCurrentDayIndex();
  saveState();
  renderAll();
  message.textContent = "Ajustes salvos automaticamente.";
  window.setTimeout(() => { message.textContent = ""; }, 3000);
}

["water-goal-input", "glass-size-input", "start-date-input"].forEach((id) => {
  document.getElementById(id).addEventListener("change", saveSettings);
});

let installPrompt = null;
const installButton = document.getElementById("install-button");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.classList.remove("hidden");
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installButton.classList.add("hidden");
});

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Não foi possível registrar o service worker.", error);
    });
  });
}

renderAll();
