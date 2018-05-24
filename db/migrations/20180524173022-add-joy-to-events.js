'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Events', 'joy', {type: Sequelize.FLOAT});
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.removeColumn('Events', 'joy');
  }
};
