'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Events', 'anger', {type: Sequelize.integer});
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.removeColumn('Events', 'anger');
  }
};
