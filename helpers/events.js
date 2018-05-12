//axios
const axios = require('axios');

//db models
const db = require('../db/models/index.js');

//lodash
const _ = require('lodash');

//moment
const moment = require('moment');

//lambda uris
const { eventUriLambda, eventInfoLamnda, articlesBySourceLambda, articlesByEventLambda } = process.env;

/* 
   ********************************************************************* 
   PROCESSING EVENTS - functions that determine which data we care about 
   ********************************************************************* 
*/

//get the uris that are shared between news outlets
const extractReleventEvents = (urisObj) => {
  //right
  let fox = new Set(urisObj.fox);
  let breitbart = new Set(urisObj.breitbart);
  //both outlets have reported
  let rightAll = new Set([...fox].filter(x => breitbart.has(x)));
  //at least one outlet has reported
  let rightAny = new Set([...fox, ...breitbart]);

  //left
  let huffington = new Set(urisObj.huffington);
  let msnbc = new Set(urisObj.msnbc);
  //both outlets have reported
  let leftAll = new Set([...huffington].filter(x => msnbc.has(x)));
  //at least one outlet has reported
  let leftAny = new Set([...huffington, ...msnbc]);

  //center
  let ap = new Set(urisObj.ap);
  let times = new Set(urisObj.times);
  let hill = new Set(urisObj.hill);
  //all outlets have reported
  let centerAll = new Set([...ap].filter(x => hill.has(x) && times.has(x)));
  //at least one outlet has reported
  let centerAny = new Set([...ap, ...times, ...hill]);

  //all 7 sources have reported
  let allSet = new Set([...rightAll].filter(x => leftAll.has(x) && centerAll.has(x)));
  let allArray = [...allSet];

  //at least one of left, right and center have reported
  let spectrumSet = new Set([...rightAny].filter(x => leftAny.has(x) && centerAny.has(x)));
  let spectrumArray = [...spectrumSet];
  
  return spectrumArray;
};

//TODO: TEST THIS FUNCTION

//check the DB to see if an unsaved event meets our criteria of being relevant
const isEventRelevant = async(eventUri) => { 
  const sourceUrisRight = ['foxnews.com', 'breitbart.com'];
  const sourceUrisCenter = ['hosted.ap.org', 'nytimes.com', 'thehill.com'];
  const sourceUrisLeft = ['msnbc.com', 'huffingtonpost.com'];

  const sourcesRight = await db.Source.findAll({ where: { uri: sourceUrisRight } });
  const sourcesCenter = await db.Source.findAll({ where: { uri: sourceUrisCenter } });
  const sourcesLeft = await db.Source.findAll({ where: { uri: sourceUrisLeft } });

  const sourceIdsRight = sourcesRight.map(source => source.dataValues.id);
  const sourceIdsCenter = sourcesCenter.map(source => source.dataValues.id);
  const sourceIdsLeft = sourcesLeft.map(source => source.dataValues.id);

  const articlesRight = await db.Article.findAll({
    where: {
      eventUri: eventUri,
      sourceId: sourceIdsRight,
    }
  });

  const articlesCenter = await db.Article.findAll({
    where: {
      eventUri: eventUri,
      sourceId: sourceIdsCenter,
    }
  });

  const articlesLeft = await db.Article.findAll({
    where: {
      eventUri: eventUri,
      sourceId: sourceIdsLeft,
    }
  });

  if (articlesRight.length > 0 && articlesCenter.length > 0 && articlesLeft.length > 0) {
    console.log('relevant');
    return true;
  } else {
    console.log('not relevant')
    return false;
  }
};

/* 
   ********************************************************************* 
   FORMTTING & SAVING - functions that store data in our DB
   ********************************************************************* 

*/

//format instances to conform to DB models
const formatEvent = (event) => {
  return db.Event.build({
    uri: event.uri,
    date: moment(event.eventDate, "YYYY-MM-DD"),
    title: event.title.eng || event.title || "",
    summary: event.summary.eng || event.summary || ""
  });
};

const formatConcept = (concept) => {
  return db.Concept.build({
    uri: concept.uri,
    type: concept.type
  }); 
};

const formatSubcategory = (subcategory) => {
  return db.Subcategory.build({
    uri: subcategory.uri,
  }); 
};

const formatArticle = (article) => {
  return db.Article.build({
    uri: article.uri,
    url: article.url,
    title: article.title,
    body: article.body,
    date: article.date,
    eventUri: article.eventUri,
    image: article.image,
  });
};

const extractFormatSource = (article) => {
  return db.Source.build({
    uri: article.source.uri,
    title: article.source.title,
    importance: article.source.importance,
    image: article.source.image,
    thumbImage: article.source.thumbImage,
    bias: calculateBias(article.source.title)
  });
};

// a value either between -3 and +3 or -2 and +2 for easy ranking when we have more sources
const calculateBias = (sourceTitle) => {
  //TO DO: Rank top US news sources with bias
  return null;
};

//saving and associating new articles, events, sources, concepts and categories
const buildSaveArticle = async (article) => {

  if (article.eventUri === null) {
    return;
  }
  
  let formatted = await formatArticle(article);
  let event = await db.Event.find({where:{uri: article.eventUri}});
  let source = await db.Source.find({where: {uri: article.source.uri}}).then(result => result);
  let savedArticle;

  if (!source) {
    source = await extractFormatSource(article);
    source.save().then(saved => console.log('saved source: ' + saved.dataValues.uri));
  }

  await db.Article.find({where: {uri: article.uri}}).then(async result => {
    if (result) {
      savedArticle = result;
    } else {
      savedArticle = await formatted.save();
    }  
    if (event) {
      await event.addArticle(savedArticle);
    } else {
      console.log('This event is not yet saved: in buildSaveArticle ' + article.eventUri);
    }
   
    await source.addArticle(savedArticle);
  });
  return savedArticle;
};

//TODO: TEST THIS FUNCTION,

const associateArticlesNewEvent = async (eventUri) => {
  let event = await db.Event.find({where:{uri: eventUri}});
  let articles;

  if (event) {
    articles = await db.Article.findAll({where:{ eventUri: eventUri }});
    console.log(articles)

    for (const article of articles) {
      await event.addArticle(article);
      console.log('added article');
    }
  } else {
    console.log('this event is not in our system');
  }
};

const buildSaveEvent = async (event) => {
  const formatted = await formatEvent(event);

  return db.Event.find({where: {uri: event.uri}}).then(result => {
    if (result === null) {
      formatted.save().then(savedEvent => {
        //send this saved event info in a message through AWS queue to articles service
        console.log('event saved, sending to articles service');
        return savedEvent;
      }).catch(err => console.log(err));
    } else {
      console.log('This event already exists')
      return result;
     }
  }).catch(err => console.log(err));
};

const buildSaveSubcategory = ({ uri }) => {
  return db.Subcategory.findOrCreate({ where: { uri } })
    .spread((newSubcategory, created) => {
      if (created) {
        const name = newSubcategory.uri.split('/')[1];
        db.Category.findOne({ where: { name } })
          .then(category => category.addSubcategory(newSubcategory));
      }

      return newSubcategory;
    });
};

//helper function to save concept or category in DB
const buildSaveConcept = (concept) => {
  return db.Concept.findOrCreate({ where: { uri: concept.uri } })
    .spread((newConcept, created) => newConcept);
};

// save arrays of either concepts or categories and associate each one with the event
const associateEventConceptsOrSubcategories = async (conceptsOrSubcategories, type, eventUri) => {
  const event = await db.Event.find({where: { uri: eventUri }});

  if (event) {
    for (const item of conceptsOrSubcategories) {
      if (type === 'concept') {
        const saved = await buildSaveConcept(item);
        await event.addConcept(saved).catch(err => console.log(err));
      } else if (type === 'subcategory') {
        const saved = await buildSaveSubcategory(item);
        if (item.wgt > 50) {
          await event.addSubcategory(saved).catch(err => console.log(err));
        }       
      }
    }
    console.log(`Finished associating ${type} for event ${eventUri}`);
  } else {
    console.log('We encountered an error retrieving the event: ' + eventUri);
  }  
};
//TODO:  change lambda function to request concepts and categories
//TODO:  merge this function into the other one
// save arrays of either concepts or categories and associate each one with the event
const associateArticleConceptsOrSubcategories = async (conceptsOrSubcategories, type, articleUri) => {
  const article = await db.Article.find({where: { uri: articleUri }});

  if (article) {
    for (const item of conceptsOrSubcategories) {
      if (type === 'concept') {
        const saved = await buildSaveConcept(item);
        await article.addConcept(saved).catch(err => console.log(err));
      } else if (type === 'subcategory') {
        const saved = await buildSaveSubcategory(item);
        if (item.wgt > 50) {
          await article.addSubcategory(saved).catch(err => console.log(err));
        }       
      }
    }
    console.log(`Finished associating ${type} for event ${articleUri}`);
  } else {
    console.log('We encountered an error retrieving the event: ' + eventUri);
  }  
};

/* 
   ********************************************************************* 
   FETCHING DATA - functions that interact with our lambda microservices 
   ********************************************************************* 
*/

//get the uris for the events we care about across all news sources for the last 3 days COST: 35 tokens
const getUris = async() => {
  const response = await axios.get(eventUriLambda);
  console.log('uris fetched');
  return extractReleventEvents(response.data.data);  
};

//get detailed event info for any events we have not already saved COST: 10 tokens per 50 events
//after saving, checks whether there are any saved unassociated articles in our DB
const getEventInfo = async(uris) => {
  let unsaved = await findUnsavedEvents(uris);
  const response = await axios.post(eventInfoLamnda, { uris: unsaved });

  for (const event of response.data) {
    let current = await buildSaveEvent(event); 
    await associateEventConceptsOrSubcategories(event.concepts, 'concept', event.uri);
    await associateEventConceptsOrSubcategories(event.categories, 'subcategory', event.uri); 
    await associateArticlesNewEvent(event.uri);
  }
  console.log("events saved");
};

//get the articles associated with each event COST: 10 tokens per event
const getArticlesByEvent = async(uris) => {
  const response = await axios.post(articlesByEventLambda, { uris });
  for (const article of response.data.data) {
    await buildSaveArticle(article);  
  } 
  console.log('articles saved');
};

//get the articles published by the sources we care about on a particular day COST: 1 token per news source
const getArticlesBySource = async(daysAgo) => {
  const response = await axios.post(articlesBySourceLambda, { daysAgo });
  const { articles, uris } = response.data;

  for (const source in articles) {
    for (const article of articles[source]) {
      await buildSaveArticle(article);
    }
  }
  console.log('articles saved');
  return { articles, uris }
};

const findUnsavedEvents = async(uris) => {
  let unsaved = [];
  for (const uri of uris) {
    let event = await db.Event.find({where:{ uri }});

    if (!event) {
      unsaved.push(uri);
    }
  }
  console.log("unsaved events:", unsaved);
  return unsaved;
}

//once every 24 hours, hit all three lambda functions to get our data into the DB
//const ~75 tokens
const dailyFetch = async() => {
  const newlyRelevantEvents = [];
  //get the event uris that our sources have reported on over the last three days
  const uris = await getUris();

  //get detailed event info for the events that are relevant to us and have not yet been saved
  const eventInfo = await getEventInfo(uris);

  //get, format, save, associate the articles that were published by all our sources for the last 3 days COST: 21 tokens
  const articles3 = await getArticlesBySource(3);
  const articles2 = await getArticlesBySource(2);
  const articles1 = await getArticlesBySource(1);
   
  console.log('fetched!');
};

const relevanceCheck = async() => {

  //TODO: check to see if any previously unsaved events are now relevant


  //TODO: fetch additional event info for any newly relevant events
};

module.exports = {
  associateEventConceptsOrSubcategories,
  buildSaveConcept,
  buildSaveSubcategory,
  buildSaveEvent,
  formatSubcategory,
  formatConcept,
  formatEvent,
  formatArticle,
  extractReleventEvents,
  extractFormatSource,
  buildSaveArticle,
  calculateBias,
  dailyFetch,
  relevanceCheck,
  findUnsavedEvents,
};































