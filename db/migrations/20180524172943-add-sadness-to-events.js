'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Events', 'sadness', {type: Sequelize.FLOAT});
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.removeColumn('Events', 'sadness');
  }
};
