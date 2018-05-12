'use strict';
module.exports = (sequelize, DataTypes) => {
  var Concept = sequelize.define('Concept', {
    uri: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    type: DataTypes.STRING
  }, {});
  Concept.associate = function(models) {
    Concept.belongsToMany(models.Event, {through: 'EventConcept'});
    Concept.belongsToMany(models.Article, {through: 'ArticleConcept'});
  };
  return Concept;
};

