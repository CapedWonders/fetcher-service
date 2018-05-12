'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Articles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uri: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      url: Sequelize.STRING,
      title: Sequelize.STRING,
      body: Sequelize.STRING,
      date: Sequelize.STRING,
      image: Sequelize.STRING,
      eventUri: Sequelize.STRING,
      eventId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Events',
          key: 'id'
        },
      },
      sourceId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Sources',
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
      },    
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Articles');
  }
};

