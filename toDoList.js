let addMessage = document.querySelector('.newitem');
let addButton = document.querySelector('.add');
let description = document.querySelector('.description');
let toDoList = [];

const API_URL = 'http://localhost:8090/api/tasks';

document.addEventListener('DOMContentLoaded', function () {
    fetchTasks(); 
});

addButton.addEventListener('click', function () {
    let messageText = addMessage.value.trim();

    if (messageText === "") {
        alert("You cannot add an empty task!");
        return;
    }

    const newCase = {
        description: addMessage.value,
        isDone: false
    };

    createTask(newCase);
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
        .then(response => response.text()) 
        .then(() => {
            fetchTasks(); 
        })
        .catch(error => console.error('Ошибка при создании задачи:', error));
}

function fetchTasks() {
    fetch(API_URL)
        .then(response => response.json())
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
    toDoList.forEach(function (item, i) {
        displayMessage += `
        <li>
            <input type='checkbox' id='item_${i}' ${item.isDone ? 'checked' : ''} onchange="changeFlag(${i})">
            <label for='item_${i}' class='task-label'>${item.description}</label>
            <button class="delete-btn" id="delete_${i}">
                <img src="images/delete.svg" alt="Delete" width="20" height="20">
            </button>
        </li>
        `;
    });

    description.innerHTML = displayMessage;

    document.querySelectorAll('.delete-btn').forEach((button, index) => {
        button.addEventListener('click', function () {
            deleteTask(index);
        });
    });
    document.querySelectorAll('.task-label').forEach((label, index) => {
        label.addEventListener('dblclick', function () {
            editTask(index);
        });
    });
}

function changeFlag(index) {
    const task = toDoList[index];
    fetch(`${API_URL}/${task.id}/change-flag`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    })
        .then(response => response.json())
        .then(updatedTask => {
            toDoList[index] = updatedTask;
            displayMessages(); 
        })
        .catch(error => console.error('Ошибка при изменении флага задачи:', error));
}

function deleteTask(index) {
    const task = toDoList[index];
    fetch(`${API_URL}/${task.id}`, {
        method: 'DELETE',
        credentials: 'include',
    })
        .then(() => {
            toDoList.splice(index, 1);
            displayMessages();
        })
        .catch(error => console.error('Ошибка при удалении задачи:', error));
}

function editTask(index) {
    let taskLabel = document.querySelector(`label[for='item_${index}']`);
    let currentText = taskLabel.innerHTML;
    taskLabel.innerHTML = `<input type='text' class='edit-input' value='${currentText}' />`;

    let editInput = taskLabel.querySelector('.edit-input');
    editInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            saveEdit(index, editInput.value);
        }
    });
    editInput.focus();

    editInput.addEventListener('click', function (event) {
        event.stopPropagation();
    });
}

function saveEdit(index, newText) {
    if (newText.trim() === "") {
        alert("You cannot leave the task description empty!");
        return;
    }

    const task = toDoList[index];
    fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ...task, description: newText }),
    })
        .then(response => response.json())
        .then(updatedTask => {
            toDoList[index] = updatedTask;
            displayMessages();
        })
        .catch(error => console.error('Error', error));
}
