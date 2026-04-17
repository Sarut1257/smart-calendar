const monthYear = document.getElementById("monthYear");
const calendar = document.getElementById("calendar");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const selectedDateText = document.getElementById("selectedDateText");
const taskInput = document.getElementById("taskInput");
const taskTimeInput = document.getElementById("taskTimeInput");
const categorySelect = document.getElementById("categorySelect");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const filterButtons = document.querySelectorAll(".filter-btn");
const searchInput = document.getElementById("searchInput");

const todayTasksCount = document.getElementById("todayTasksCount");
const completedTodayCount = document.getElementById("completedTodayCount");
const pendingTodayCount = document.getElementById("pendingTodayCount");
const monthTasksCount = document.getElementById("monthTasksCount");

const editModal = document.getElementById("editModal");
const editTaskInput = document.getElementById("editTaskInput");
const editTaskTimeInput = document.getElementById("editTaskTimeInput");
const editCategorySelect = document.getElementById("editCategorySelect");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");

const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const studyCount = document.getElementById("studyCount");
const projectCount = document.getElementById("projectCount");
const personalCount = document.getElementById("personalCount");
const importantCount = document.getElementById("importantCount");

const nextTaskContent = document.getElementById("nextTaskContent");

let currentDate = new Date();
let selectedDate = null;
let currentFilter = "all";
let searchQuery = "";
let tasks = loadTasks();

let editingDateKey = null;
let editingTaskIndex = null;

normalizeOldTasks();

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function saveTasks() {
  localStorage.setItem("smartCalendarTasks", JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem("smartCalendarTasks");
    return savedTasks ? JSON.parse(savedTasks) : {};
  } catch (error) {
    console.error("Failed to load tasks:", error);
    return {};
  }
}

function normalizeOldTasks() {
  let changed = false;

  for (const dateKey in tasks) {
    if (!Array.isArray(tasks[dateKey])) {
      tasks[dateKey] = [];
      changed = true;
      continue;
    }

    tasks[dateKey] = tasks[dateKey]
      .map((task) => {
        if (typeof task === "string") {
          changed = true;
          return {
            text: task,
            category: "Study",
            completed: false,
            time: ""
          };
        }

        if (typeof task === "object" && task !== null) {
          const normalizedTask = {
            text: task.text || "",
            category: task.category || "Study",
            completed: Boolean(task.completed),
            time: typeof task.time === "string" ? task.time : ""
          };

          if (task.completed === undefined || task.time === undefined) {
            changed = true;
          }

          return normalizedTask;
        }

        changed = true;
        return {
          text: "",
          category: "Study",
          completed: false,
          time: ""
        };
      })
      .filter((task) => task.text.trim() !== "");
  }

  if (changed) {
    saveTasks();
  }
}

function getCategoryClass(category) {
  switch (category) {
    case "Study":
      return "category-study";
    case "Project":
      return "category-project";
    case "Personal":
      return "category-personal";
    case "Important":
      return "category-important";
    default:
      return "category-study";
  }
}

function getFilteredTasks(dateTasks) {
  let result = dateTasks;

  if (currentFilter === "active") {
    result = result.filter((task) => !task.completed);
  } else if (currentFilter === "completed") {
    result = result.filter((task) => task.completed);
  }

  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    result = result.filter((task) => task.text.toLowerCase().includes(q));
  }

  return result;
}

function sortTasksByTime(taskArray) {
  taskArray.sort((a, b) => {
    const timeA = a.time || "99:99";
    const timeB = b.time || "99:99";

    if (timeA < timeB) return -1;
    if (timeA > timeB) return 1;
    return 0;
  });
}

function formatThaiTime(time) {
  if (!time) return "";

  const [hour, minute] = time.split(":");
  return `🕒 ${hour}:${minute} น.`;
}
function updateNextTaskBox() {
  if (!selectedDate) {
    nextTaskContent.textContent = "Please select a date";
    nextTaskContent.classList.add("next-task-empty");
    return;
  }

  const selectedKey = formatDateKey(selectedDate);
  const selectedTasks = tasks[selectedKey] || [];

  const sortedTasks = selectedTasks
    .filter((task) => !task.completed)
    .sort((a, b) => {
      const timeA = a.time || "99:99";
      const timeB = b.time || "99:99";
      return timeA.localeCompare(timeB);
    });

  if (sortedTasks.length === 0) {
    nextTaskContent.textContent = "No upcoming task for selected date";
    nextTaskContent.classList.add("next-task-empty");
    return;
  }

  nextTaskContent.classList.remove("next-task-empty");

  const nextTask = sortedTasks[0];
  const thaiTime = nextTask.time ? formatThaiTime(nextTask.time) : "No time";

  nextTaskContent.innerHTML = `
    <span class="next-task-time">${thaiTime}</span>
    ${nextTask.text}
  `;
}
  
  renderCalendar();
  updateSelectedDateText();
  renderTasks();
  updateDashboard();
  updateNextTaskBox();

function exportData() {
  const dataStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "smart-calendar-data.json";
  link.click();

  URL.revokeObjectURL(url);
}

function isValidImportedData(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  for (const dateKey in data) {
    if (!Array.isArray(data[dateKey])) {
      return false;
    }

    for (const task of data[dateKey]) {
      if (typeof task !== "object" || task === null) {
        return false;
      }

      if (typeof task.text !== "string") return false;
      if (typeof task.category !== "string") return false;
      if (typeof task.completed !== "boolean") return false;
      if (typeof task.time !== "string") return false;
    }
  }

  return true;
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      if (!isValidImportedData(importedData)) {
        alert("Invalid file format.");
        return;
      }

      tasks = importedData;
      saveTasks();
      normalizeOldTasks();
      renderCalendar();
      renderTasks();
      updateDashboard();

      alert("Import successful.");
    } catch (error) {
      alert("Failed to import file.");
      console.error(error);
    } finally {
      importInput.value = "";
    }
  };

  reader.readAsText(file);
}
exportBtn.addEventListener("click", exportData);
importInput.addEventListener("change", importData);
clearCompletedBtn.addEventListener("click", clearCompletedTasks);
deleteAllBtn.addEventListener("click", deleteAllTasksForSelectedDate);
function renderCalendar() {
  calendar.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  monthYear.textContent = `${monthNames[month]} ${year}`;

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("empty");
    calendar.appendChild(emptyCell);
  }

  for (let day = 1; day <= lastDate; day++) {
    const dayCell = document.createElement("div");
    dayCell.classList.add("calendar-day");

    const dayNumber = document.createElement("span");
    dayNumber.classList.add("day-number");
    dayNumber.textContent = day;

    const thisDate = new Date(year, month, day);
    const dateKey = formatDateKey(thisDate);
    const taskCount = tasks[dateKey] ? tasks[dateKey].length : 0;

    dayCell.appendChild(dayNumber);

    if (taskCount > 0) {
      const badge = document.createElement("span");
      badge.classList.add("task-badge");
      badge.textContent = `${taskCount} task${taskCount > 1 ? "s" : ""}`;
      dayCell.appendChild(badge);
    }

    if (
      selectedDate &&
      thisDate.getFullYear() === selectedDate.getFullYear() &&
      thisDate.getMonth() === selectedDate.getMonth() &&
      thisDate.getDate() === selectedDate.getDate()
    ) {
      dayCell.classList.add("selected");
    }

    dayCell.addEventListener("click", () => {
      selectedDate = thisDate;
      updateSelectedDateText();
      renderCalendar();
      renderTasks();
      updateDashboard();
      updateNextTaskBox();
    });

    calendar.appendChild(dayCell);
  }
}
function clearCompletedTasks() {
  if (!selectedDate) {
    alert("Please select a date first.");
    return;
  }

  const dateKey = formatDateKey(selectedDate);
  const dateTasks = tasks[dateKey] || [];

  const activeTasks = dateTasks.filter((task) => !task.completed);

  if (activeTasks.length === dateTasks.length) {
    alert("No completed tasks to clear.");
    return;
  }

  if (activeTasks.length === 0) {
    delete tasks[dateKey];
  } else {
    tasks[dateKey] = activeTasks;
    sortTasksByTime(tasks[dateKey]);
  }

  saveTasks();
  renderTasks();
  renderCalendar();
  updateDashboard();
  updateNextTaskBox();
}

function deleteAllTasksForSelectedDate() {
  if (!selectedDate) {
    alert("Please select a date first.");
    return;
  }

  const dateKey = formatDateKey(selectedDate);
  const dateTasks = tasks[dateKey] || [];

  if (dateTasks.length === 0) {
    alert("No tasks to delete.");
    return;
  }

  const confirmed = confirm("Delete all tasks for this date?");
  if (!confirmed) {
    return;
  }

  delete tasks[dateKey];

  saveTasks();
  renderTasks();
  renderCalendar();
  updateDashboard();
  updateNextTaskBox();
}
function updateSelectedDateText() {
  if (!selectedDate) {
    selectedDateText.textContent = "No date selected";
    return;
  }

  const day = selectedDate.getDate();
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  selectedDateText.textContent = `${day}/${month}/${year}`;
}

function updateDashboard() {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const todayTasks = tasks[todayKey] || [];

  const completedToday = todayTasks.filter((task) => task.completed).length;
  const pendingToday = todayTasks.filter((task) => !task.completed).length;

  todayTasksCount.textContent = todayTasks.length;
  completedTodayCount.textContent = completedToday;
  pendingTodayCount.textContent = pendingToday;

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  let totalMonthTasks = 0;

  for (const dateKey in tasks) {
    const [year, month] = dateKey.split("-").map(Number);

    if (year === currentYear && month === currentMonth + 1) {
      totalMonthTasks += tasks[dateKey].length;
    }
  }
  
  monthTasksCount.textContent = totalMonthTasks;
  let study = 0;
  let project = 0;
  let personal = 0;
  let important = 0;

  todayTasks.forEach((task) => {
    switch (task.category) {
      case "Study":
        study++;
        break;
      case "Project":
        project++;
        break;
      case "Personal":
        personal++;
        break;
      case "Important":
        important++;
        break;
  }
});

studyCount.textContent = study;
projectCount.textContent = project;
personalCount.textContent = personal;
importantCount.textContent = important;
}

function openEditModal(dateKey, index, task) {
  editingDateKey = dateKey;
  editingTaskIndex = index;

  editTaskInput.value = task.text;
  editTaskTimeInput.value = task.time || "";
  editCategorySelect.value = task.category;
  editModal.classList.remove("hidden");
  editTaskInput.focus();
}

function closeEditModal() {
  editingDateKey = null;
  editingTaskIndex = null;
  editTaskInput.value = "";
  editTaskTimeInput.value = "";
  editCategorySelect.value = "Study";
  editModal.classList.add("hidden");
}

function renderTasks() {
  taskList.innerHTML = "";

  if (!selectedDate) {
    emptyMessage.style.display = "block";
    emptyMessage.textContent = "Please select a date first.";
    return;
  }

  const dateKey = formatDateKey(selectedDate);
  const dateTasks = tasks[dateKey] || [];
  sortTasksByTime(dateTasks);
  tasks[dateKey] = dateTasks;
  saveTasks();

  const filteredTasks = getFilteredTasks(dateTasks);

  if (filteredTasks.length === 0) {
    emptyMessage.style.display = "block";

    if (dateTasks.length === 0) {
      emptyMessage.textContent = "No tasks for this date.";
    } else if (searchQuery.trim() !== "") {
      emptyMessage.textContent = "No tasks found for this search.";
    } else {
      emptyMessage.textContent = "No tasks match this filter.";
    }

    return;
  }

  emptyMessage.style.display = "none";

  filteredTasks.forEach((task) => {
    const originalIndex = dateTasks.indexOf(task);

    const li = document.createElement("li");
    li.classList.add("task-item");

    const left = document.createElement("div");
    left.classList.add("task-left");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("task-check");
    checkbox.checked = task.completed;

    checkbox.addEventListener("change", () => {
      dateTasks[originalIndex].completed = checkbox.checked;
      tasks[dateKey] = dateTasks;
      saveTasks();
      renderTasks();
      renderCalendar();
      updateDashboard();
      updateNextTaskBox();
    });

    const main = document.createElement("div");
    main.classList.add("task-main");

    const topRow = document.createElement("div");
    topRow.classList.add("task-top-row");

    if (task.time) {
      const timeTag = document.createElement("span");
      timeTag.classList.add("task-time");
      timeTag.textContent = formatThaiTime(task.time);
      topRow.appendChild(timeTag);
    }

    const span = document.createElement("span");
    span.classList.add("task-text");
    span.textContent = task.text;

    if (task.completed) {
      span.classList.add("completed");
    }

    topRow.appendChild(span);

    const categoryTag = document.createElement("span");
    categoryTag.classList.add("task-category", getCategoryClass(task.category));
    categoryTag.textContent = task.category;

    main.appendChild(topRow);
    main.appendChild(categoryTag);

    left.appendChild(checkbox);
    left.appendChild(main);

    const actions = document.createElement("div");
    actions.classList.add("task-actions");

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit-btn");
    editBtn.textContent = "Edit";

    editBtn.addEventListener("click", () => {
      openEditModal(dateKey, originalIndex, task);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", () => {
      dateTasks.splice(originalIndex, 1);

      if (dateTasks.length === 0) {
        delete tasks[dateKey];
      } else {
        tasks[dateKey] = dateTasks;
      }

      saveTasks();
      renderTasks();
      renderCalendar();
      updateDashboard();
      updateNextTaskBox();
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(left);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
}

function addTask() {
  if (!selectedDate) {
    alert("Please select a date first.");
    return;
  }

  const taskText = taskInput.value.trim();
  const taskTime = taskTimeInput.value;
  const category = categorySelect ? categorySelect.value : "Study";

  if (taskText === "") {
    alert("Please enter a task.");
    return;
  }

  const dateKey = formatDateKey(selectedDate);

  if (!tasks[dateKey]) {
    tasks[dateKey] = [];
  }

  tasks[dateKey].push({
    text: taskText,
    category: category,
    completed: false,
    time: taskTime
  });

  sortTasksByTime(tasks[dateKey]);
  saveTasks();

  taskInput.value = "";
  taskTimeInput.value = "";
  if (categorySelect) {
    categorySelect.value = "Study";
  }

  renderTasks();
  renderCalendar();
  updateDashboard();
  updateNextTaskBox();
}

function saveEditedTask() {
  if (editingDateKey === null || editingTaskIndex === null) {
    return;
  }

  const newText = editTaskInput.value.trim();
  const newTime = editTaskTimeInput.value;
  const newCategory = editCategorySelect.value;

  if (newText === "") {
    alert("Task text cannot be empty.");
    return;
  }

  const dateTasks = tasks[editingDateKey] || [];
  const oldTask = dateTasks[editingTaskIndex];

  if (!oldTask) {
    closeEditModal();
    return;
  }

  dateTasks[editingTaskIndex] = {
    ...oldTask,
    text: newText,
    time: newTime,
    category: newCategory
  };

  sortTasksByTime(dateTasks);
  tasks[editingDateKey] = dateTasks;
  saveTasks();
  closeEditModal();
  renderTasks();
  renderCalendar();
  updateDashboard();
  updateNextTaskBox();
}

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    addTask();
  }
});

searchInput.addEventListener("input", function () {
  searchQuery = searchInput.value;
  renderTasks();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    renderTasks();
  });
});

saveEditBtn.addEventListener("click", saveEditedTask);
cancelEditBtn.addEventListener("click", closeEditModal);

editTaskInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    saveEditedTask();
  }
});

editModal.addEventListener("click", function (event) {
  if (event.target === editModal) {
    closeEditModal();
  }
});

prevBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
  updateDashboard();
  updateNextTaskBox();
});

nextBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
  updateDashboard();
  updateNextTaskBox();
});

renderCalendar();
updateSelectedDateText();
renderTasks();
updateDashboard();
updateNextTaskBox();