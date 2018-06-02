'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Ratings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      informed: {
        type: Sequelize.INTEGER
      },
      articleBias: {
        type: Sequelize.INTEGER
      },
      titleBias: {
        type: Sequelize.INTEGER
      },
      sourceTrust: {
        type: Sequelize.INTEGER
      },
      articleId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Articles',
          key: 'id'
        }
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
    return queryInterface.dropTable('Ratings');
  }
};