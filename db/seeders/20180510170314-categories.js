'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Categories', [
      {name: 'Business',},
      {name: 'Arts',},
      {name: 'Computers',},
      {name: 'Games',},
      {name: 'Health',},
      {name: 'Home',},
      {name: 'Recreation',},
      {name: 'Reference',},
      {name: 'Science',},
      {name: 'Shopping',},
      {name: 'Society',},
      {name: 'Sports',},
    ], {});
  },

  down: (queryInterface, Sequelize) => {    
    return queryInterface.bulkDelete('Category', null, {});
  }
};
