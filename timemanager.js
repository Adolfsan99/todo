class TaskManager {
  constructor() {
    try {
      const savedTasks = window.localStorage.getItem('timelist');
      this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    } catch (e) {
      console.warn('Error loading from localStorage:', e);
      this.tasks = [];
    }
    this.showCompleted = false;
    this.draggedTask = null;
    this.allExpanded = false;
    this.init();
    this.updateTotalPercentage();
  }

  init() {
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    document.getElementById('addTask').addEventListener('click', () => this.addTask());
    document.getElementById('toggleCompleted').addEventListener('click', () => this.toggleCompletedView());
    document.getElementById('exportData').addEventListener('click', () => this.exportData());
    document.getElementById('importData').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', e => {
      if (e.target.files.length > 0) {
        this.importData(e.target.files[0]);
      }
    });
    document.getElementById('toggleAllTasks').addEventListener('click', () => this.toggleAllTasks());

    const taskList = document.getElementById('taskList');
    taskList.addEventListener('dragstart', e => this.handleDragStart(e));
    taskList.addEventListener('dragend', e => this.handleDragEnd(e));
    taskList.addEventListener('dragover', e => this.handleDragOver(e));
    taskList.addEventListener('dragleave', e => this.handleDragLeave(e));
    taskList.addEventListener('drop', e => this.handleDrop(e));

    const topDropZone = document.getElementById('dropZoneTop');
    topDropZone.addEventListener('dragover', e => {
      e.preventDefault();
      topDropZone.classList.add('active');
    });
    topDropZone.addEventListener('dragleave', () => {
      topDropZone.classList.remove('active');
    });
    topDropZone.addEventListener('drop', e => {
      e.preventDefault();
      topDropZone.classList.remove('active');
      if (this.draggedTask) {
        this.moveTaskToTop(this.draggedTask);
      }
    });
  }

  addTask(parentId = null) {
    if (this.showCompleted) {
      if (confirm('¿Desea cambiar a la vista de tareas pendientes para crear una nueva tarea?')) {
        this.showCompleted = false;
        document.getElementById('viewTitle').textContent = 'Tareas Pendientes';
        document.getElementById('toggleCompleted').textContent = 'Ver Completadas';
      } else {
        return;
      }
    }

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 2);

    const newTask = {
      id: Date.now().toString(),
      title: 'Nueva tarea',
      completed: false,
      subtasks: [],
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      expanded: false
    };

    if (parentId) {
      this.addSubtask(parentId, newTask);
    } else {
      this.tasks.push(newTask);
    }
    this.saveAndRender();
  }

  addSubtask(parentId, newTask) {
    const parentTask = this.tasks.find(task => task.id === parentId);
    if (parentTask) {
      parentTask.subtasks.push(newTask);
    } else {
      const subtasks = this.getSubtasks();
      const parent = subtasks.find(task => task.id === parentId);
      if (parent) {
        parent.subtasks.push(newTask);
      }
    }
    this.saveAndRender();
  }

  getSubtasks() {
    const subtasks = [];
    this.tasks.forEach(task => {
      subtasks.push(...task.subtasks);
    });
    return subtasks;
  }

  toggleCompletedView() {
    this.showCompleted = !this.showCompleted;
    if (this.showCompleted) {
      document.getElementById('viewTitle').textContent = 'Tareas Completadas';
      document.getElementById('toggleCompleted').textContent = 'Ver Pendientes';
    } else {
      document.getElementById('viewTitle').textContent = 'Tareas Pendientes';
      document.getElementById('toggleCompleted').textContent = 'Ver Completadas';
    }
    this.render();
  }

  exportData() {
    const data = JSON.stringify(this.tasks);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        this.tasks = data;
        this.saveAndRender();
      } catch (e) {
        console.error('Error importing data:', e);
      }
    };
    reader.readAsText(file);
  }

  toggleAllTasks() {
    this.allExpanded = !this.allExpanded;
    this.tasks.forEach(task => {
      task.expanded = this.allExpanded;
      task.subtasks.forEach(subtask => {
        subtask.expanded = this.allExpanded;
      });
    });
    this.saveAndRender();
  }

  toggleComplete(taskId) {
    const toggleTaskComplete = tasks => {
      for (let task of tasks) {
        if (task.id === taskId) {
          task.completed = !task.completed;
          if (task.subtasks) {
            const toggleSubtasks = subtasks => {
              subtasks.forEach(subtask => {
                subtask.completed = task.completed;
                if (subtask.subtasks) {
                  toggleSubtasks(subtask.subtasks);
                }
              });
            };
            toggleSubtasks(task.subtasks);
          }
          return true;
        }
        if (task.subtasks && task.subtasks.length && toggleTaskComplete(task.subtasks)) {
          return true;
        }
      }
      return false;
    };
    toggleTaskComplete(this.tasks);
    this.saveAndRender();
  }

  updateTaskTitle(taskId, newTitle) {
    const updateTitle = tasks => {
      for (let task of tasks) {
        if (task.id === taskId) {
          task.title = newTitle;
          return true;
        }
        if (task.subtasks && updateTitle(task.subtasks)) {
          return true;
        }
      }
      return false;
    };
    updateTitle(this.tasks);
    this.saveAndRender();
  }

  deleteTask(taskId) {
    const deleteFromTasks = tasks => {
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === taskId) {
          tasks.splice(i, 1);
          return true;
        }
        if (tasks[i].subtasks && tasks[i].subtasks.length) {
          if (deleteFromTasks(tasks[i].subtasks)) {
            return true;
          }
        }
      }
      return false;
    };
    deleteFromTasks(this.tasks);
    this.saveAndRender();
  }

  moveTaskToTop(taskId) {
    const findAndRemoveTask = (tasks, id) => {
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
          return tasks.splice(i, 1)[0];
        }
        if (tasks[i].subtasks) {
          const found = findAndRemoveTask(tasks[i].subtasks, id);
          if (found) return found;
        }
      }
      return null;
    };
    const task = findAndRemoveTask(this.tasks, taskId);
    if (task) {
      this.tasks.unshift(task);
      this.saveAndRender();
    }
  }

  handleDragStart(e) {
    const taskItem = e.target.closest('.task-item');
    if (taskItem) {
      this.draggedTask = taskItem.dataset.taskId;
      taskItem.classList.add('dragging');
    }
  }

  handleDragEnd(e) {
    const taskItem = e.target.closest('.task-item');
    if (taskItem) {
      taskItem.classList.remove('dragging');
      this.draggedTask = null;
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    const taskItem = e.target.closest('.task-item');
    if (taskItem) {
      taskItem.classList.add('drag-over');
    }
  }

  handleDragLeave(e) {
    const taskItem = e.target.closest('.task-item');
    if (taskItem) {
      taskItem.classList.remove('drag-over');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const taskItem = e.target.closest('.task-item');
    if (taskItem) {
      taskItem.classList.remove('drag-over');
    }
    if (taskItem && this.draggedTask && this.draggedTask !== taskItem.dataset.taskId) {
      this.moveTask(this.draggedTask, taskItem.dataset.taskId);
    }
  }

  moveTask(fromId, toId) {
    const findAndRemoveTask = (tasks, id) => {
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
          return tasks.splice(i, 1)[0];
        }
        if (tasks[i].subtasks) {
          const found = findAndRemoveTask(tasks[i].subtasks, id);
          if (found) return found;
        }
      }
      return null;
    };

    const findInsertLocation = (tasks, id) => {
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
          return {
            tasks,
            index: i
          };
        }
        if (tasks[i].subtasks) {
          const found = findInsertLocation(tasks[i].subtasks, id);
          if (found) return found;
        }
      }
      return null;
    };

    const task = findAndRemoveTask(this.tasks, fromId);
    if (task) {
      const location = findInsertLocation(this.tasks, toId);
      if (location) {
        location.tasks.splice(location.index + 1, 0, task);
      } else {
        this.tasks.push(task);
      }
      this.saveAndRender();
    }
  }

  calculateCompletion(task) {
    if (task.subtasks && task.subtasks.length > 0) {
      let completedCount = 0;
      let totalCount = task.subtasks.length;
      task.subtasks.forEach(subtask => {
        const subtaskStats = this.calculateCompletion(subtask);
        if (subtaskStats.completed === subtaskStats.total) {
          completedCount++;
        }
      });
      const percentage = Math.round(completedCount / totalCount * 100);
      task.completed = percentage === 100;
      return {
        completed: completedCount,
        total: totalCount,
        percentage: percentage
      };
    }
    return {
      completed: task.completed ? 1 : 0,
      total: 1,
      percentage: task.completed ? 100 : 0
    };
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  render() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    const filterTasks = tasks => {
      return tasks.filter(task => {
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks = filterTasks(task.subtasks);
          return task.subtasks.length > 0 || this.showCompleted === task.completed;
        }
        return this.showCompleted === task.completed;
      });
    };

    const visibleTasks = filterTasks([...this.tasks]);
    visibleTasks.forEach(task => {
      taskList.innerHTML += this.renderTask(task);
    });
    
    this.updateTotalPercentage();
  }

  renderTask(task, level = 0) {
    if (!task) return '';

    const completionStats = this.calculateCompletion(task);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    return `
      <li class="task-item ${task.completed ? 'completed' : ''}" 
          data-task-id="${task.id}" 
          draggable="true">
        <div class="task-header">
          <span class="drag-handle">☰</span>
          ${!hasSubtasks ? `<input type="checkbox"
            ${task.completed ? 'checked' : ''}
            onchange="taskManager.toggleComplete('${task.id}')">` : ''}
          <h3 class="task-title" 
              contenteditable="true" 
              onclick="if(this.textContent.trim() === 'Nueva tarea') this.selectAllText()"
              onkeydown="if(event.key === 'Enter') {event.preventDefault(); this.blur();}"
              onblur="taskManager.updateTaskTitle('${task.id}', this.textContent)">
            ${task.title}
          </h3>
          <span class="task-date">
            ${this.formatDate(task.startDate)} - 
            <span class="date-text" onclick="taskManager.promptEndDate('${task.id}')">
              ${this.formatDate(task.endDate)}
            </span>
          </span>
          <span class="task-percentage">
            ${task.subtasks && task.subtasks.length > 0 ? completionStats.percentage : task.completed ? 100 : 0}% completado
          </span>
          ${hasSubtasks ? `
            <button class="toggle-btn" onclick="taskManager.toggleExpanded('${task.id}')">
              ${task.expanded ? '▼' : '▶'}
            </button>` : ''}
          <button class="add-subtask-btn" onclick="taskManager.addTask('${task.id}')">+</button>
          <button class="delete-btn" onclick="taskManager.deleteTask('${task.id}')">×</button>
        </div>
        ${hasSubtasks ? `
          <ul class="subtask-list ${task.expanded ? 'expanded' : ''}">
            ${task.subtasks.map(subtask => this.renderTask(subtask, level + 1)).join('')}
          </ul>` : ''}
      </li>
    `;
  }

  saveAndRender() {
    try {
      window.localStorage.setItem('timelist', JSON.stringify(this.tasks));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
    this.render();
  }

  updateTotalPercentage() {
    let totalCompleted = 0;
    let totalTasks = 0;

    const calculateTotals = tasks => {
      tasks.forEach(task => {
        if (task.subtasks && task.subtasks.length) {
          calculateTotals(task.subtasks);
        } else {
          totalTasks++;
          if (task.completed) totalCompleted++;
        }
      });
    };

    calculateTotals(this.tasks);
    const percentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    document.getElementById('totalPercentage').textContent = `${percentage}% completado en total`;
  }

  toggleExpanded(taskId) {
    const findAndToggle = tasks => {
      for (let task of tasks) {
        if (task.id === taskId) {
          task.expanded = !task.expanded;
          return true;
        }
        if (task.subtasks && task.subtasks.length && findAndToggle(task.subtasks)) {
          return true;
        }
      }
      return false;
    };
    findAndToggle(this.tasks);
    this.saveAndRender();
  }

  promptEndDate(taskId) {
    const newDate = prompt('Ingrese la nueva fecha de fin (YYYY-MM-DD):');
    if (newDate) {
      const updateDate = tasks => {
        for (let task of tasks) {
          if (task.id === taskId) {
            task.endDate = newDate;
            return true;
          }
          if (task.subtasks && updateDate(task.subtasks)) {
            return true;
          }
        }
        return false;
      };
      updateDate(this.tasks);
      this.saveAndRender();
    }
  }
}

HTMLElement.prototype.selectAllText = function() {
  const range = document.createRange();
  range.selectNodeContents(this);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};