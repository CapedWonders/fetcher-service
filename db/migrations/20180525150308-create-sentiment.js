'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Sentiments', {
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
      eventId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Events',
          key: 'id'
        },
      },
      articleId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Articles',
          key: 'id'
        },
      },
      title: {
        type: Sequelize.BOOLEAN
      },
      body: {
        type:Sequelize.BOOLEAN
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