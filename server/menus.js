const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter.param('menuId', (req, res, next, id) => {

  db.get("SELECT * FROM Menu WHERE id = $id_value",
  {
    $id_value: id
  }, function (err, row) {
    if (err){
      req.menu = undefined;
    }else{
      req.menuId = id;
      req.menu = row;
    }
    next();
  });
});

menusRouter.param('menuItemId', (req, res, next, id) => {

  db.get("SELECT * FROM MenuItem WHERE id = $id_value",
  {
    $id_value: id
  }, function (err, row) {
    if (err){
      req.menu = undefined;
    }else{
      req.menuItemId = id;
      req.menuItem = row;
    }
    next();
  });
});


/*
/api/menus
- GET
  - Returns a 200 response containing all saved menus on the `menus` property of the response body
*/

menusRouter.get('/', (req, res, next) =>{
  db.all("SELECT * FROM Menu", (err, rows) => {
    if (err){
      throw err;
    }else{
      const retObj = {
        menus: rows
      }
      res.status(200).send(retObj);
    }
  });
})

/*
/api/menus
- POST
  - Creates a new menu with the information from the `menu` property of the request body
  and saves it to the database. Returns a 201 response with the newly-created menu on the `menu` property of the response body
  - If any required fields are missing, returns a 400 response
* **Menu**
  - id - Integer, primary key, required
  - title - Text, required
*/

menusRouter.post('/', (req, res, next) => {
  const newMenu = req.body.menu;

  if(!newMenu.title){
    res.status(400).send();
  }else{
    db.run("INSERT INTO Menu (title) VALUES($title_value)",
  {
    $title_value: newMenu.title,
  }, function (err) {
    if(err){
      res.status(500).send();
    }else{
      const newID = this.lastID;
      db.get("SELECT * FROM Menu WHERE id = $id_value",
    {
      $id_value: newID
    }, (err, row) => {
      if (err){
        res.status(500).send();
      }else{
        const retObj = {menu: row};
        res.status(201).send(retObj);
          }
        });
      }
    });
  }
})

/*
/api/menus/:menuId
- GET
  - Returns a 200 response containing the menu with the supplied menu ID on the `menu` property of the response body
  - If a menu with the supplied menu ID doesn't exist, returns a 404 response
*/

menusRouter.get('/:menuId', (req, res, next) => {
  const menu = req.menu;
  if(menu){
    res.status(200).send({menu: menu});
  }else{
    res.status(404).send();
  }
})

/*
/api/menus/:menuId
- Updates the menu with the specified menu ID using the information
from the `menu` property of the request body and saves it to the database.
Returns a 200 response with the updated menu on the `menu` property of the response body
- If any required fields are missing, returns a 400 response
- If a menu with the supplied menu ID doesn't exist, returns a 404 response  * **Menu**
* **Menu**
  - id - Integer, primary key, required
  - title - Text, required
*/
menusRouter.put('/:menuId', (req, res, next) => {
  const menu = req.menu;
  const updatedMenu = req.body.menu;
  if(!menu){
    res.status(404).send();
  }else if(!updatedMenu.title){
    res.status(400).send();
  }else{
    db.run("UPDATE Menu SET title = $title_value WHERE id = $id_value",
  {
    $title_value: updatedMenu.title,
    $id_value: menu.id
  }, function (err){
    if (err){
      console.log(err);
      res.staus(500).send();
    }else{
      const ID = menu.id;
      db.get("SELECT * FROM Menu WHERE id = $id_value",
    {
      $id_value: ID
    }, (err, row) => {
      if (err){
        res.status(500).send();
      }else{
        const retObj = {menu: row};
        res.status(200).send(retObj);
          }
        });
      }
    });
  }
})

/*
/api/menus/:menuId
- DELETE
  - Deletes the menu with the supplied menu ID from the database if that menu has no related menu items.
  Returns a 204 response.
  - If the menu with the supplied menu ID has related menu items, returns a 400 response.
  - If a menu with the supplied menu ID doesn't exist, returns a 404 response
  * **MenuItem**
    - id - Integer, primary key, required
    - name - Text, required
    - description - Text, optional
    - inventory - Integer, required
    - price - Integer, required
    - menu_id - Integer, foreign key, required
*/

menusRouter.delete('/:menuId', (req, res, next) => {
  const menu = req.menu;
  const menuId = req.menuId;

  if(!menu){
    res.status(404).send();
  }else {
    db.get("SELECT * FROM MenuItem WHERE menu_id = $id_value",
  {
    $id_value: menuId
  }, (err, row) =>{
    if(row){
      res.status(400).send();
    }else{
      db.run("DELETE FROM Menu WHERE id = $id_value",
      {
        $id_value: menuId
      }, (err) => {
        if(err){
          console.log(err);
          res.status(500).send();
        }else{
          res.status(204).send();
          }
        });
      }
    });
  }
})

/*
/api/menus/:menuId/menu-items
- GET
  - Returns a 200 response containing all saved menu items related to the menu
  with the supplied menu ID on the `menu items` property of the response body
  - If a menu with the supplied menu ID doesn't exist, returns a 404 response
  * **MenuItem**
    - id - Integer, primary key, required
    - name - Text, required
    - description - Text, optional
    - inventory - Integer, required
    - price - Integer, required
    - menu_id - Integer, foreign key, required
*/

menusRouter.get('/:menuId/menu-items', (req, res, next) =>{
  if (req.menu){
    db.all("SELECT * FROM MenuItem WHERE menu_id = $menuId",
    {
      $menuId: req.menuId
    }, (err, rows) => {
      if (err){
        res.status.send({});
      }else{
        const retObj = {
          menuItems: rows
        }
        res.status(200).send(retObj);
      }
    });
  }else{
    res.status(404).send();
  }
})

/*
/api/menus/:menuId/menu-items**
- POST
  - Creates a new menu item, related to the menu with the supplied menu ID,
  with the information from the `menuItem` property of the request body and saves it to the database.
  Returns a 201 response with the newly-created menu item on the `menuItem` property of the response body
  - If any required fields are missing, returns a 400 response
  - If a menu with the supplied menu ID doesn't exist, returns a 404 response
  * **MenuItem**
    - id - Integer, primary key, required
    - name - Text, required
    - description - Text, optional
    - inventory - Integer, required
    - price - Integer, required
    - menu_id - Integer, foreign key, required
*/


menusRouter.post('/:menuId/menu-items', (req, res, next) =>{

  const newMenuItem = req.body.menuItem;

  if(!req.menu) {
    res.status(404).send();
  }else{
    if (!newMenuItem.name || !newMenuItem.inventory || !newMenuItem.price){
      res.status(400).send();
    }else{
        if(!newMenuItem.description){
          newMenuItem.description = '';
        }
        db.run("INSERT INTO MenuItem (name, description, inventory, price, menu_id) \
         VALUES($name_value, $desc, $inv_value, $price_value, $menuId)",
        {
          $name_value: newMenuItem.name,
          $desc: newMenuItem.description,
          $inv_value: newMenuItem.inventory,
          $price_value: newMenuItem.price,
          $menuId: req.menuId
        }, function (err) {
        if(err){
          console.log(err);
          res.status(500).send();
        }else{
          const newID = this.lastID;
          db.get("SELECT * FROM MenuItem WHERE id = $id_value",
        {
          $id_value: newID
        }, (err, row) => {
          if (err){
            console.log(err);
            res.status(500).send();
          }else{
            const retObj = {menuItem: row};
            res.status(201).send(retObj);
            }
          });
        }
      });
    }
  }
})

/*
/api/menus/:menuId/menu-items/:menuItemId
- PUT
  - Updates the menu item with the specified menu item ID using the information
  from the `menuItem` property of the request body and saves it to the database.
  Returns a 200 response with the updated menu item on the `menuItem` property of the response body
  - If any required fields are missing, returns a 400 response
  - If a menu with the supplied menu ID doesn't exist, returns a 404 response
  - If a menu item with the supplied menu item ID doesn't exist, returns a 404 response
  * **MenuItem**
    - id - Integer, primary key, required
    - name - Text, required
    - description - Text, optional
    - inventory - Integer, required
    - price - Integer, required
    - menu_id - Integer, foreign key, required
*/

menusRouter.put('/:menuId/menu-items/:menuItemId', (req, res, next) =>{

  const updatedMenuItem = req.body.menuItem;

  if(!req.menu || !req.menuItem){
    res.status(404).send();
  }else if(!updatedMenuItem.name || !updatedMenuItem.inventory || !updatedMenuItem.price){
    res.status(400).send()
  }else{
    if(!updatedMenuItem.description){
      updatedMenuItem.description = '';
    }
    db.run("UPDATE MenuItem SET name = $name_value, description = $desc, \
     inventory = $inv_value, price = $price_value WHERE id = $t_id",
        {
          $name_value: updatedMenuItem.name,
          $desc: updatedMenuItem.description,
          $inv_value: updatedMenuItem.inventory,
          $price_value: updatedMenuItem.price,
          $t_id: req.menuItemId
        }, function (err){
        if (err){
          console.log(err);
          res.staus(500).send();
        }else{
          const ID = req.params.menuItemId;
          db.get("SELECT * FROM MenuItem WHERE id = $id_value",
        {
          $id_value: ID
        }, (err, row) => {
          if (err){
            res.status(500).send();
          }else{
            const retObj = {menuItem: row};
            res.status(200).send(retObj);
              }
            });
          }
        });
      }
})


/*
/api/menus/:menuId/menu-items/:menuItemId
- DELETE
  - Deletes the menu item with the supplied menu item ID from the database. Returns a 204 response.
  - If a menu with the supplied menu ID doesn't exist, returns a 404 response
  - If a menu item with the supplied menu item ID doesn't exist, returns a 404 response
*/

menusRouter.delete('/:menuId/menu-items/:menuItemId', (req, res, next) =>{

  if(!req.menu || !req.menuItem){
    res.status(404).send();
  }else {
    const ID = req.params.menuItemId;
    db.run("DELETE FROM MenuItem WHERE id = $t_id",
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

module.exports = menusRouter;
