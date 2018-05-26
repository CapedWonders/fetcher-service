//db models
const db = require('../db/models/index.js');
const Op = require('../db/models/index.js').Sequelize.Op;
//Watson SDK and credentials
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const { WATSON_NLU_USERNAME, WATSON_NLU_PASSWORD, WATSON_NLU_URL } = process.env;

const nlu = new NaturalLanguageUnderstandingV1({
  username: WATSON_NLU_USERNAME,
  password: WATSON_NLU_PASSWORD,
  version: '2018-03-16',
});

const { lambda4 } = require('../_tests_/sampleData.js');
const sampleArticle = lambda4.articles.fox[1];

//get emotion data for an article's title or body
const analyzeArticle = async(articleUri) => {
  let titleAnalysis = null;
  let bodyAnalysis = null;
  const article = await db.Article.find({where: {uri: articleUri}});

  const title = await analyzeText(article.dataValues.title)
    .catch(e => console.error('Error when doingSomething', e.message));

  if (title) { 
    titleAnalysis = title;
  }

  const body = await analyzeText(article.dataValues.body)
    .catch(e => console.error('Error when doingSomething', e.message));

  if (body) {
    bodyAnalysis = body;
  }

  return { titleAnalysis, bodyAnalysis }
};

const analyzeText = (text) => {
  let response;
  var parameters = {
    'text': text,
    'features': {
      'emotion': {},
      'sentiment': {}
    }
  };

  return new Promise((resolve, reject) => {
    nlu.analyze(parameters, function(err, res) {
      if (err)
        reject(err);
      else {
        resolve(res);
      }     
    }); 
  });
};

const eventBySource = async(eventId) => {
  const event = await db.Event.find({where:{id: eventId}});

  const leftSources = await getSourcesByBias(eventId, 'left');
  const centerSources = await getSourcesByBias(eventId, 'center');
  const rightSources = await getSourcesByBias(eventId, 'right');

  const leftArticleTitles = getArticlesText(leftSources, 'title');
  const centerArticleTitles = getArticlesText(centerSources, 'title');
  const rightArticleTitles = getArticlesText(rightSources, 'title');

  const leftArticleBodies = getArticlesText(leftSources, 'body');
  const centerArticleBodies = getArticlesText(centerSources, 'body');
  const rightArticleBodies = getArticlesText(rightSources, 'body');

  return {
    left: {
      titles: leftArticleTitles,
      bodies: leftArticleBodies
    },
    center: {
      titles: centerArticleTitles,
      bodies: centerArticleBodies
    },
    right: {
      titles: rightArticleTitles,
      bodies: rightArticleBodies
    }
  }
};

const analyzeEvent = async(eventUri) => {
  const event = await db.Event.find({where: {uri: eventUri}});
  const eventInfo = await eventBySource(eventUri);
  const eventAnalysis = {
    left: {
      titles: await analyzeText(eventInfo.left.titles),
      bodies: await analyzeText(eventInfo.left.bodies)
    },
    center: {
      titles: await analyzeText(eventInfo.center.titles),
      bodies: await analyzeText(eventInfo.center.bodies)
    },
    right: {
      titles: await analyzeText(eventInfo.right.titles),
      bodies: await analyzeText(eventInfo.right.bodies)
    }
  };

  return eventAnalysis;
};

const getArticlesText = (sourcesObj, titleOrBody) => {
  let text = '';
  for (const source of sourcesObj) {
    for (const article of source.Articles) {
      text += titleOrBody === 'title' ? article.title : article.body;
    }
  }

  return text;
};

const getSourcesByBias = async(eventId, bias) => {
  const sourceUris = {
    left: ['motherjones.com', 'huffingtonpost.com', 'msnbc.com', 'nytimes.com', 'theguardian.com', 'latimes.com'],
    right: ['hosted.ap.org', 'thehill.com', 'npr.org'],
    center: ['foxnews.com', 'breitbart.com', 'washingtontimesreporter.com', 'ijr.com', 'theblaze.com', 'wnd.com']
  }

  const sources = await db.Source.findAll({
    where: {
      uri: sourceUris[bias]
    },
    include:[{
      model: db.Article,
      where: { eventId }
    }]
  });
  
  return sources;
};

module.exports = { analyzeArticle, analyzeEvent };












