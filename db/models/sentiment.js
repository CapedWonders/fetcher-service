'use strict';
module.exports = (sequelize, DataTypes) => {
  var sentiment = sequelize.define('Sentiment', {
    sentiment: DataTypes.FLOAT,
    fear: DataTypes.FLOAT,
    disgust: DataTypes.FLOAT,
    anger: DataTypes.FLOAT,
    sadness: DataTypes.FLOAT,
    joy: DataTypes.FLOAT
  }, {});
  sentiment.associate = function(models) {
    sentiment.hasMany(models.Article);
    sentiment.hasMany(models.Event)
  };
  return sentiment;
};