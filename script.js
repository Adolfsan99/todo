    let maxDailyValue = 6;
    let tasks = [];
    const daysOfWeek = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

    function updateTime() {
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      document.getElementById('current-time').textContent = timeString;
    }

    function initializeWeeklyProgress() {
      const weeklyProgressElement = document.getElementById('weeklyProgress');
      const today = new Date().getDay();

      for (let i = 0; i < 7; i++) {
        const dayBar = document.createElement('div');
        dayBar.className = 'day-bar';
        dayBar.setAttribute('data-day', daysOfWeek[i]);
        if (i === today) {
          dayBar.classList.add('active');
        }
        weeklyProgressElement.appendChild(dayBar);
      }
    }

    function updateDailyProgress() {
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.filter(task =>
        task.startDate <= today && task.endDate >= today
      );

      let totalValue = 0;
      todayTasks.forEach(task => {
        if (task.status === 'completed') totalValue += parseInt(task.value);
        else if (task.status === 'in-progress') totalValue += parseInt(task.value) / 2;
      });

      const progressPercentage = (totalValue / maxDailyValue) * 100;
      const activeBar = document.querySelector('.day-bar.active');
      if (activeBar) {
        activeBar.style.background = `linear-gradient(to top, #4CAF50 ${progressPercentage}%, ${document.body.classList.contains('dark-mode') ? '#555' : '#ddd'} ${progressPercentage}%)`;
      }

      updateRemainingValue();
    }

    function updateRemainingValue() {
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.filter(task =>
        task.startDate <= today && task.endDate >= today
      );

      let usedValue = todayTasks.reduce((sum, task) => sum + parseInt(task.value), 0);
      let remainingValue = maxDailyValue - usedValue;

      document.getElementById('remainingValue').textContent = remainingValue;
    }

    function addTask() {
      const name = document.getElementById('taskName').value;
      const value = document.getElementById('taskValue').value;
      const startDate = document.getElementById('taskStart').value;
      const endDate = document.getElementById('taskEnd').value;

      if (!name || !value || !startDate || !endDate) {
        alert('Por favor, complete todos los campos');
        return;
      }

      const tasksForSelectedDate = tasks.filter(task =>
        task.startDate <= startDate && task.endDate >= startDate
      );

      let currentDailyValue = tasksForSelectedDate.reduce((sum, task) => sum + parseInt(task.value), 0);

      if (currentDailyValue + parseInt(value) > maxDailyValue) {
        alert('No se puede agregar esta tarea. Excedería el valor máximo diario para la fecha seleccionada.');
        return;
      }

      const newTask = {
        id: Date.now(),
        name,
        value,
        startDate,
        endDate,
        status: 'pending'
      };

      tasks.push(newTask);
      renderTasks();
      updateDailyProgress();
      saveTasks();

      // Clear input fields
      document.getElementById('taskName').value = '';
      document.getElementById('taskValue').value = '';
      document.getElementById('taskStart').value = '';
      document.getElementById('taskEnd').value = '';
    }

    function renderTasks() {
      const tasksContainer = document.getElementById('tasksContainer');
      tasksContainer.innerHTML = '';

      const today = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.filter(task =>
        task.startDate <= today && task.endDate >= today
      );

      // Sort tasks by value (descending order)
      todayTasks.sort((a, b) => parseInt(b.value) - parseInt(a.value));

      todayTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        taskElement.innerHTML = `
          <div class="task-info">
            <h3>${task.name}</h3>
            <p>Valor: $${task.value} | Inicio: ${task.startDate} | Fin: ${task.endDate}</p>
          </div>
          <div class="task-buttons">
            <button class="status-button status-${task.status}" onclick="changeStatus(${task.id})">${getStatusText(task.status)}</button>
            <button onclick="editTask(${task.id})">✏️</button>
            <button onclick="deleteTask(${task.id})">🗑️</button>
          </div>
        `;
        tasksContainer.appendChild(taskElement);
      });
    }

    function getStatusText(status) {
      switch (status) {
        case 'pending': return 'Pendiente';
        case 'in-progress': return 'En proceso';
        case 'completed': return 'Completado';
        default: return 'Pendiente';
      }
    }

    function changeStatus(taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        switch (task.status) {
          case 'pending':
            task.status = 'in-progress';
            break;
          case 'in-progress':
            task.status = 'completed';
            break;
          case 'completed':
            task.status = 'pending';
            break;
        }
        renderTasks();
        updateDailyProgress();
        saveTasks();
      }
    }

    function editTask(taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskValue').value = task.value;
        document.getElementById('taskStart').value = task.startDate;
        document.getElementById('taskEnd').value = task.endDate;

        // Remove the old task
        deleteTask(taskId);

        // The user can now edit the fields and add the task again
      }
    }

    function deleteTask(taskId) {
      tasks = tasks.filter(t => t.id !== taskId);
      renderTasks();
      updateDailyProgress();
      saveTasks();
    }

    function showAllTasks() {
      const modal = document.getElementById('allTasksModal');
      const allTasksList = document.getElementById('allTasksList');
      allTasksList.innerHTML = '';

      // Group tasks by date
      const tasksByDate = tasks.reduce((acc, task) => {
        if (!acc[task.startDate]) {
          acc[task.startDate] = [];
        }
        acc[task.startDate].push(task);
        return acc;
      }, {});

      // Render tasks grouped by date
      for (let date in tasksByDate) {
        const dateHeader = document.createElement('h3');
        dateHeader.textContent = date;
        allTasksList.appendChild(dateHeader);

        tasksByDate[date].forEach(task => {
          const taskElement = document.createElement('div');
          taskElement.innerHTML = `
            <p>${task.name} - Valor: $${task.value}</p>
            <button class="status-button status-${task.status}" onclick="changeStatusInModal(${task.id})">${getStatusText(task.status)}</button>
            <button onclick="editTaskInModal(${task.id})">✏️</button>
            <button onclick="deleteTaskInModal(${task.id})">🗑️</button>
          `;
          allTasksList.appendChild(taskElement);
        });
      }

      modal.style.display = 'block';
    }

    function changeStatusInModal(taskId) {
      changeStatus(taskId);
      showAllTasks(); // Refresh the modal content
    }

    function editTaskInModal(taskId) {
      editTask(taskId);
      showAllTasks(); // Refresh the modal content
    }

    function deleteTaskInModal(taskId) {
      deleteTask(taskId);
      showAllTasks(); // Refresh the modal content
    }

    function saveNotes() {
      const notes = document.getElementById('notesArea').value;
      localStorage.setItem('todoAppNotes', notes);
    }

    function loadNotes() {
      const notes = localStorage.getItem('todoAppNotes');
      if (notes) {
        document.getElementById('notesArea').value = notes;
      }
    }

    function saveTasks() {
      localStorage.setItem('todoAppTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
      const savedTasks = localStorage.getItem('todoAppTasks');
      if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
        updateDailyProgress();
      }
    }

    function saveMaxDailyValue() {
      localStorage.setItem('todoAppMaxDailyValue', maxDailyValue);
    }

    function loadMaxDailyValue() {
      const savedMaxDailyValue = localStorage.getItem('todoAppMaxDailyValue');
      if (savedMaxDailyValue) {
        maxDailyValue = parseInt(savedMaxDailyValue);
      }
    }

    function toggleDarkMode() {
      document.body.classList.toggle('dark-mode');
      document.body.classList.toggle('light-mode');
      localStorage.setItem('todoAppDarkMode', document.body.classList.contains('dark-mode'));
      updateDailyProgress();
    }

    function loadDarkModePreference() {
      const darkModePreference = localStorage.getItem('todoAppDarkMode');
      if (darkModePreference === 'true') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
      }
    }

    function showDataPopout() {
      document.getElementById('dataPopout').style.display = 'block';
    }

    function exportData() {
      const data = {
        tasks: tasks,
        maxDailyValue: maxDailyValue,
        notes: document.getElementById('notesArea').value
      };
      const dataStr = JSON.stringify(data);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = 'todo_app_data.json';

      let linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }

    function importData() {
      let input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = e => {
        let file = e.target.files[0];
        let reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = readerEvent => {
          let content = readerEvent.target.result;
          let data = JSON.parse(content);
          tasks = data.tasks;
          maxDailyValue = data.maxDailyValue;
          document.getElementById('notesArea').value = data.notes;
          saveTasks();
          saveMaxDailyValue();
          saveNotes();
          renderTasks();
          updateDailyProgress();
          alert('Datos importados con éxito');
        }
      }
      input.click();
    }

    function showClearDataConfirmation() {
      const sum1 = Math.floor(Math.random() * 100);
      const sum2 = Math.floor(Math.random() * 100);
      document.getElementById('clearDataSum').textContent = `${sum1} + ${sum2} = ?`;
      document.getElementById('clearDataAnswer').value = '';
      document.getElementById('clearDataConfirmPopout').style.display = 'block';
    }

    function clearData() {
      const sum1 = parseInt(document.getElementById('clearDataSum').textContent.split('+')[0]);
      const sum2 = parseInt(document.getElementById('clearDataSum').textContent.split('+')[1]);
      const userAnswer = parseInt(document.getElementById('clearDataAnswer').value);

      if (userAnswer === sum1 + sum2) {
        localStorage.clear();
        tasks = [];
        maxDailyValue = 6;
        document.getElementById('notesArea').value = '';
        renderTasks();
        updateDailyProgress();
        document.getElementById('clearDataConfirmPopout').style.display = 'none';
        alert('Todos los datos han sido borrados');
      } else {
        alert('Respuesta incorrecta. Los datos no se han borrado.');
      }
    }

    // Event Listeners
    document.getElementById('maxValueBtn').addEventListener('click', () => {
      const newValue = prompt('Ingrese el valor máximo diario:', maxDailyValue);
      if (newValue && !isNaN(newValue)) {
        maxDailyValue = parseInt(newValue);
        updateDailyProgress();
        saveMaxDailyValue();
      }
    });

    document.getElementById('addTaskBtn').addEventListener('click', addTask);

    document.getElementById('showAllTasksBtn').addEventListener('click', showAllTasks);

    document.querySelector('.close').addEventListener('click', () => {
      document.getElementById('allTasksModal').style.display = 'none';
    });

    document.getElementById('notesArea').addEventListener('blur', saveNotes);

    document.getElementById('toggleModeBtn').addEventListener('click', toggleDarkMode);

    document.getElementById('dataBtn').addEventListener('click', showDataPopout);

    document.getElementById('exportDataBtn').addEventListener('click', exportData);

    document.getElementById('importDataBtn').addEventListener('click', importData);

    document.getElementById('clearDataBtn').addEventListener('click', showClearDataConfirmation);

    document.getElementById('closeDataPopoutBtn').addEventListener('click', () => {
      document.getElementById('dataPopout').style.display = 'none';
    });

    document.getElementById('confirmClearDataBtn').addEventListener('click', clearData);

    document.getElementById('cancelClearDataBtn').addEventListener('click', () => {
      document.getElementById('clearDataConfirmPopout').style.display = 'none';
    });

    // Initialize
    setInterval(updateTime, 1000);
    updateTime();
    initializeWeeklyProgress();
    loadNotes();
    loadTasks();
    loadMaxDailyValue();
    loadDarkModePreference();

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
      if (event.target == document.getElementById('allTasksModal')) {
        document.getElementById('allTasksModal').style.display = "none";
      }
      if (event.target == document.getElementById('dataPopout')) {
        document.getElementById('dataPopout').style.display = "none";
      }
      if (event.target == document.getElementById('clearDataConfirmPopout')) {
        document.getElementById('clearDataConfirmPopout').style.display = "none";
      }
    }