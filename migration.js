const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

/*
* **Employee**
  - id - Integer, primary key, required
  - name - Text, required
  - position - Text, required
  - wage - Integer, required
  - is_current_employee - Integer, defaults to `1`
*/
db.run("CREATE TABLE Employee \
        ( \
          id INTEGER NOT NULL PRIMARY KEY, \
          name TEXT NOT NULL, \
          position TEXT NOT NULL, \
          wage INTEGER NOT NULL, \
          is_current_employee INTEGER DEFAULT 1 \
        );", (err) => {
          if (err){
            throw err;
          }
});


/*
* **Timesheet**
  - id - Integer, primary key, required
  - hours - Integer, required
  - rate - Integer, required
  - date - Integer, required
  - employee_id - Integer, foreign key, required
*/
db.run("CREATE TABLE Timesheet \
        ( \
          id INTEGER NOT NULL PRIMARY KEY, \
          hours INTEGER NOT NULL, \
          rate INTEGER NOT NULL, \
          date INTEGER NOT NULL, \
          employee_id INTEGER NOT NULL \
        );", (err) => {
          if (err){
            throw err;
          }
});


/*
* **Menu**
  - id - Integer, primary key, required
  - title - Text, required
*/

db.run("CREATE TABLE Menu \
        ( \
          id INTEGER NOT NULL PRIMARY KEY, \
          title TEXT NOT NULL \
        );", (err) => {
          if (err){
            throw err;
          }
});

/*
* **MenuItem**
  - id - Integer, primary key, required
  - name - Text, required
  - description - Text, optional
  - inventory - Integer, required
  - price - Integer, required
  - menu_id - Integer, foreign key, required
*/

db.run("CREATE TABLE MenuItem \
        ( \
          id INTEGER NOT NULL PRIMARY KEY, \
          name TEXT NOT NULL, \
          description TEXT, \
          inventory INTEGER NOT NULL, \
          price INTEGER NOT NULL, \
          menu_id INTEGER NOT NULL \
        );", (err) => {
          if (err){
            throw err;
          }
});
