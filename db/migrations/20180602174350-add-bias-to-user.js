'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'bias', {type: Sequelize.INTEGER});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'bias');
  }
};