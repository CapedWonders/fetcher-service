'use strict';

module.exports = {
   up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('ArticleSubcategory', 'eventId', 'articleId');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('ArticleSubcategory', 'articleId', 'eventId');
  }
};
