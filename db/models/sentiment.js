'use strict';
module.exports = (sequelize, DataTypes) => {
  var Sentiment = sequelize.define('Sentiment', {
    sentiment: DataTypes.FLOAT,
    label: DataTypes.STRING,
    fear: DataTypes.FLOAT,
    disgust: DataTypes.FLOAT,
    anger: DataTypes.FLOAT,
    sadness: DataTypes.FLOAT,
    joy: DataTypes.FLOAT,
    title: DataTypes.STRING,
    body: DataTypes.STRING
  }, {});
  Sentiment.associate = function(models) {
    Sentiment.belongsToMany(models.Article, {through: 'ArticleSentiment'});
    Sentiment.belongsToMany(models.Event, {through: 'EventSentiment'});
  };
  return Sentiment;
};