'use strict';
module.exports = (sequelize, DataTypes) => {
  var Rating = sequelize.define('Rating', {
    informed: DataTypes.INTEGER,
    articleBias: DataTypes.INTEGER,
    titleBias: DataTypes.INTEGER,
    sourceTrust: DataTypes.INTEGER
  }, {});
  Rating.associate = function(models) {
    Rating.belongsTo(models.Article);
    Rating.belongsToMany(models.User, {through: 'UserRating'});
  };
  return Rating;
};