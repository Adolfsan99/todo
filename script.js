let maxDailyValue = 0;
    let tasks = [];
    let selectedDate = new Date().toISOString().split('T')[0];
    const daysOfWeek = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    let darkMode = false;

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
    
    // Crear y agregar la etiqueta con la inicial del día
    const dayLabel = document.createElement('div');
    dayLabel.className = 'day-label';
    dayLabel.textContent = daysOfWeek[i];
    dayBar.appendChild(dayLabel);
    
    const dayBarFill = document.createElement('div');
    dayBarFill.className = 'day-bar-fill';
    dayBar.appendChild(dayBarFill);
    
    dayBar.addEventListener('click', () => selectDay(i));
    weeklyProgressElement.appendChild(dayBar);
  }
  updateAllDailyProgress();
}


    function selectDay(dayIndex) {
      const selectedDate = new Date();
      selectedDate.setDate(selectedDate.getDate() - selectedDate.getDay() + dayIndex);
      this.selectedDate = selectedDate.toISOString().split('T')[0];

      document.querySelectorAll('.day-bar').forEach((bar, index) => {
        bar.classList.toggle('active', index === dayIndex);
      });

      renderTasks();
      updateAllDailyProgress();
      updateRemainingValue();
    }

    function updateAllDailyProgress() {
      const weeklyProgressElement = document.getElementById('weeklyProgress');
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - date.getDay() + i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayTasks = tasks.filter(task => 
          task.startDate <= dateString && task.endDate >= dateString
        );
        
        let totalValue = 0;
        dayTasks.forEach(task => {
          if (task.status === 'completed') totalValue += parseInt(task.value);
          else if (task.status === 'in-progress') totalValue += parseInt(task.value) / 2;
        });

        const progressPercentage = (totalValue / maxDailyValue) * 100;
        const dayBar = weeklyProgressElement.children[i];
        const dayBarFill = dayBar.querySelector('.day-bar-fill');
        dayBarFill.style.height = `${progressPercentage}%`;
      }
    }

    function updateRemainingValue() {
      const todayTasks = getAvailableTasks();
      let usedValue = todayTasks.reduce((sum, task) => sum + parseInt(task.value), 0);
      let remainingValue = Math.max(0, maxDailyValue - usedValue);
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

      const newTask = {
        id: Date.now(),
        name,
        value: parseInt(value),
        startDate,
        endDate,
        status: 'pending'
      };

      const dayTasks = tasks.filter(task => 
        task.startDate <= selectedDate && task.endDate >= selectedDate
      );

      const totalValue = dayTasks.reduce((sum, task) => sum + task.value, 0) + newTask.value;

      if (totalValue > maxDailyValue) {
        alert('No se puede agregar la tarea. Excede el valor máximo diario.');
        return;
      }

      tasks.push(newTask);
      saveTasks();
      renderTasks();
      updateAllDailyProgress();
      updateRemainingValue();

      // Clear input fields
      document.getElementById('taskName').value = '';
      document.getElementById('taskValue').value = '';
      document.getElementById('taskStart').value = '';
      document.getElementById('taskEnd').value = '';
    }

    function getAvailableTasks() {
      const today = new Date().toISOString().split('T')[0];
      return tasks.filter(task => 
        task.startDate <= selectedDate && task.endDate >= selectedDate && task.endDate >= today && task.status !== 'completed'
      );
    }

    function renderTasks() {
      const tasksContainer = document.getElementById('tasksContainer');
      tasksContainer.innerHTML = '';

      const availableTasks = getAvailableTasks().sort((a, b) => b.value - a.value);

      availableTasks.forEach(task => {
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
      switch(status) {
        case 'pending': return 'Pendiente';
        case 'in-progress': return 'En proceso';
        case 'completed': return 'Completado';
        default: return 'Pendiente';
      }
    }

    function changeStatus(taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        switch(task.status) {
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
        saveTasks();
        renderTasks();
        updateAllDailyProgress();
        updateRemainingValue();
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
      saveTasks();
      renderTasks();
      updateAllDailyProgress();
      updateRemainingValue();
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
          taskElement.className = 'task';
          taskElement.innerHTML = `
            <div class="task-info">
              <h3>${task.name}</h3>
              <p>Valor: $${task.value} | Inicio: ${task.startDate} | Fin: ${task.endDate}</p>
            </div>
            <div class="task-buttons">
              <button class="status-button status-${task.status}" onclick="changeStatus(${task.id}); showAllTasks();">${getStatusText(task.status)}</button>
              <button onclick="editTask(${task.id}); document.getElementById('allTasksModal').style.display='none';">✏️</button>
              <button onclick="deleteTask(${task.id}); showAllTasks();">🗑️</button>
            </div>
          `;
          allTasksList.appendChild(taskElement);
        });
      }

      modal.style.display = 'block';
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
        updateAllDailyProgress();
        updateRemainingValue();
      }
    }

    function saveMaxDailyValue() {
      localStorage.setItem('todoAppMaxDailyValue', maxDailyValue);
    }

    function loadMaxDailyValue() {
      const savedValue = localStorage.getItem('todoAppMaxDailyValue');
      if (savedValue) {
        maxDailyValue = parseInt(savedValue);
        updateAllDailyProgress();
        updateRemainingValue();
      }
    }

    function saveDarkModePreference() {
      localStorage.setItem('todoAppDarkMode', darkMode);
    }

    function loadDarkModePreference() {
      const savedPreference = localStorage.getItem('todoAppDarkMode');
      if (savedPreference !== null) {
        darkMode = savedPreference === 'true';
        document.body.classList.toggle('dark-mode', darkMode);
        document.getElementById('themeToggleBtn').textContent = darkMode ? '🌞' : '🌓';
      }
    }

    function exportData() {
      const data = {
        tasks: tasks,
        maxDailyValue: maxDailyValue,
        notes: document.getElementById('notesArea').value
      };
      const dataStr = JSON.stringify(data);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'todo_app_data.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }

    function importData() {
      const fileInput = document.getElementById('importFile');
      fileInput.click();

      fileInput.onchange = function() {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
          try {
            const data = JSON.parse(e.target.result);
            tasks = data.tasks;
            maxDailyValue = data.maxDailyValue;
            document.getElementById('notesArea').value = data.notes;
            saveTasks();
            saveMaxDailyValue();
            saveNotes();
            renderTasks();
            updateAllDailyProgress();
            updateRemainingValue();
            alert('Datos importados correctamente');
          } catch (error) {
            alert('Error al importar los datos');
          }
        };

        reader.readAsText(file);
      };
    }

    function clearData() {
      const num1 = Math.floor(Math.random() * 100);
      const num2 = Math.floor(Math.random() * 100);
      const sum = num1 + num2;

      const userSum = prompt(`Para confirmar la limpieza de datos, resuelva: ${num1} + ${num2} = ?`);

      if (parseInt(userSum) === sum) {
        tasks = [];
        maxDailyValue = 6;
        document.getElementById('notesArea').value = '';
        localStorage.removeItem('todoAppTasks');
        localStorage.removeItem('todoAppMaxDailyValue');
        localStorage.removeItem('todoAppNotes');
        renderTasks();
        updateAllDailyProgress();
        updateRemainingValue();
        alert('Datos limpiados correctamente');
      } else {
        alert('Suma incorrecta. Operación cancelada.');
      }
    }

    function toggleDarkMode() {
      darkMode = !darkMode;
      document.body.classList.toggle('dark-mode', darkMode);
      document.getElementById('themeToggleBtn').textContent = darkMode ? '🌞' : '🌓';
      saveDarkModePreference();
    }

    // Event Listeners
    document.getElementById('maxValueBtn').addEventListener('click', () => {
      const newValue = prompt('Ingrese el valor máximo diario:', maxDailyValue);
      if (newValue && !isNaN(newValue)) {
        maxDailyValue = parseInt(newValue);
        saveMaxDailyValue();
        updateAllDailyProgress();
        updateRemainingValue();
      }
    });

    document.getElementById('addTaskBtn').addEventListener('click', addTask);

    document.getElementById('showAllTasksBtn').addEventListener('click', showAllTasks);

    document.getElementById('dataBtn').addEventListener('click', () => {
      document.getElementById('dataModal').style.display = 'block';
    });

    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', importData);
    document.getElementById('clearDataBtn').addEventListener('click', clearData);

    document.querySelectorAll('.close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        closeBtn.closest('.modal').style.display = 'none';
      });
    });

    document.getElementById('notesArea').addEventListener('input', saveNotes);

    document.getElementById('themeToggleBtn').addEventListener('click', toggleDarkMode);

    // Initialize
    setInterval(updateTime, 1000);
    updateTime();
    initializeWeeklyProgress();
    loadNotes();
    loadTasks();
    loadMaxDailyValue();
    loadDarkModePreference();
    updateRemainingValue();
    renderTasks();

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
      if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
      }
    }