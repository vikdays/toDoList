let addMessage = document.querySelector('.newitem');
let addDesc = document.querySelector('.descitem');
let addDeadline = document.querySelector('.deadlineitem');
let addPriority = document.querySelector('.priorityitem');
let addButton = document.querySelector('.add');
let description = document.querySelector('.description');
let toDoList = [];
let currentEditingTask = null;

const API_URL = 'http://localhost:8090/api/tasks';

const modal = document.getElementById("taskModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalStatus = document.getElementById("modalStatus");
const modalPriority = document.getElementById("modalPriority");
const modalDeadline = document.getElementById("modalDeadline");
const modalCreatedAt = document.getElementById("modalCreatedAt");
const modalUpdatedAt = document.getElementById("modalUpdatedAt");
const editButton = document.getElementById("editButton");
const closeModal = document.getElementsByClassName("close")[0];

document.addEventListener('DOMContentLoaded', function () {
    fetchTasks();
    document.getElementById('statusFilter').addEventListener('change', fetchTasks);
    document.getElementById('priorityFilter').addEventListener('change', fetchTasks);
    document.getElementById('sortBy').addEventListener('change', fetchTasks);
    
    closeModal.onclick = function() {
        modal.style.display = "none";
        exitEditMode()
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            exitEditMode()
        }
    }
    editButton.addEventListener('click', enterEditMode);

    document.getElementById('cancelEdit').addEventListener('click', function() {
        exitEditMode();
    });
    
    document.getElementById('confirmSave').addEventListener('click', saveTaskChanges);
});

addButton.addEventListener('click', function () {
    let messageText = addMessage.value.trim();

    if (messageText === "") {
        alert("You cannot add an empty task!");
        return;
    }

    const newCase = {
        title: messageText,
        description: addDesc.value,
        deadline: addDeadline.value || null,
        priority: addPriority.value || null,
        isDone: false
    };

    createTask(newCase);
    addMessage.value = "";
    addDesc.value = "";
    addDeadline.value = "";
    addPriority.value = "";
});

function createTask(task) {
    fetch(`${API_URL}/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Ошибка при создании задачи');
            });
        }
        return response.json();
    })
    .then(() => {
        fetchTasks();
    })
    .catch(error => {
        alert(error.message);
        console.error('Error', error);
    });
}

function fetchTasks() {
    const status = document.getElementById('statusFilter').value;
    const priority = document.getElementById('priorityFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    let url = `${API_URL}?sortBy=${sortBy}`;
    if (status) url += `&status=${status}`;
    if (priority) url += `&priority=${priority}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            toDoList = data;
            displayMessages();
        })
        .catch(error => console.error('Error', error));
}

function displayMessages() {
    if (toDoList.length === 0) {
        description.innerHTML = "";
        return;
    }

    let displayMessage = "";
    toDoList.forEach(function (item, i) {
        displayMessage += `
        <li class="task">
            <div class="task-content" onclick="openTaskModal(${i})">
                <div class="task-checkbox">
                    <input type='checkbox' id='item_${i}' ${item.isDone ? 'checked' : ''} 
                           onchange="changeFlag(${i})" onclick="event.stopPropagation()">
                    <label for='item_${i}' class='task-label' onclick="handleLabelClick(event, ${i})">${item.title}</label>
                </div>
                <div class="task-meta">
                    <div><strong>Status:</strong> ${item.status || '—'}</div>
                    <div><strong>Priority:</strong> ${item.priority || '—'}</div>
                </div>
            </div>
            <div class="right">
                <div><strong>Deadline:</strong> ${item.deadline || '—'}</div>
                <button class="delete-btn" id="delete_${i}" onclick="deleteTask(${i}); event.stopPropagation()">
                    <img src="images/delete.svg" alt="Delete" width="25" height="25">
                </button>
            </div>
        </li>`;
    });

    description.innerHTML = displayMessage;
}

function openTaskModal(index) {
    currentEditingTask = toDoList[index];
    
    modalTitle.textContent = currentEditingTask.title;
    modalDescription.textContent = currentEditingTask.description || '—';
    modalStatus.textContent = currentEditingTask.status || '—';
    modalPriority.textContent = currentEditingTask.priority || '—';
    modalDeadline.textContent = currentEditingTask.deadline || '—';
    modalCreatedAt.textContent = currentEditingTask.createdAt || '—';
    modalUpdatedAt.textContent = currentEditingTask.updatedAt || '—';
    exitEditMode();
    
    modal.style.display = "block";
}

function changeFlag(index) {
    const task = toDoList[index];
    fetch(`${API_URL}/${task.id}/toggle`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(updatedTask => {
        toDoList[index] = updatedTask;
        displayMessages();
    })
    .catch(error => console.error('Error', error));
}

function deleteTask(index) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    const task = toDoList[index];
    fetch(`${API_URL}/${task.id}`, {
        method: 'DELETE',
    })
    .then(() => {
        toDoList.splice(index, 1);
        displayMessages();
    })
    .catch(error => console.error('Error', error));
}

function enterEditMode() {
    if (!currentEditingTask) {
        console.error('No task selected for editing');
        return;
    }
    document.getElementById('editTitle').value = currentEditingTask.title;
    document.getElementById('editDescription').value = currentEditingTask.description || '';

    const deadlineDate = currentEditingTask.deadline ? 
        formatDateForInput(currentEditingTask.deadline) : '';
    document.getElementById('editDeadline').value = deadlineDate;
    
    document.getElementById('editPriority').value = currentEditingTask.priority || '';

    document.getElementById('viewMode').style.display = 'none';
    document.getElementById('editMode').style.display = 'block';
    
    document.getElementById('editButton').style.display = 'none';
}

function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

function exitEditMode() {

    document.getElementById('viewMode').style.display = 'block';
    document.getElementById('editMode').style.display = 'none';
    
    document.getElementById('editButton').style.display = 'inline-block';
}

function saveTaskChanges() {
    const updatedTask = {
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value || null,
        deadline: document.getElementById('editDeadline').value || null,
        priority: document.getElementById('editPriority').value || null
    };

    if (!updatedTask.title.trim()) {
        alert("Title cannot be empty!");
        return;
    }

    fetch(`${API_URL}/${currentEditingTask.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Ошибка при обновлении задачи');
            });
        }
        return response.json();
    })
    .then(updatedTask => {
        currentEditingTask = updatedTask;
        
        fetchTasks();
        
        exitEditMode();
        
        modalTitle.textContent = currentEditingTask.title;
        modalDescription.textContent = currentEditingTask.description || '—';
        modalPriority.textContent = currentEditingTask.priority || '—';
        modalDeadline.textContent = currentEditingTask.deadline || '—';
    })
    .catch(error => {
        alert(error.message);
        console.error('Error', error);
    });
}
