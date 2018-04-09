const express = require('express');
const app = express();

module.exports = app;

/* Do not change the following line! It is required for testing and allowing
*  the frontend application to interact as planned with the api server
*/
const PORT = process.env.PORT || 4000;

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Add middware for parsing request bodies here:
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const employeesRouter = require('./server/employees');
app.use('/api/employees', employeesRouter);

const menusRouter = require('./server/menus');
app.use('/api/menus', menusRouter);

//const timesheetRouter = require('./server/timesheet');
//app.use('/api/employees/:employeeId/timesheets', timesheetRouter);

// Add your code to start the server listening at PORT below:
app.listen(PORT, () => {
  console.log('server listening on port 4000');
});
