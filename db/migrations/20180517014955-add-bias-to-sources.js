'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sources', 'bias', {type: Sequelize.INTEGER});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Sources', 'bias');
  }
};
