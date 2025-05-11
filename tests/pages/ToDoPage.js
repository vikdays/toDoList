class TodoPage {
  constructor(page) {
    this.page = page;
  }

  newItemInput() {
    return this.page.locator('.newitem');
  }

  descInput() {
    return this.page.locator('.descitem');
  }

  deadlineInput() {
    return this.page.locator('.deadlineitem');
  }

  prioritySelect() {
    return this.page.locator('.priorityitem');
  }

  addButton() {
    return this.page.locator('button.add:has-text("Add item")');
  }

  taskItems() {
    return this.page.locator('.task');
  }

  firstTaskCheckbox() {
    return this.page.locator('.task input[type="checkbox"]').first();
  }

  firstTaskDeleteButton() {
    return this.page.locator('.delete-btn').first();
  }

  async createTask(title, description, deadline, priority) {
    
    if (description) await this.descInput().fill(description);
    await this.newItemInput().fill(title);
    if (deadline) await this.deadlineInput().fill(deadline);
    if (priority) await this.prioritySelect().selectOption({ label: priority });
    await this.addButton().click();
  }

  async getLastTask() {
    const tasks = this.page.locator('.task');  
    const count = await tasks.count();
    return tasks.nth(count - 1); 
  }

  async deleteFirstTask() {
    const deleteButton = this.firstTaskDeleteButton();
    const task = this.taskItems().first();

    this.page.on('dialog', async dialog => {
        await dialog.accept();
    });
    
    await deleteButton.click();
    await task.waitFor({ state: 'detached', timeout: 10000 });

    this.page.off('dialog');
}
async deleteLastTask(shouldConfirm = true) {
  const task = this.taskItems().last();
  const deleteButton = task.locator('.delete-btn');

  this.page.once('dialog', async (dialog) => {
    shouldConfirm ? await dialog.accept() : await dialog.dismiss();
  });

  await deleteButton.click();

  try {
    if (shouldConfirm) {
      await task.waitFor({ state: 'detached', timeout: 5000 });
      return true;
    } else {
      await task.waitFor({ state: 'visible', timeout: 1000 });
      return false;
    }
  } catch (e) {
    return false;
  }
}

  async toggleFirstTask() {
    await this.firstTaskCheckbox().check();
  }

  async getTaskPriority(taskIndex = 0) {
    const task = this.taskItems().nth(taskIndex);
    const priorityElement = await task.locator('.priority-item');  
    return await priorityElement.textContent(); 
  }


  async getTaskByExactTitle(title) {
    const tasks = await this.taskItems();
    const count = await tasks.count();
    
    for (let i = 0; i < count; i++) {
        const taskTitle = await tasks.nth(i).locator('.task-label').textContent();
        if (taskTitle === title) {
            return tasks.nth(i);
        }
    }
    throw new Error(`Задача с названием "${title}" не найдена`);
}

  async getVisibleTasksCount() {
    return await this.taskItems().count();
  }

  async applyStatusFilter(status) {
    await this.page.locator('#statusFilter').selectOption(status);
    await this.page.waitForTimeout(300); 
  }

  async applyPriorityFilter(priority) {
    await this.page.locator('#priorityFilter').selectOption(priority);
    await this.page.waitForTimeout(300);
  }

  async applySort(sortOption) {
    await this.page.locator('#sortBy').selectOption(sortOption);
    await this.page.waitForTimeout(300);
  }

  async isTaskCompleted(taskIndex = 0) {
    const checkbox = await this.taskItems().nth(taskIndex).locator('input[type="checkbox"]');
    return await checkbox.isChecked();
  }
  async getLastTaskStatus() {
    const tasks = await this.page.locator('.task');
    const lastTask = tasks.nth(await tasks.count() - 1);
    const statusElement = lastTask.locator('.task-meta div:nth-child(1)');
    return await statusElement.textContent();
  }
  
}

module.exports = TodoPage;