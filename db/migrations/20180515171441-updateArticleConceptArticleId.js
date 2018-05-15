'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('ArticleConcept', 'eventId', 'articleId');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('ArticleConcept', 'articleId', 'eventId');
  }
};
