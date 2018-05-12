'use strict';
module.exports = (sequelize, DataTypes) => {
  var Subcategory = sequelize.define('Subcategory', {
    uri: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    }
  }, {});
  Subcategory.associate = function(models) {
    Subcategory.belongsTo(models.Category);
    Subcategory.belongsToMany(models.Event, {through: 'EventSubcategory'});
    Subcategory.belongsToMany(models.Article, {through: 'ArticleSubcategory'});
  };
  return Subcategory;
};