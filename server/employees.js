const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

/*
const {getFromDatabaseById} = require('./utils');
*/

employeesRouter.param('employeeId', (req, res, next, id) => {

  db.get("SELECT * FROM Employee WHERE id = $id_value",
  {
    $id_value: id
  }, function (err, row) {
    if (err){
      req.employee = undefined;
    }else{
      req.employeeId = id;
      req.employee = row;
    }
    next();
  });
});

employeesRouter.param('timesheetId', (req, res, next, id) => {

  db.get("SELECT * FROM Timesheet WHERE id = $id_value",
  {
    $id_value: id
  }, function (err, row) {
    if (err){
      req.timesheet = undefined;
    }else{
      req.timesheetId = id;
      req.timesheet = row;
    }
    next();
  });
});

/*
/api/employees
- GET
  - Returns a 200 response containing all saved currently-employed employees (`is_current_employee` is equal to `1`)
    on the `employees` property of the response body
*/

employeesRouter.get('/', (req, res, next) =>{
  db.all("SELECT * FROM Employee WHERE is_current_employee = 1", (err, rows) => {
    if (err){
      throw err;
    }else{
      const retObj = {
        employees: rows
      }
      res.status(200).send(retObj);
    }
  });
})

/*
/api/employees
- POST
  - Creates a new employee with the information from the `employee` property of the request body and saves it to the database.
    Returns a 201 response with the newly-created employee on the `employee` property of the response body
  - If any required fields are missing, returns a 400 response
  * **Employee**
    - id - Integer, primary key, required
    - name - Text, required
    - position - Text, required
    - wage - Integer, required
    - is_current_employee - Integer, defaults to `1`
*/

employeesRouter.post('/', (req, res, next) => {
  const newEmployee = req.body.employee;

  if(!newEmployee.name || !newEmployee.position || !newEmployee.wage){
    res.status(400).send();
  }else{
    db.run("INSERT INTO Employee (name, position, wage) VALUES($name_value, $position_value, $wage_value)",
  {
    $name_value: newEmployee.name,
    $position_value: newEmployee.position,
    $wage_value: newEmployee.wage
  }, function (err) {
    if(err){
      res.status(500).send();
    }else{
      const newID = this.lastID;
      db.get("SELECT * FROM Employee WHERE id = $id_value",
    {
      $id_value: newID
    }, (err, row) => {
      if (err){
        res.status(500).send();
      }else{
        const retObj = {employee: row};
        res.status(201).send(retObj);
      }
    });
    }
  });
  }
})

/*
/api/employees/:employeeId
- GET
  - Returns a 200 response containing the employee with the
    supplied employee ID on the `employee` property of the response body
  - If an employee with the supplied employee ID doesn't exist, returns a 404 response
*/

employeesRouter.get('/:employeeId', (req, res, next) => {
  const employee = req.employee;
  if(employee){
    res.status(200).send({employee: employee});
  }else{
    res.status(404).send();
  }
})

/*
/api/employees/:employeeId
- PUT
  - Updates the employee with the specified employee ID
   using the information from the `employee` property of the request body and
    saves it to the database.
    Returns a 200 response with the updated employee on the `employee` property of the response body
  - If any required fields are missing, returns a 400 response
  - If an employee with the supplied employee ID doesn't exist, returns a 404 response
  * **Employee**
    - id - Integer, primary key, required
    - name - Text, required
    - position - Text, required
    - wage - Integer, required
    - is_current_employee - Integer, defaults to `1`
*/
employeesRouter.put('/:employeeId', (req, res, next) => {
  const employee = req.employee;
  const updatedEmployee = req.body.employee;
  if(!employee){
    res.status(404).send();
  }else if(!updatedEmployee.name || !updatedEmployee.position || !updatedEmployee.wage){
    res.status(400).send();
  }else{
    db.run("UPDATE Employee SET name = $name_value, position = $position_value, wage = $wage_value WHERE id = $id_value",
  {
    $name_value: updatedEmployee.name,
    $position_value: updatedEmployee.position,
    $wage_value: updatedEmployee.wage,
    $id_value: employee.id
  }, function (err){
    if (err){
      console.log(err);
      res.staus(500).send();
    }else{
      const ID = employee.id;
      db.get("SELECT * FROM Employee WHERE id = $id_value",
    {
      $id_value: ID
    }, (err, row) => {
      if (err){
        res.status(500).send();
      }else{
        const retObj = {employee: row};
        res.status(200).send(retObj);
      }
    });
    }
  });
  }
})

/*
/api/employees/:employeeId
- DELETE
  - Updates the employee with the specified employee ID
    to be unemployed (`is_current_employee` equal to `0`). Returns a 200 response.
  - If an employee with the supplied employee ID doesn't exist, returns a 404 response
*/
employeesRouter.delete('/:employeeId', (req, res, next) => {
  const employee = req.employee;

  if(employee){
    db.run("UPDATE Employee SET is_current_employee = 0 WHERE id = $id_value",
  {
    $id_value: employee.id
  }, function(err) {
    if(err){
      res.status(500).send();
    }else{
      const ID = employee.id;
      db.get("SELECT * FROM Employee WHERE id = $id_value",
      {
        $id_value: ID
      }, (err, row) => {
      if (err){
        res.status(500).send();
      }else{
        const retObj = {employee: row};
        res.status(200).send(retObj);
      }
    });
  }
  });
  }else{
    res.status(404).send();
  }
})

/*
/api/employees/:employeeId/timesheets
- GET
  - Returns a 200 response containing all saved
  timesheets related to the employee with the supplied employee ID on the `timesheets` property of the response body
  - If an employee with the supplied employee ID doesn't exist, returns a 404 response
  * **Timesheet**
    - id - Integer, primary key, required
    - hours - Integer, required
    - rate - Integer, required
    - date - Integer, required
    - employee_id - Integer, foreign key, required
*/

employeesRouter.get('/:employeeId/timesheets', (req, res, next) =>{
  if (req.employee){
    db.all("SELECT * FROM Timesheet WHERE employee_id = $empId",
    {
      $empId: req.employeeId
    }, (err, rows) => {
      if (err){
        throw err;
      }else{
        const retObj = {
          timesheets: rows
        }
        res.status(200).send(retObj);
      }
    });
  }else{
    res.status(404).send();
  }
})

/*
/api/employees/:employeeId/timesheets**
- POST
  - Creates a new timesheet, related to the employee with the supplied employee ID,
  with the information from the `timesheet` property of the request body and saves it to the database.
  Returns a 201 response with the newly-created timesheet on the `timesheet` property of the response body
  - If an employee with the supplied employee ID doesn't exist, returns a 404 response
  * **Timesheet**
    - id - Integer, primary key, required
    - hours - Integer, required
    - rate - Integer, required
    - date - Integer, required
    - employee_id - Integer, foreign key, required
*/

employeesRouter.post('/:employeeId/timesheets', (req, res, next) =>{

  const newTimesheet = req.body.timesheet;

  if(!req.employee) {
    res.status(404).send();
  }else{
    if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.date){
      res.status(400).send();
    }else{
        db.run("INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES($hours_value, $rate_value, $date_value, $empid)",
        {
        $hours_value: newTimesheet.hours,
        $rate_value: newTimesheet.rate,
        $date_value: newTimesheet.date,
        $empid: req.employeeId
        }, function (err) {
        if(err){
          res.status(500).send();
        }else{
          const newID = this.lastID;
          db.get("SELECT * FROM Timesheet WHERE id = $id_value",
        {
          $id_value: newID
        }, (err, row) => {
          if (err){
            res.status(500).send();
          }else{
            const retObj = {timesheet: row};
            res.status(201).send(retObj);
          }
        });
        }
        });
    }
  }
})
/*
/api/employees/:employeeId/timesheets/:timesheetId
- PUT
  - Updates the timesheet with the specified timesheet ID using the
  information from the `timesheet` property of the request body and saves it to the database.
  Returns a 200 response with the updated timesheet on the `timesheet` property of the response body
  - If any required fields are missing, returns a 400 response
  - If an employee with the supplied employee ID doesn't exist, returns a 404 response
  - If an timesheet with the supplied timesheet ID doesn't exist, returns a 404 response
  * **Timesheet**
    - id - Integer, primary key, required
    - hours - Integer, required
    - rate - Integer, required
    - date - Integer, required
    - employee_id - Integer, foreign key, required
*/

employeesRouter.put('/:employeeId/timesheets/:timesheetId', (req, res, next) =>{

  const updatedTimesheet = req.body.timesheet;

  if(!req.employee || !req.timesheet){
    res.status(404).send();
  }else if(!updatedTimesheet.hours || !updatedTimesheet.rate || !updatedTimesheet.date){
    res.status(400).send()
  }else
  {
    db.run("UPDATE Timesheet SET hours = $hour_value, rate = $rate_value, date = $date_value WHERE id = $t_id",
        {
          $hour_value: updatedTimesheet.hours,
          $rate_value: updatedTimesheet.rate,
          $date_value: updatedTimesheet.date,
          $t_id: req.params.timesheetId
        }, function (err){
        if (err){
          console.log(err);
          res.staus(500).send();
        }else{
          const ID = req.params.timesheetId;
          db.get("SELECT * FROM Timesheet WHERE id = $id_value",
        {
          $id_value: ID
        }, (err, row) => {
          if (err){
            res.status(500).send();
          }else{
            const retObj = {timesheet: row};
            res.status(200).send(retObj);
              }
            });
          }
        });
      }
})


/*
/api/employees/:employeeId/timesheets/:timesheetId
- DELETE
  - Deletes the timesheet with the supplied timesheet ID from the database. Returns a 204 response.
  - If an employee with the supplied employee ID doesn't exist, returns a 404 response
  - If an timesheet with the supplied timesheet ID doesn't exist, returns a 404 response
*/

employeesRouter.delete('/:employeeId/timesheets/:timesheetId', (req, res, next) =>{

  if(!req.employee || !req.timesheet){
    res.status(404).send();
  }else {
        const ID = req.params.timesheetId;
        db.run("DELETE FROM Timesheet WHERE id = $t_id",
      {
        $t_id: ID
      }, (err) => {
        if(err){
          console.log(err);
          res.status(500).send();
        }else{
          res.status(204).send();
          }
        });
      }
})

module.exports = employeesRouter;
