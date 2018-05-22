'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Articles', 'body', { type: Sequelize.TEXT });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Articles', 'body', { type: Sequelize.STRING });
  }
};
