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
    
    const newCase = {
        description: addMessage.value,
        isDone: false
    };

    toDoList.push(newCase);
    displayMessages();
    addMessage.value = "";
});

function createTask(task) {
    fetch(`${API_URL}/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
    })
    .then(response => response.json())
    .then(() => {
        fetchTasks(); 
    })
    .catch(error => console.error('Error', error));
}
function fetchTasks() {
    fetch(API_URL)
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
    toDoList.forEach(function(item, i) {
        displayMessage += `
        <li>
            <input type='checkbox' id='item_${i}' ${item.isDone ? 'checked' : ''}>
            <label for='item_${i}' class='task-label'>${item.description}</label>
            <button class="delete-btn" id="delete_${i}">
                <img src="C:/Users/Виктория/Desktop/toDoList/images/delete.svg" alt="Delete" width="20" height="20">
            </button>
        </li>
        `;
    });
    
    description.innerHTML = displayMessage;

    document.querySelectorAll('.delete-btn').forEach((button, index) => {
        button.addEventListener('click', function() {
            deleteTask(index); 
        });
    });

    document.querySelectorAll('.task-label').forEach((label, index) => {
        label.addEventListener('dblclick', function() {
            editTask(index);
        });
    });
}

function deleteTask(index) {
    toDoList.splice(index, 1);
    displayMessages();
}

description.addEventListener('change', function(event) {
    let idInput = event.target.getAttribute('id');
    let forLabel = description.querySelector('[for=' + idInput + ']');
    let valueLabel = forLabel.innerHTML;

    toDoList.forEach(function(item) {
        if (item.description === valueLabel) {
            item.isDone = !item.isDone;
        }
    });
});

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
    
    toDoList[index].description = newText;
    displayMessages();
}

document.querySelector('.save').addEventListener('click', function() {
    saveToFile();
});

function saveToFile() {
    if (toDoList.length === 0) {
        alert("Can't save an empty to-do list!");
        return;
    }

    const jsonData = JSON.stringify(toDoList, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "toDoList.json";

    link.click();

    URL.revokeObjectURL(link.href);
}

document.querySelector('.load').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function(event) {
    loadFromFile(event);
});

function loadFromFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        try {
            toDoList = JSON.parse(content);
            displayMessages();
        } catch (error) {
            alert('Invalid JSON file!');
        }
    };
    
    if (file) {
        reader.readAsText(file);
    }
}

