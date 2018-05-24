'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Events', 'fear', {type: Sequelize.integer});
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.removeColumn('Events', 'fear');
  }
};
