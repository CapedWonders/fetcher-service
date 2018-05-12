'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(__filename);
var db        = {};
var seed      = require('../../_tests_/sampleData.js');

const { db_name, db_user, db_password, db_host } = process.env;
const sequelize = new Sequelize(db_name, db_user, db_password, {
  dialect: 'mysql',
  host: db_host,
  // logging: false,
  operatorsAliases: false,
});

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

const associate = async() => {
  for (const model in db) {
    if (db[model].associate) {
      await db[model].associate(db);
      console.log('associated: ', model);
    }      
  }
}

associate();

// Object.keys(db).forEach(async (modelName) => {
//   if (db[modelName].associate) {
//     await db[modelName].associate(db);
//     console.log('associated: ', modelName)
//   }
// });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.clearDB = async() => {
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', {raw: true});
  await sequelize.sync({force: true});
  await db.Category.bulkCreate(seed.sampleCategories);   
};

module.exports = db;
