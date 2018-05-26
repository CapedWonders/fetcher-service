'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('EventSentiment', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      eventId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Events',
          key: 'id'
        },
        allowNull: false
      },
      sentimentId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Sentiments',
          key: 'id'
        },
        allowNull: false
      },
      left: {
        type: Sequelize.BOOLEAN
      },
      center: {
        type: Sequelize.BOOLEAN
      },
      right: {
        type: Sequelize.BOOLEAN
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
    return queryInterface.dropTable('EventSentiment');
  }
};
