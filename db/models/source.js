'use strict';
module.exports = (sequelize, DataTypes) => {
  var Source = sequelize.define('Source', {
    uri: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    bias: DataTypes.INTEGER,
    title: DataTypes.STRING,
    image: DataTypes.STRING,
    thumbImage: DataTypes.STRING
  }, {});
  Source.associate = function(models) {
    Source.hasMany(models.Article);
  };
  return Source;
};
