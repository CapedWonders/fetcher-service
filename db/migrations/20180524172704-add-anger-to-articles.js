'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Articles', 'anger', {type: Sequelize.integer});
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.removeColumn('Articles', 'anger');
  }
};
