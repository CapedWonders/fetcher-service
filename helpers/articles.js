//db models
const db = require('../db/models/index.js');
const Op = require('../db/models/index.js').Sequelize.Op;

const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const nlu = new NaturalLanguageUnderstandingV1({
  username: '<username>',
  password: '<password>',
  version: '2018-04-05',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
});

const analyzeArticleTitle = (article) => {
  nlu.analyze(
  {
    text: article.title,
    features: {
      concepts: {},
      keywords: {}
    }
  },
  function(err, response) {
    if (err) {
      console.log('error:', err);
    } else {
      console.log(JSON.stringify(response, null, 2));
    }
  }
);
