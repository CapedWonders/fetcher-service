'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Articles', 'sentiment', {type: Sequelize.FLOAT});
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.removeColumn('Articles', 'sentiment');
  }
};