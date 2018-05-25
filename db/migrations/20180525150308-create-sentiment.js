'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('sentiments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sentiment: {
        type: Sequelize.FLOAT
      },
      fear: {
        type: Sequelize.FLOAT
      },
      anger: {
        type: Sequelize.FLOAT
      },
      sadness: {
        type: Sequelize.FLOAT
      },
      joy: {
        type: Sequelize.FLOAT
      },
      disgust: {
        type: Sequelize.FLOAT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('sentiments');
  }
};