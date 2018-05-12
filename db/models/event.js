'use strict';
module.exports = (sequelize, DataTypes) => {
  var Event = sequelize.define('Event', {
    uri: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    title: DataTypes.STRING,
    summary: DataTypes.STRING,
    date: DataTypes.DATE
  }, {});
  Event.associate = function(models) {
    Event.hasMany(models.Article);
    Event.belongsToMany(models.Subcategory, {through: 'EventSubcategory'});
    Event.belongsToMany(models.Concept, {through: 'EventConcept'});
  };
  return Event;
};

