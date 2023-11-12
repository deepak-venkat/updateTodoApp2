const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const validateValues = (request, response, next) => {
  const {status, priority, category} = request.query
  let validDueDate = true
  let formattedDate

  if (request.method === 'POST' || request.method === 'PUT') {
    const {dueDate} = request.body
    try {
      formattedDate = format(dueDate, 'yyyy-MM-dd')
    } catch (e) {
      validDueDate = false
      response.status(400)
      response.send('Invalid Due Date')
      console.log(e)
    }
  }

  let validStatus, validPriority, validCategory
  if (status !== undefined) {
    if (status !== 'TO DO' && status !== 'IN PROGRESS' && status !== 'DONE') {
      response.status(400)
      response.send('Invalid Todo Status')
    } else {
      validStatus = true
    }
  } else if (priority !== undefined) {
    if (priority !== 'HIGH' && priority !== 'MEDIUM' && priority !== 'LOW') {
      response.status(400)
      response.send('Invalid Todo priority')
    } else {
      validPriority = true
    }
  } else if (category !== undefined) {
    if (category !== 'WORK' && category !== 'HOME' && category !== 'LEARNING') {
      response.status(400)
      response.send('Invalid Todo category')
    } else {
      validCategory = true
    }
  }
  if (
    (status === undefined || validStatus) &&
    (priority === undefined || validPriority) &&
    (category === undefined || validCategory) &&
    validDueDate
  ) {
    next()
  }
}

app.get('/todos/', validateValues, async (request, response) => {
  const {status, priority, search_q, category} = request.query
  let selectQuery
  switch (true) {
    case status !== undefined &&
      priority === undefined &&
      search_q === undefined &&
      category === undefined:
      selectQuery = `SELECT * FROM todo WHERE status LIKE '${status}'; `
      break
    case status === undefined &&
      priority !== undefined &&
      search_q === undefined &&
      category === undefined:
      selectQuery = `SELECT * FROM todo WHERE priority LIKE '${priority}'; `
      break
    case status === undefined &&
      priority === undefined &&
      search_q === undefined &&
      category !== undefined:
      selectQuery = `SELECT * FROM todo WHERE category LIKE '${category}'; `
      break
    case status === undefined &&
      priority === undefined &&
      search_q === undefined &&
      category !== undefined:
      selectQuery = `SELECT * FROM todo WHERE category LIKE '${category}'; `
      break
    case status === undefined &&
      priority === undefined &&
      search_q !== undefined &&
      category === undefined:
      selectQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'; `
      break
    case status !== undefined &&
      priority === undefined &&
      search_q === undefined &&
      category !== undefined:
      selectQuery = `SELECT * FROM todo WHERE category LIKE '${category}' AND status LIKE '${status}'; `
      break
    case status === undefined &&
      priority !== undefined &&
      search_q === undefined &&
      category !== undefined:
      selectQuery = `SELECT * FROM todo WHERE category LIKE '${category}' AND priority LIKE '${priority}'; `
      break
    case status !== undefined &&
      priority !== undefined &&
      search_q === undefined &&
      category === undefined:
      selectQuery = `SELECT * FROM todo WHERE status LIKE '${status}' AND priority LIKE '${priority}'; `
      break
  }
  const todo_arr = await db.all(selectQuery)
  const todoArr = todo_arr.map(eachObj => {
    return {
      id: eachObj.id,
      todo: eachObj.todo,
      priority: eachObj.priority,
      status: eachObj.status,
      category: eachObj.category,
      dueDate: eachObj.due_date,
    }
  })
  response.send(todoArr)
})
