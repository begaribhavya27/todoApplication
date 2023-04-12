const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());
let db = null;

const InitializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Database Error: ${e.message}`);
    process.exit(1);
  }
};
InitializeDbAndServer();

const checkRequestQueries = async (request, response, next) => {
  const { search_q, priority, status, category, date } = request.query;
  const { todoId } = request.params;

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const isPriority = priorityArray.includes(priority);
    if (isPriority === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const isStatus = statusArray.includes(status);
    if (isStatus === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const isCategory = categoryArray.includes(category);
    if (isCategory === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const mydate = new Date(date);
      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${mydate.getFullYear()}-${mydate.getMonth() + 1}-${mydate.getDate()}`
        )
      );
      const isValidate = await isValid(result);
      if (isValidate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

const checkRequestBody = async (request, response, next) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const { todoId } = request.params;

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const isPriority = priorityArray.includes(priority);
    if (isPriority === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const isStatus = statusArray.includes(status);
    if (isStatus === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const isCategory = categoryArray.includes(category);
    if (isCategory === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const mydate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const result = toDate(new Date(formatedDate));
      const isValidate = await isValid(result);
      if (isValidate) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.id = id;
  request.todo = todo;
  request.todoId = todoId;

  next();
};

//API1 GET

app.get("/todos/", checkRequestQueries, async (request, response) => {
  const {
    search_q = "",
    priority = "",
    status = "",
    category = "",
  } = request.query;
  const getTodoQuery = `
        SELECT 
            id,
            todo,
            category,
            priority,
            status,
            due_date AS dueDate
        FROM todo 
        WHERE todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%'
        AND status LIKE '%${status}%' AND category LIKE '%${category}%';
    `;
  const todoArray = await db.all(getTodoQuery);
  response.send(todoArray);
});

//API2

app.get("/todos/:todoId/", checkRequestQueries, async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM todo
        WHERE id = ${todoId};
    `;
  const todoItem = await db.get(todoQuery);
  response.send(todoItem);
});

//API3

app.get("/agenda/", checkRequestQueries, async (request, response) => {
  const { date } = request;
  const query = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM todo
        WHERE due_date = '${date}';
    `;
  const todoArray = await db.all(query);
  if (todoArray === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(todoArray);
  }
});

//API4

app.post("/todos/", checkRequestBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const query = `
        INSERT INTO 
            todo (id, todo, priority, status, category, due_date)
        VALUES 
            (
                ${id},
                '${todo}',
                '${priority}',
                '${status}',
                '${category}',
                '${dueDate}'
            );
    `;
  await db.run(query);
  response.send("Todo Successfully Added");
});

//API 5

app.put("/todos/:todoId/", checkRequestBody, async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const { todoId } = request.params;
  let updateQuery = null;

  switch (true) {
    case status !== undefined:
      updateQuery = `
                UPDATE todo
                SET status = '${status}'
                WHERE id = ${todoId};
            `;
      await db.run(updateQuery);
      response.send("Status Updated");
      break;

    case priority !== undefined:
      updateQuery = `
                UPDATE todo 
                SET priority = '${priority}'
                WHERE id = ${todoId};
            `;
      await db.run(updateQuery);
      response.send("Priority Updated");
      break;

    case todo !== undefined:
      updateQuery = `
                UPDATE todo 
                SET todo = '${todo}'
                WHERE id = ${todoId};
            `;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;

    case category !== undefined:
      updateQuery = `
                UPDATE todo 
                SET category = '${category}'
                WHERE id = ${todoId};
            `;
      await db.run(updateQuery);
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      updateQuery = `
                UPDATE todo
                SET due_date = '${dueDate}'
                WHERE id = ${todoId};
            `;
      await db.run(updateQuery);
      response.send("Due Date Updated");
      break;
  }
});

//API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
        DELETE FROM todo
        WHERE id = ${todoId};
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
