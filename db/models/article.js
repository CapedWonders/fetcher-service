'use strict';
module.exports = (sequelize, DataTypes) => {
  var Article = sequelize.define('Article', {
    uri: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    url: DataTypes.STRING,
    title: DataTypes.STRING,
    body: DataTypes.TEXT,
    date: DataTypes.DATE,
    image: DataTypes.STRING,
    eventUri: DataTypes.STRING,
    sentiment: DataTypes.FLOAT
  }, {});
  Article.associate = function(models) {
    Article.belongsTo(models.Event);
    Article.belongsTo(models.Source);
    Article.belongsToMany(models.Subcategory, {through: 'ArticleSubcategory'});
    Article.belongsToMany(models.Concept, {through: 'ArticleConcept'});
  };
  return Article;
};

