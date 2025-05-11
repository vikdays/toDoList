const { test, expect } = require('@playwright/test');
const TodoPage = require('./pages/ToDoPage');

test.describe('To-Do List', () => {
  let page;
  let todoPage;
  let browser;

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser;
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    todoPage = new TodoPage(page);
    
    await page.route('**/*', route => route.continue());
    await page.evaluate(() => {
      window.confirm = () => true;
    });
    
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForSelector('.newitem');

    const taskItems = await todoPage.taskItems();
    const count = await taskItems.count();
    
    for (let i = 0; i < count; i++) {
      await todoPage.deleteLastTask();
    }
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Добавление задачи', async () => {
    const title = 'Задача на день';
    const description = 'Описание задачи';
    const deadline = '2025-05-01';
    const priority = 'High';

    await todoPage.createTask(title, description, deadline, priority);

    const taskItems = await todoPage.taskItems();
    const taskCount = await taskItems.count();
    expect(taskCount).toBeGreaterThan(0);

    const taskTitle = await taskItems.nth(taskCount - 1).locator('.task-label').textContent();
    expect(taskTitle).toBe(title);
  });

test('Отметка задачи как выполненной', async () => {
  await todoPage.createTask('Задача для выполнения', 'Описание задачи', '2025-05-01', 'High');
  await todoPage.toggleFirstTask();
  
  const checkboxState = await todoPage.firstTaskCheckbox().isChecked();
  expect(checkboxState).toBe(true);
});

test('Удаление задачи с подтверждением', async () => {
  await todoPage.createTask('удаление', '', '', '');
  await page.evaluate(() => {
    window.confirm = () => true; 
  });
  await todoPage.deleteLastTask(true);
});
test('Отмена удаления', async () => {
  await todoPage.createTask('отмена удаления', '', '', '');
  await page.evaluate(() => {
    window.confirm = () => false; 
  });
  await todoPage.deleteLastTask(false);
});

test('Попытка создания задачи с пустым названием', async () => {
  const initialCount = await (await todoPage.taskItems()).count();

  await todoPage.createTask('', '', '', '');

  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('You cannot add an empty task');
    await dialog.dismiss(); 
  });

  const newCount = await (await todoPage.taskItems()).count();
  expect(newCount).toBe(initialCount); 
});

  test('Проверка приоритета и дедлайна', async () => {

    await todoPage.createTask('Важная задача', 'desk', '2025-04-30', 'Critical');

    const taskItems = await todoPage.taskItems();
    const task = taskItems.nth(await taskItems.count() - 1);
    const taskDeadline = await task.locator('.right div').nth(0).textContent();
    const taskPriority = await task.locator('.task-meta div').nth(1).textContent();

    expect(taskDeadline).toContain('30.04.2025');
    expect(taskPriority).toContain('Critical');
  });

  test('Редактирование задачи', async () => {
    const testId = Date.now();
    const originalTitle = `Исходная задача ${testId}`;
    const newTitle = `Обновленная задача ${testId}`;
    
    await todoPage.createTask(originalTitle, testId.toString(), '', '');
  
    const taskItems = await todoPage.taskItems();
    const lastTaskIndex = (await taskItems.count()) - 1;
    const task = taskItems.nth(lastTaskIndex);
    
    await task.locator('.task-label').click();
    await page.locator('#editButton').click();
    await page.locator('#editTitle').fill(newTitle);
    await page.locator('#confirmSave').click();
  
    const updatedTask = await todoPage.getTaskByExactTitle(newTitle);
    await expect(updatedTask.locator('.task-label')).toBeVisible();
  });
  test('Редактирование дедлайна и приоритета задачи', async () => {
    const testId = Date.now();
    const originalTitle = `Исходная задача ${testId}`;
    const newTitle = `Обновленная задача ${testId}`;
    const originalDeadline = '2025-12-15';
    const newDeadline = '2025-12-20';
    const originalPriority = 'Low';
    const newPriority = 'High';

    await todoPage.createTask(originalTitle, testId.toString(), originalDeadline, originalPriority);

    const taskItems = await todoPage.taskItems();
    const lastTaskIndex = (await taskItems.count()) - 1;
    const task = taskItems.nth(lastTaskIndex);

    await task.locator('.task-label').click();
    await page.locator('#editButton').click();

    await page.locator('#editTitle').fill(newTitle); 
    await page.locator('#editDeadline').fill(newDeadline);  
    await page.locator('#editPriority').selectOption(newPriority);  

    await page.locator('#confirmSave').click();
    const updatedTask = await todoPage.getTaskByExactTitle(newTitle);

    await expect(updatedTask.locator('.task-label')).toBeVisible();

    const updatedDeadlineElement = await updatedTask.locator('.right div:nth-child(1)');
    const updatedDeadline = await updatedDeadlineElement.textContent();
    const formattedNewDeadline = new Date(newDeadline).toLocaleDateString('ru-RU');
    expect(updatedDeadline.trim()).toContain(formattedNewDeadline); 

    const updatedPriorityElement = await updatedTask.locator('.task-meta div:nth-child(2)');
    const updatedPriority = await updatedPriorityElement.textContent();
    expect(updatedPriority.trim()).toContain(newPriority);  
});


  test('Фильтрация задач по статусу Completed', async () => {
    await todoPage.createTask('Задача 1', '', '', '');
    await todoPage.createTask('Задача 2', '', '', '');
    await todoPage.createTask('Задача 3', '', '', '');
    
    await (await todoPage.taskItems()).nth(0).locator('input[type="checkbox"]').check();
    await (await todoPage.taskItems()).nth(1).locator('input[type="checkbox"]').check();
  
    await page.locator('#statusFilter').selectOption('Completed');

    await page.waitForSelector('.task:has(input[type="checkbox"]:checked)'); 
    
    const visibleTasks = await todoPage.taskItems();
    expect(await visibleTasks.count()).toBe(2);
    
    for (let i = 0; i < await visibleTasks.count(); i++) {
      const checkbox = await visibleTasks.nth(i).locator('input[type="checkbox"]');
      expect(await checkbox.isChecked()).toBeTruthy();
    }
    await page.locator('#statusFilter').selectOption('All statuses');
  });
  

  test('Сортировка задач по приоритету', async () => {
    await todoPage.createTask('Низкий приоритет', '', '', 'Low');
    await todoPage.createTask('Критический приоритет', '', '', 'Critical');
    await todoPage.createTask('Средний приоритет', '', '', 'Medium');
    
    await page.locator('#sortBy').selectOption('priority');
    await page.waitForTimeout(500);  

    const tasks = await todoPage.taskItems();
    
    expect(await tasks.count()).toBe(3);
    
    const firstTaskPriority = await tasks.nth(0).locator('.task-meta div').nth(1).textContent();
    expect(firstTaskPriority).toContain('Critical');
    
    const middleTaskPriority = await tasks.nth(1).locator('.task-meta div').nth(1).textContent();
    expect(middleTaskPriority).toContain('Medium');
    
    const lastTaskPriority = await tasks.nth(2).locator('.task-meta div').nth(1).textContent();
    expect(lastTaskPriority).toContain('Low');
  });
  
  test('Создание задачи с длинным названием', async () => {
    const longTitle = 'Очень длинное название задачи, которое должно корректно отображаться в интерфейсе и не ломать верстку при отображении';
    await todoPage.createTask(longTitle, '', '', '');
    
    const taskItems = await todoPage.taskItems();
    const taskCount = await taskItems.count();
    const task = taskItems.nth(taskCount - 1);
    const taskTitle = await task.locator('.task-label').textContent();
    expect(taskTitle).toBe(longTitle);
    
    const isOverflowing = await task.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    expect(isOverflowing).toBeFalsy();
  });

  test('Попытка создания задачи с заголовком 3 символа- не должна добавляться', async () => {
    const initialCount = await (await todoPage.taskItems()).count();
    const invalidTitle = '123'; 
    
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Validation failed');
      await dialog.dismiss();
    });
  
    await todoPage.createTask(invalidTitle, '', '', '');
    const newCount = await (await todoPage.taskItems()).count();
    expect(newCount).toBe(initialCount); 
  });
  
  test('Создание задачи с заголовком 4 символа (минимальная допустимая длина)', async () => {
    const initialCount = await (await todoPage.taskItems()).count();
    const validTitle = '1234'; 
    
    await todoPage.createTask(validTitle, '', '', '');
    const newCount = await (await todoPage.taskItems()).count();
    expect(newCount).toBe(initialCount + 1);

  });

  test('Отмена редактирования задачи', async () => {
    const originalTitle = 'Исходное название';
    await todoPage.createTask(originalTitle, '', '', '');

    const taskItems = await todoPage.taskItems();
    const lastTaskIndex = (await taskItems.count()) - 1;
    const task = taskItems.nth(lastTaskIndex);

    await task.locator('.task-label').click();
    
    await page.locator('#editButton').click();
    await page.locator('#editTitle').fill('Новое название');

    await page.locator('#cancelEdit').click();

    const taskAfterCancel = await todoPage.getTaskByExactTitle(originalTitle);
    await expect(taskAfterCancel.locator('.task-label')).toBeVisible(); 

    await expect(page.locator('.task-label:has-text("Новое название")')).toHaveCount(0);
  });


  test('Задача с макросом !1 должна иметь приоритет Critical', async () => {
    const taskTitle = '!1 Critical task';
    await todoPage.createTask(taskTitle, 'Описание задачи', '', 'Critical');
  
    const task = await todoPage.getLastTask();
    
    const priorityElement = await task.locator('.task-meta div:nth-child(2)');  
    const priority = await priorityElement.textContent();  
    expect(priority.trim()).toContain('Critical');  
  });

  test('Задача с макросом !4 должна иметь приоритет Critical', async () => {
    const taskTitle = '!4 Critical task'; 
    await todoPage.createTask(taskTitle, 'Описание задачи', '', 'Critical'); 

    const task = await todoPage.getLastTask();

    const priorityElement = await task.locator('.task-meta div:nth-child(2)');  
    const priority = await priorityElement.textContent();  
    expect(priority.trim()).toContain('Critical'); 
});
  
test('Задача с макросом !5 должна оставить макрос в заголовке', async () => {
  const taskTitle = '!5 Task with macro';
  await todoPage.createTask(taskTitle, 'Описание задачи', '', 'Low');

  const task = await todoPage.getLastTask();

  const titleElement = await task.locator('.task-label');  
  const title = await titleElement.textContent();  

  expect(title.trim()).toContain('!5'); 
});  
test('Задача с несуществующим дедлайном !before 32.12.2026 не должна создаваться', async () => {
  const taskTitle = '!before 32.12.2026invalid deadline';

  await todoPage.createTask(taskTitle, 'Описание задачи', '', ''); 
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('Неккоректный формат даты');
    await dialog.dismiss(); 
  });
  const newCount = await (await todoPage.taskItems()).count();
  expect(newCount).toBe(0); 
});

test('Дедлайн задачи должен быть взят из поля ввода, а не из макроса', async () => {
  const taskTitle = '!before 10.12.2025 deadline from input'; 
  const inputDeadline =  '2025-12-15';  

  await todoPage.createTask(taskTitle, 'Описание задачи', inputDeadline, 'Low');

  const task = await todoPage.getLastTask();

  const deadlineElement = await task.locator('.right div:nth-child(1)');
  const deadline = await deadlineElement.textContent();
  const formattedDeadline = new Date(inputDeadline).toLocaleDateString('ru-RU');  
  expect(deadline.trim()).toContain(formattedDeadline); 
});
test('Задача с дедлайном менее чем через 3 дня должна быть оранжевой', async () => {
  const title = 'Задача почти истекла';
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 2); 
  const deadlineStr = deadlineDate.toISOString().split('T')[0];

  await todoPage.createTask(title, '', deadlineStr, 'Medium');

  const task = await todoPage.getLastTask();
  const backgroundColor = await task.evaluate(el => getComputedStyle(el).backgroundColor);

  expect(backgroundColor).toBe('rgba(255, 165, 0, 0.1)');
});
test('Задача с просроченным дедлайном должна быть красной', async () => {
  const title = 'Просроченная задача';
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1); 
  const deadlineStr = pastDate.toISOString().split('T')[0];

  await todoPage.createTask(title, '', deadlineStr, 'High');

  const task = await todoPage.getLastTask();
  const backgroundColor = await task.evaluate(el => getComputedStyle(el).backgroundColor);

  expect(backgroundColor).toBe('rgba(255, 0, 0, 0.1)');
});
test('Выполненная задача должна отображаться корректно независимо от дедлайна', async () => {
  const title = 'Выполненная просроченная задача';
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 2);
  const deadlineStr = pastDate.toISOString().split('T')[0];

  await todoPage.createTask(title, '', deadlineStr, 'Low');
  await todoPage.toggleFirstTask()

  const task = await todoPage.getLastTask();
  const backgroundColor = await task.evaluate(el => getComputedStyle(el).backgroundColor);

  expect(backgroundColor).not.toBe('rgba(255, 0, 0, 0.1)');
  expect(backgroundColor).not.toBe('rgba(255, 165, 0, 0.1)');
});
test('Созданная задача должна иметь статус Active', async () => {
  const title = 'Новая задача';
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  const deadline = futureDate.toISOString().split('T')[0];

  await todoPage.createTask(title, '', deadline, 'Medium');

  const status = await todoPage.getLastTaskStatus();
  expect(status).toContain('Active');
});
test('Задача становится Overdue, если дедлайн прошел и она не выполнена', async () => {
  const title = 'Просроченная задача';
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  const deadline = pastDate.toISOString().split('T')[0];

  await todoPage.createTask(title, '', deadline, 'High');

  const status = await todoPage.getLastTaskStatus();
  expect(status).toContain('Overdue');
});
test('Задача переходит в Completed, если выполнена до дедлайна', async () => {
  const title = 'Задача вовремя';
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 2);
  const deadline = futureDate.toISOString().split('T')[0];

  await todoPage.createTask(title, '', deadline, 'Low');
  await todoPage.toggleFirstTask()

  const status = await todoPage.getLastTaskStatus();
  expect(status).toContain('Completed');
});
test('Задача переходит в Late, если выполнена после дедлайна', async () => {
  const title = 'Поздно выполненная задача';
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 2);
  const deadline = pastDate.toISOString().split('T')[0];

  await todoPage.createTask(title, '', deadline, 'Medium');
  await todoPage.toggleFirstTask()

  const status = await todoPage.getLastTaskStatus();
  expect(status).toContain('Late');
});
test('Попытка редактирования дедлайна на прошедшую дату вызывает alert и не меняет статус', async () => {
  const title = `Задача Overdue ${Date.now()}`;
  const validDeadline = '2030-01-01';
  const invalidPastDeadline = '2020-01-01';

  await todoPage.createTask(title, '', validDeadline, 'Low');

  const task = await todoPage.getTaskByExactTitle(title);
  await task.locator('.task-label').click();
  await page.locator('#editButton').click();
  await page.locator('#editDeadline').fill(invalidPastDeadline);

  const dialogPromise = page.waitForEvent('dialog');

  await page.locator('#confirmSave').click();

  const dialog = await dialogPromise;
  expect(dialog.message()).toContain('Дедлайн не может быть в прошлом');
  await dialog.dismiss();

  const updatedTask = await todoPage.getTaskByExactTitle(title);
  const status = await updatedTask.locator('.task-meta div:nth-child(1)').textContent();
  expect(status.trim()).not.toContain('Overdue');

});
});
