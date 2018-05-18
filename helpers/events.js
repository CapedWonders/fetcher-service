//axios
const axios = require('axios');

//db models
const db = require('../db/models/index.js');
const Op = require('../db/models/index.js').Sequelize.Op;

//lodash
const _ = require('lodash');

//moment
const moment = require('moment');

//lambda uris
const { eventUriLambda, eventInfoLambda, articlesBySourceLambda, articlesByEventLambda } = process.env;

/* 
   ********************************************************************* 
   PROCESSING EVENTS - functions that determine which data we care about 
   ********************************************************************* 
*/

//helper
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

const getUnassociatedArticlesBySource = async(daysAgo) => {
  const sourcesObj = {};
  const from = new Date(new Date() - (24*daysAgo) * 60 * 60 * 1000);
  
  const allSources = {
    fox: 'foxnews.com',
    breitbart: 'breitbart.com',
    hill: 'thehill.com',
    ap: 'hosted.ap.org',
    times: 'nytimes.com',
    msnbc: 'msnbc.com',
    huffington: 'huffingtonpost.com',    
    motherjones: 'motherjones.com',
    npr: 'npr.org',
    washingtontimes: 'washingtontimesreporter.com',
    guardian: 'theguardian.com',
    latimes: 'latimes.com',
    federalist: 'thefederalist.com',
    blaze: 'theblaze.com',
    wnd: 'wnd.com'
  };
  const sourceUris = Object.values(allSources);
  
  const sources = await db.Source.findAll({
    where: {
      uri: sourceUris,
    },
    include: [{
      model: db.Article,
      where: { 
        eventId: null,
        createdAt: {
          [Op.lt]: new Date(),
          [Op.gt]: from
        }
      },
      required: false
    }],
  });

  for (const source of sources) {
    let currentSource = getKeyByValue(allSources, source.dataValues.uri);
    sourcesObj[currentSource] = [];

    for (const article of source.dataValues.Articles) {      
      sourcesObj[currentSource].push(article.dataValues.eventUri);  
    }    
  }

  return sourcesObj;
};

//get the uris that are shared between news outlets
//TODO:  test new lambda URI function, save results, update test for extractReleventEvents
const extractReleventEvents = (urisObj) => {
  /***********
  far right
  ***********/
  let wnd = new Set(urisObj.wnd);
  let breitbart = new Set(urisObj.breitbart);
  let blaze = new Set(urisObj.blaze);

  //all far right outlets have reported
  let farRightAll = new Set([...breitbart].filter(x => wnd.has(x) && blaze.has(x)));
  //at least one outlet has reported
  let farRightAny = new Set([...wnd, ...breitbart, ...blaze]);

  /***********
     right
  ***********/
  let fox = new Set(urisObj.fox);
  let federalist = new Set(urisObj.federalist);
  let washingtontimes = new Set(urisObj.washingtontimes);

  //all right outlets have reported
  let rightAll = new Set([...fox].filter(x => federalist.has(x) && washingtontimes.has(x)));
  //at least one outlet has reported
  let rightAny = new Set([...fox, ...federalist, ...washingtontimes]);

  /***********
     center
  ***********/
  let ap = new Set(urisObj.ap);
  let npr = new Set(urisObj.npr);
  let hill = new Set(urisObj.hill);

  //all outlets have reported
  let centerAll = new Set([...ap].filter(x => hill.has(x) && npr.has(x)));
  //at least one outlet has reported
  let centerAny = new Set([...ap, ...npr, ...hill]);


  /***********
     left
  ***********/
  let times = new Set(urisObj.times);
  let guardian = new Set(urisObj.guardian);
  let latimes = new Set(urisObj.latimes);

  //all outlets have reported
  let leftAll = new Set([...times].filter(x => guardian.has(x) && latimes.has(x)));
  //at least one outlet has reported
  let leftAny = new Set([...times, ...guardian, ...latimes]);

 
  /***********
     far left
  ***********/
  let huffington = new Set(urisObj.huffington);
  let msnbc = new Set(urisObj.msnbc);
  let motherjones = new Set(urisObj.motherjones);
  //both outlets have reported
  let farLeftAll = new Set([...huffington].filter(x => msnbc.has(x) && motherjones.has(x)));
  //at least one outlet has reported
  let farLeftAny = new Set([...huffington, ...msnbc, ...motherjones]);


  //at least one of left, right and center have reported
  let rightAndFarRight = new Set([...rightAny, ...farRightAny]);
  let leftAndFarLeft = new Set([...leftAny, ...farLeftAny]);
  let spectrumSet = new Set([...rightAndFarRight].filter(x => leftAndFarLeft.has(x) && centerAny.has(x)));
  let spectrumArray = [...spectrumSet];
  
  return spectrumArray;
};

//check to see if any previously unsaved events are now relevant
const relevanceCheck = async(daysAgo) => { 
  const sources = await getUnassociatedArticlesBySource(daysAgo);
  const relevant = extractReleventEvents(sources);
  return relevant;
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

/* 
   ********************************************************************* 
   FORMTTING & SAVING - functions that store data in our DB
   ********************************************************************* 

*/

//format instances to conform to DB models
const formatEvent = (event) => {
  if (event && event.uri) {
    return db.Event.build({
      uri: event.uri,
      date: moment(event.eventDate, "YYYY-MM-DD"),
      title: event.title.eng || event.title || "",
      summary: event.summary.eng || event.summary || ""
    });
  } else {
    return null
  }
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
    date: moment(article.date, "YYYY-MM-DD"),
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
    bias: calculateBias(article.source.uri)
  });
};

// a value between -2 and +2 for easy ranking 
const calculateBias = (sourceUri) => {
  console.log(sourceUri)
  let biasRating = null;
  const sourcesBias = {
    "-2": ['huffingtonpost.com', 'msnbc.com', 'motherjones.com'],
    "-1": ['nytimes.com', 'theguardian.com', 'latimes.com'],
    "0": ['thehill.com', 'hosted.ap.org', 'npr.org'],
    "1": ['foxnews.com', 'thefederalist.com', 'washingtontimesreporter.com'],
    "2": ['breitbart.com', 'wnd.com', 'theblaze.com']
  }

  for (const rating in sourcesBias) {
    if (sourcesBias[rating].includes(sourceUri)) {
      biasRating = parseInt(rating);
    }
  }

  return biasRating;
};

const updateBiasRating = async(sourceUri, biasRating) => {
  let updateValues = { bias: calculateBias(sourceUri) };
  let source = await db.Source.find({where:{uri: sourceUri}});

  source.update(updateValues).then((updated) => {
    console.log(`updated ${updated.dataValues.uri} to have the bias of ${biasRating}`);
  });
   
  console.log(`Bias added to source ${sourceUri}`);   
};

//saving and associating new articles, events, sources, concepts and categories
const buildSaveArticle = async (article) => {
  //if this article has not been assigned by ER to an event yet, ignore it for now
  if (article.eventUri === null) {
    console.log("this article has no associated event");
    return;
  }

  let alreadySaved = await db.Article.find({where: {uri: article.uri}});
  let event = await db.Event.find({where:{uri: article.eventUri}});

  //if this article isn't already in our system, save it and make sure it's associated to the proper source
  if (!alreadySaved) {
    let formatted = await formatArticle(article);   
    let source = await db.Source.find({where: {uri: article.source.uri}});

    if (!source) {
      source = extractFormatSource(article);
      let savedSource = await source.save();
      console.log(`Saved source ${savedSource.dataValues.uri}`);
    }

    alreadySaved = await formatted.save();
    console.log(`saved article ${article.uri}`);
    await source.addArticle(alreadySaved);

    //if it isn't already associated with a saved event, make it so
    if (event && article.eventId === null) {
      await event.addArticle(alreadySaved);
      console.log(`Article added to event ${event.dataValues.uri}`);
    }
    return { article: alreadySaved, new: true};
  }

  //if we have the associated event in the DB, make sure it's added to the correct event
  if (event && article.eventId === null) {
    await event.addArticle(alreadySaved);
    console.log(`Article added to event ${event.dataValues.uri}`);
  }
  return {article: alreadySaved, new: false};
};

//TODO: TEST THIS FUNCTION,

const associateArticlesNewEvent = async (eventUri) => {
  let event = await db.Event.find({where:{uri: eventUri}});
  let articles;

  if (event) {
    articles = await db.Article.findAll({where:{ eventUri: eventUri }});
   
    for (const article of articles) {
      await event.addArticle(article);
      console.log(`added article ${article.id} to event ${eventUri}`);
    }
    console.log(`articles saved for event ${eventUri}`)
  } else {
    console.log('this event is not in our system');
  }
};

const buildSaveEvent = async (event) => {
  if (!event.uri) {
    return null;
  }

  const formatted = await formatEvent(event);
  const saved = await db.Event.find({where: {uri: event.uri}});

  if (saved) {
    console.log(`Event ${event.uri} already exists`);
    return saved;
  } else {
    const newEvent = await formatted.save();
    console.log(`New event saved ${newEvent.dataValues.uri}`);
    return newEvent;
  }
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
        await article.addSubcategory(saved).catch(err => console.log(err));             
      }
    }
    console.log(`Finished associating ${type} for article ${articleUri}`);
  } else {
    console.log('We encountered an error retrieving the article: ' + articleUri);
  }  
};

/* 
   ********************************************************************* 
   FETCHING DATA - functions that interact with our lambda microservices 
   ********************************************************************* 
*/

//get the uris for the events we care about across all news sources for the last 3 days COST: 60 tokens
const getUris = async() => {
  const response = await axios.get(eventUriLambda);
  console.log('uris fetched');
  return extractReleventEvents(response.data.data);  
};

//get detailed event info for any events we have not already saved COST: 10 tokens per 50 events
//after saving, checks whether there are any saved unassociated articles in our DB
const getEventInfo = async(uris) => {
  let unsaved = await findUnsavedEvents(uris);
  if (unsaved.length > 0) {
    const response = await axios.post(eventInfoLambda, { uris: unsaved });

    for (const event of response.data) {
      let current = await buildSaveEvent(event); 
      await associateEventConceptsOrSubcategories(event.concepts, 'concept', event.uri);
      await associateEventConceptsOrSubcategories(event.categories, 'subcategory', event.uri); 
      await associateArticlesNewEvent(event.uri);
    }
    console.log("events saved");
  } else {
    console.log('There are no new events to fetch');
  }  
};

//get the articles associated with each event COST: 10 tokens per event
const getArticlesByEvent = async(uris) => {
  const response = await axios.post(articlesByEventLambda, { uris });
  for (const article of response.data.data) {
    await buildSaveArticle(article);  
  } 
  console.log('articles saved');
};

//get the articles published by the sources we care about on a particular day COST: 1 token per news source (15 tokens per call)
const getArticlesBySource = async(daysAgo) => {
  const response = await axios.post(articlesBySourceLambda, { daysAgo });
  const { articles, uris } = response.data;

  for (const source in articles) {
    for (const article of articles[source]) {
      //ignore if it has not yet been associated by Event Registry to an event
      if (article.eventUri) {
        const saved = await buildSaveArticle(article);
        //only associate concepts and categories if we have not done so before
        if (saved.new) {
          await associateArticleConceptsOrSubcategories(article.concepts, 'concept', article.uri);
          await associateArticleConceptsOrSubcategories(article.categories, 'subcategory', article.uri);
        }    
      }      
    }
  }
  console.log('articles saved');
  return { articles, uris }
};

//once every 24 hours, hit all three lambda functions to get our data into the DB
//costs ~125 tokens
const dailyFetch = async() => {
  //get the event uris for events that the left right and center have reported on in the last three days
  const uris = await getUris();

  //get detailed event info for the events that are relevant to us and have not yet been saved
  const eventInfo = await getEventInfo(uris);

  //get, format, save, associate the articles that were published by all our sources for the last 3 days COST: 21 tokens
  const articles3 = await getArticlesBySource(3);
  console.log("THREE DAYS AGO ARTICLES FETCHED!");
  const articles2 = await getArticlesBySource(2);
  console.log("TWO DAYS AGO ARTICLES FETCHED!");
  const articles1 = await getArticlesBySource(1);
  console.log("ONE DAY AGO ARTICLES FETCHED!");
  console.log('fetched!');
  db.sequelize.close();
};

//fetch additional event info for any newly relevant events from the last 3 days
//cost ~20 tokens
const fetchNewlyRelevant = async(daysAgo) => {
  const newlyRelevant = await relevanceCheck(daysAgo);
  await getEventInfo(newlyRelevant);
  console.log('newly relevant events fetched');
  db.sequelize.close();
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
  associateArticlesNewEvent,
  associateArticleConceptsOrSubcategories,
  getUnassociatedArticlesBySource,
  fetchNewlyRelevant,
  calculateBias
};
































