'use strict';
module.exports = (sequelize, DataTypes) => {
  var Rating = sequelize.define('Rating', {
    informed: DataTypes.INTEGER,
    articleBias: DataTypes.INTEGER,
    titleBias: DataTypes.INTEGER,
    sourceTrust: DataTypes.INTEGER
  }, {});
  Rating.associate = function(models) {
    // associations can be defined here
  };
  return Rating;
};