'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ArticleSentiment', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      articleId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Articles',
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
    return queryInterface.dropTable('ArticleSentiment');
  }
};
