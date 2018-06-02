'use strict';
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    bias: DataTypes.INTEGER
  }, {});
  User.associate = function(models) {
    // associations can be defined here
    User.belongsToMany(models.Event, {through: 'UserEvent'});
  };
  return User;
};