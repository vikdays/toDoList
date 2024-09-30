let addMessage = document.querySelector('.newitem');
let addButton = document.querySelector('.add');
let description = document.querySelector('.description');
let toDoList = [];

const API_URL = 'http://localhost:8090/api/tasks';


document.addEventListener('DOMContentLoaded', function() {
    fetchTasks(); 
});

addButton.addEventListener('click', function() {
    let messageText = addMessage.value.trim();

    if (messageText === "") {
        alert("You cannot add an empty task!");
        return;
    }
   
    const newTask = {
        description: messageText,
        isDone: false
    };

    createTask(newTask);
    addMessage.value = ""; 
});

function createTask(task) {
    fetch(`${API_URL}/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify(task),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(() => {
        fetchTasks(); 
    })
    .catch(error => console.error('Ошибка при создании задачи:', error));
}

function fetchTasks() {
    fetch(API_URL, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        toDoList = data;
        displayMessages(); 
    })
    .catch(error => console.error('Ошибка при загрузке задач:', error));
}

function displayMessages() {
    if (toDoList.length === 0) {
        description.innerHTML = "";
        return;
    }

    let displayMessage = "";
    toDoList.forEach(function(item, i) {
        displayMessage += `
        <li>
            <input type='checkbox' id='item_${i}' ${item.isDone ? 'checked' : ''} data-id="${item.id}">
            <label for='item_${i}' class='task-label'>${item.description}</label>
            <button class="delete-btn" id="delete_${i}" data-id="${item.id}">
                <img src="images/delete.svg" alt="Delete" width="20" height="20">
            </button>
        </li>
        `;
    });
    
    description.innerHTML = displayMessage;

    document.querySelectorAll('.delete-btn').forEach((button) => {
        button.addEventListener('click', function() {
            let taskId = button.getAttribute('data-id');
            deleteTask(taskId);
        });
    });

    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener('change', function(event) {
            let taskId = event.target.getAttribute('data-id');
            toggleTaskStatus(taskId);
        });
    });

    document.querySelectorAll('.task-label').forEach((label, index) => {
        label.addEventListener('dblclick', function() {
            editTask(index);
        });
    });
}

function deleteTask(taskId) {
    fetch(`${API_URL}/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        fetchTasks(); 
    })
    .catch(error => console.error('Ошибка при удалении задачи:', error));
}

function toggleTaskStatus(taskId) {
    fetch(`${API_URL}/${taskId}/change-flag`, {
        method: 'PUT',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        fetchTasks();
    })
    .catch(error => console.error('Ошибка при изменении статуса задачи:', error));
}

function editTask(index) {
    let taskLabel = document.querySelector(`label[for='item_${index}']`);
    let currentText = taskLabel.innerHTML;
    taskLabel.innerHTML = `<input type='text' class='edit-input' value='${currentText}' />`;
    
    let editInput = taskLabel.querySelector('.edit-input');
    editInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            saveEdit(index, editInput.value);
        }
    });
    editInput.focus();
}

function saveEdit(index, newText) {
    if (newText.trim() === "") {
        alert("You cannot leave the task description empty!");
        return;
    }
    
    const updatedTask = {
        ...toDoList[index],
        description: newText
    };

    fetch(`${API_URL}/${updatedTask.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedTask),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        fetchTasks(); 
    })
    .catch(error => console.error('Ошибка при редактировании задачи:', error));
}

