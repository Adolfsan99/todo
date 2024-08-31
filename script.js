    // Variables globales
    let tasks = JSON.parse(localStorage.getItem('tasks')) || {};
    let notes = JSON.parse(localStorage.getItem('notes')) || {};
    let currentDate = new Date();

    // Elementos del DOM
    const weeklyProgressTitle = document.getElementById('weekly-progress-title');
    const weeklyProgress = document.getElementById('weekly-progress');
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskValue = document.getElementById('task-value');
    const taskDate = document.getElementById('task-date');
    const tasksList = document.getElementById('tasks-list');
    const notesTextarea = document.getElementById('notes');
    const currentTimeElement = document.getElementById('current-time');
    const themeToggle = document.getElementById('theme-toggle');
    const taskModal = document.getElementById('taskModal');
    const modalTasksList = document.getElementById('modalTasksList');
    const calendarModal = document.getElementById('calendarModal');
    const calendarView = document.getElementById('calendar-view');
    const currentMonthElement = document.getElementById('current-month');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const dataModal = document.getElementById('dataModal');
    const confirmClearModal = document.getElementById('confirmClearModal');
    const clearDataChallenge = document.getElementById('clearDataChallenge');
    const clearDataAnswer = document.getElementById('clearDataAnswer');
    const confirmClearBtn = document.getElementById('confirmClearBtn');

    // Botones de sección
    const tasksBtn = document.getElementById('tasksBtn');
    const utilitiesBtn = document.getElementById('utilitiesBtn');
    const dataBtn = document.getElementById('dataBtn');
    const userGuideBtn = document.getElementById('userGuideBtn');
    const calendarBtn = document.getElementById('calendarBtn');

    // Funciones de utilidad
    function formatDate(date) {
      return date.toISOString().split('T')[0];
    }

    function updateCurrentTime() {
      const now = new Date();
      currentTimeElement.textContent = now.toLocaleTimeString();
    }

    function showNotification(message) {
      if (Notification.permission === "granted") {
        new Notification(message);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(message);
          }
        });
      }
    }

    // Funciones principales
    function renderWeeklyProgress() {
      weeklyProgress.innerHTML = '';
      const today = new Date();
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
        const dateString = formatDate(date);
        const dayTasks = tasks[dateString] || [];
        const totalValue = dayTasks.reduce((sum, task) => sum + task.value, 0);
        const completedValue = dayTasks.reduce((sum, task) => {
          if (task.status === 'completed') {
            return sum + task.value;
          } else if (task.status === 'in-progress') {
            return sum + (task.value / 2);
          }
          return sum;
        }, 0);
        const progress = totalValue > 0 ? (completedValue / totalValue) * 100 : 0;

        const dayElement = document.createElement('div');
        dayElement.className = 'day-progress';
        if (date.toDateString() === today.toDateString()) {
          dayElement.classList.add('current-day');
        }
        dayElement.innerHTML = `
          <div class="progress-bar-container">
            <div class="progress-bar" style="height: ${progress}%;"></div>
          </div>
          <div class="day-label">${date.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
        `;
        weeklyProgress.appendChild(dayElement);
      }
    }

    function renderTasks() {
      const dateString = formatDate(currentDate);
      const dayTasks = tasks[dateString] || [];
      tasksList.innerHTML = '';
      dayTasks.forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
          <span class="task-title">${task.title}</span>
          <span class="task-value">${task.value}</span>
          <span class="task-date">${new Date(task.date).toLocaleDateString()}</span>
          <div class="task-actions">
            <span class="task-status task-${task.status}">${task.status}</span>
            <button class="action-btn edit-task" data-index="${index}">✏️</button>
            <button class="action-btn delete-task" data-index="${index}">🗑️</button>
          </div>
        `;
        tasksList.appendChild(taskElement);
      });
    }

    function addTask(title, value, date) {
      const dateString = formatDate(new Date(date));
      if (!tasks[dateString]) {
        tasks[dateString] = [];
      }
      tasks[dateString].push({ title, value: parseInt(value), status: 'pending', date });
      localStorage.setItem('tasks', JSON.stringify(tasks));
      renderTasks();
      renderWeeklyProgress();
      showNotification(`Nueva tarea creada: ${title}`);
    }

    function deleteTask(index) {
      const dateString = formatDate(currentDate);
      tasks[dateString].splice(index, 1);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      renderTasks();
      renderWeeklyProgress();
    }

    function editTask(index, newTitle, newValue, newDate) {
      const dateString = formatDate(currentDate);
      tasks[dateString][index].title = newTitle;
      tasks[dateString][index].value = parseInt(newValue);
      tasks[dateString][index].date = newDate;
      localStorage.setItem('tasks', JSON.stringify(tasks));
      renderTasks();
      renderWeeklyProgress();
    }

    function toggleTaskStatus(index) {
      const dateString = formatDate(currentDate);
      const task = tasks[dateString][index];
      const statusOrder = ['pending', 'in-progress', 'completed'];
      const currentStatusIndex = statusOrder.indexOf(task.status);
      task.status = statusOrder[(currentStatusIndex + 1) % 3];
      localStorage.setItem('tasks', JSON.stringify(tasks));
      renderTasks();
      renderWeeklyProgress();
    }

    function saveNotes() {
      const dateString = formatDate(currentDate);
      notes[dateString] = notesTextarea.value;
      localStorage.setItem('notes', JSON.stringify(notes));
    }

    function loadNotes() {
      const dateString = formatDate(currentDate);
      notesTextarea.value = notes[dateString] || '';
    }

    function renderCalendar() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();

      currentMonthElement.textContent = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });

      calendarGrid.innerHTML = '';

      for (let i = 0; i < 7; i++) {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = new Date(2023, 0, i + 1).toLocaleString('default', { weekday: 'short' });
        calendarGrid.appendChild(dayHeader);
      }

      for (let i = 0; i < firstDay.getDay(); i++) {
        calendarGrid.appendChild(document.createElement('div'));
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        if (i === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
          dayElement.classList.add('current-day');
        }

        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = i;
        dayElement.appendChild(dayHeader);

        const dateString = formatDate(new Date(year, month, i));
        const dayTasks = tasks[dateString] || [];

        const taskContainer = document.createElement('div');
        taskContainer.className = 'calendar-day-tasks';
        taskContainer.style.maxHeight = '60px';
        taskContainer.style.overflowY = 'auto';

        dayTasks.forEach(task => {
          const taskElement = document.createElement('div');
          taskElement.className = `calendar-task ${task.status}`;
          taskElement.textContent = task.title;
          taskContainer.appendChild(taskElement);
        });

        dayElement.appendChild(taskContainer);
        calendarGrid.appendChild(dayElement);
      }
    }

    // Event Listeners
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = taskInput.value.trim();
      const value = taskValue.value;
      const date = taskDate.value;
      if (title && value && date) {
        addTask(title, value, date);
        taskInput.value = '';
        taskValue.value = '';
        taskDate.value = '';
      }
    });

    tasksList.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-task')) {
        const index = e.target.getAttribute('data-index');
        deleteTask(index);
      } else if (e.target.classList.contains('edit-task')) {
        const index = e.target.getAttribute('data-index');
        const dateString = formatDate(currentDate);
        const task = tasks[dateString][index];
        const newTitle = prompt('Editar tarea:', task.title);
        const newValue = prompt('Nuevo valor:', task.value);
        const newDate = prompt('Nueva fecha (YYYY-MM-DD):', task.date);
        if (newTitle !== null && newValue !== null && newDate !== null) {
          editTask(index, newTitle, newValue, newDate);
        }
      } else if (e.target.classList.contains('task-status')) {
        const index = e.target.parentElement.querySelector('.edit-task').getAttribute('data-index');
        toggleTaskStatus(index);
      }
    });

    notesTextarea.addEventListener('input', saveNotes);

    themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    
    // Guardar el estado en localStorage
    if (document.body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
    });

    document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    
    // Si el tema guardado es 'dark', aplica la clase 'dark-theme'
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    });

    weeklyProgressTitle.addEventListener('click', () => {
      taskModal.style.display = 'block';
      renderModalTasks();
    });

    tasksBtn.addEventListener('click', () => {
      taskModal.style.display = 'block';
      renderModalTasks();
    });

    utilitiesBtn.addEventListener('click', () => {
      alert('Funcionalidad de utilidades aún no implementada');
    });

    dataBtn.addEventListener('click', () => {
      dataModal.style.display = 'block';
    });

    userGuideBtn.addEventListener('click', () => {
      alert('Guía de usuario aún no implementada');
    });

    calendarBtn.addEventListener('click', () => {
      calendarModal.style.display = 'block';
      renderCalendar();
    });

    document.querySelectorAll('.close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        closeBtn.closest('.modal').style.display = 'none';
      });
    });

    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
      }
    });

    prevMonthBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });

    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', importData);
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      const num3 = Math.floor(Math.random() * 10) + 1;
      const num4 = Math.floor(Math.random() * 10) + 1;
      const sum = num1 + num2 + num3 + num4;
      clearDataChallenge.textContent = `${num1} + ${num2} + ${num3} + ${num4} = ?`;
      confirmClearModal.style.display = 'block';
      clearDataAnswer.value = '';
      confirmClearBtn.onclick = () => {
        if (parseInt(clearDataAnswer.value) === sum) {
          clearData();
          confirmClearModal.style.display = 'none';
        } else {
          alert('Respuesta incorrecta. Inténtalo de nuevo.');
        }
      };
    });

    function renderModalTasks() {
      modalTasksList.innerHTML = '';
      Object.entries(tasks).forEach(([date, dayTasks]) => {
        const dateElement = document.createElement('h3');
        dateElement.textContent = new Date(date).toLocaleDateString();
        modalTasksList.appendChild(dateElement);

        dayTasks.forEach((task, index) => {
          const taskElement = document.createElement('div');
          taskElement.className = 'task-item';
          taskElement.innerHTML = `
            <span class="task-title">${task.title}</span>
            <span class="task-value">${task.value}</span>
            <span class="task-date">${new Date(task.date).toLocaleDateString()}</span>
            <div class="task-actions">
              <span class="task-status task-${task.status}">${task.status}</span>
              <button class="action-btn edit-task" data-date="${date}" data-index="${index}">✏️</button>
              <button class="action-btn delete-task" data-date="${date}" data-index="${index}">🗑️</button>
            </div>
          `;
          modalTasksList.appendChild(taskElement);
        });
      });

      // Add event listeners for edit and delete buttons
      modalTasksList.querySelectorAll('.edit-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const date = e.target.getAttribute('data-date');
          const index = e.target.getAttribute('data-index');
          const task = tasks[date][index];
          const newTitle = prompt('Editar tarea:', task.title);
          const newValue = prompt('Nuevo valor:', task.value);
          const newDate = prompt('Nueva fecha (YYYY-MM-DD):', task.date);
          if (newTitle !== null && newValue !== null && newDate !== null) {
            tasks[date][index] = { ...task, title: newTitle, value: parseInt(newValue), date: newDate };
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderModalTasks();
            renderTasks();
            renderWeeklyProgress();
          }
        });
      });

      modalTasksList.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const date = e.target.getAttribute('data-date');
          const index = e.target.getAttribute('data-index');
          if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            tasks[date].splice(index, 1);
            if (tasks[date].length === 0) {
              delete tasks[date];
            }
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderModalTasks();
            renderTasks();
            renderWeeklyProgress();
          }
        });
      });

      modalTasksList.querySelectorAll('.task-status').forEach(statusElement => {
        statusElement.addEventListener('click', (e) => {
          const date = e.target.parentElement.querySelector('.edit-task').getAttribute('data-date');
          const index = e.target.parentElement.querySelector('.edit-task').getAttribute('data-index');
          const task = tasks[date][index];
          const statusOrder = ['pending', 'in-progress', 'completed'];
          const currentStatusIndex = statusOrder.indexOf(task.status);
          task.status = statusOrder[(currentStatusIndex + 1) % 3];
          localStorage.setItem('tasks', JSON.stringify(tasks));
          renderModalTasks();
          renderTasks();
          renderWeeklyProgress();
        });
      });
    }

    function exportData() {
      const data = {
        tasks: tasks,
        notes: notes
      };
      const dataStr = JSON.stringify(data);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = 'todo_data.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }

    function importData() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = function (event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
          const contents = e.target.result;
          try {
            const data = JSON.parse(contents);
            tasks = data.tasks || {};
            notes = data.notes || {};
            localStorage.setItem('tasks', JSON.stringify(tasks));
            localStorage.setItem('notes', JSON.stringify(notes));
            renderTasks();
            renderWeeklyProgress();
            loadNotes();
            alert('Datos importados con éxito');
          } catch (error) {
            alert('Error al importar datos: ' + error.message);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }

    function clearData() {
      tasks = {};
      notes = {};
      localStorage.removeItem('tasks');
      localStorage.removeItem('notes');
      renderTasks();
      renderWeeklyProgress();
      loadNotes();
      alert('Datos limpiados con éxito');
    }

    // Inicialización
    renderWeeklyProgress();
    renderTasks();
    loadNotes();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    renderCalendar();

    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }