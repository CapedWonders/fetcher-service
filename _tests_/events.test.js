//fake data lambda1=eventUris, lambda2=events, lambda3=articles by event, lambda4=articles by source
const { sampleArticleAnalysis, lambda1, lambda2, lambda3, 
        lambda4, articleWithConcepts, sampleEvent, lambda1All } = require('./sampleData.js');

//db models
const db = require('../db/models/index.js');

const { associateEventConceptsOrSubcategories, buildSaveConcept, buildSaveSubcategory, buildSaveEvent, formatSubcategory,
  formatConcept, formatEvent, formatArticle, extractReleventEvents, buildSaveArticle, extractFormatSource, associateArticlesNewEvent,
  associateArticleConceptsOrSubcategories, getUnassociatedArticlesBySource, calculateBias,  formatSentiment,
  buildSaveSentiment } = require('../helpers/events.js');
if (process.env.db_name === "eco_chamber") {
  throw error
}

afterAll(() => db.sequelize.close());

describe('formatEvent', function() {
  it('should return an instance of sequelize event model', function(done) {
    let result = formatEvent(lambda2[0]);
   
    expect(result).toBeInstanceOf(db.Event);
    expect(result._options.isNewRecord).toBe(true);
    expect(result.dataValues).toBeTruthy();
    done();
  });

  it('should have a uri category', function(done) {
    let result = formatEvent(lambda2[1]);
    
    expect(result.dataValues).toHaveProperty('uri');
    expect(typeof result.dataValues.uri).toBe('string');
    expect(result.dataValues.uri).toBeTruthy();
    done();
  });

  it('should have a title', function(done) {
    let result = formatEvent(lambda2[2]);

    expect(result.dataValues).toHaveProperty('title');
    expect(typeof result.dataValues.title).toBe('string');
    done();
  });

  it('should ignore unnecessary data returned from Event Registry', function(done) {
    let result = formatEvent(lambda2[3]);

    expect(result).not.toHaveProperty('location');
    expect(result).not.toHaveProperty('categories');
    expect(result).not.toHaveProperty('wgt');
    done();
  });

  it('should only format events that have english titles and summaries', function(done) {
    let sampleEvent1 = {
      uri: 'eng-laskjf;ldsjkf',
      eventDate: "2018-05-03",
      title: {fra: 'lkjlkj'},
      summary: {fra: 'lkjlkj', eng: "lkjljk"}
    };

    let sampleEvent2 = {
      uri: 'eng-laskjf;ldsjkf',
      eventDate: "2018-05-03",
      title: {fra: 'lkjlkj', eng: "lkjljk"},
      summary: {fra: 'lkjlkj'}
    };

    let result1 = formatEvent(sampleEvent1);
    let result2 = formatEvent(sampleEvent2);

    expect(result1).not.toBeTruthy();
    expect(result2).not.toBeTruthy();
    done();
  });
});

describe('formatConcept', function() {
  it('should return an instance of sequelize concept model', function(done) {
    let result = formatConcept(lambda2[0].concepts[0]);

    expect(result).toBeInstanceOf(db.Concept);
    expect(result._options.isNewRecord).toBe(true);
    expect(result.dataValues).toBeTruthy();
    done();
  });

  it('should have a uri category', function(done) {
    let result = formatConcept(lambda2[0].concepts[1]);

    expect(result.dataValues).toHaveProperty('uri');
    expect(typeof result.dataValues.uri).toBe('string');
    expect(result.dataValues.uri).toBeTruthy();
    done();
  });
});

describe('formatSubcategory', function() {

  beforeEach(() => { 
    return db.clearDB();
  });

  it.only('should return an instance of sequelize subcategory model', function(done) {
    let result = formatSubcategory(lambda2[0].categories[0]);

    expect(result).toBeInstanceOf(db.Subcategory);
    expect(result._options.isNewRecord).toBe(true);
    expect(result.dataValues).toBeTruthy();
    done();
  });

  it('should have a uri category', function(done) {
    let result = formatSubcategory(lambda2[0].categories[1]);

    expect(result.dataValues).toHaveProperty('uri');
    expect(typeof result.dataValues.uri).toBe('string');
    expect(result.dataValues.uri).toBeTruthy();
    expect(result.dataValues.uri).toContain('dmoz');
    done();
  });

  it('should relate to a higher level Category from the dmoz system', async function(done) {
    let result = formatSubcategory(lambda2[0].categories[2]);
    let base = result.dataValues.uri.split('/')[1];
    let category = await db.Category.find({where: {name: base}});
  
    expect(category.dataValues.name).not.toContain('dmoz');
    expect(base).toEqual(category.dataValues.name);
    done();
  });
});

describe('formatSentiment', function() {
  it('should return an instance of sequelize sentiment model', function(done) {
    let title = sampleArticleAnalysis.titleAnalysis;
    let result = formatSentiment(title);

    expect(result).toBeInstanceOf(db.Sentiment);
    expect(result._options.isNewRecord).toBe(true);
    expect(result.dataValues).toBeTruthy();
    done();
  });

  it('should know whether it is a title or a body', function(done) {
    let title = sampleArticleAnalysis.titleAnalysis;
    let body = sampleArticleAnalysis.bodyAnalysis;
    let result1 = formatSentiment(title, 'title');
    let result2 = formatSentiment(body, 'body');

    expect(result1.dataValues).toHaveProperty('title');
    expect(result1.dataValues.title).toBeTruthy();
    expect(result1.dataValues.body).not.toBeTruthy();

    expect(result2.dataValues).toHaveProperty('body');
    expect(result2.dataValues.body).toBeTruthy();
    expect(result2.dataValues.title).not.toBeTruthy();
  
    done();
  });

  it('should have a sentiment score and label', function(done) {
    let title = sampleArticleAnalysis.titleAnalysis;
    let body = sampleArticleAnalysis.bodyAnalysis;
    let result = formatSentiment(title, 'title');
    let result2 = formatSentiment(body, 'body');

    expect(result.dataValues).toHaveProperty('sentiment');
    expect(result2.dataValues).toHaveProperty('sentiment');
    expect(result.dataValues.sentiment).toBeTruthy();
    expect(result2.dataValues.sentiment).toBeTruthy();
    expect(result.dataValues).toHaveProperty('label');
    expect(result2.dataValues).toHaveProperty('label');
    expect(typeof result.dataValues.label).toBe('string');
    expect(typeof result2.dataValues.label).toBe('string');
    expect(result.dataValues.label).toBe('negative');
    expect(result2.dataValues.label).toBe('negative');
   
    done();
  });

  it('should have emotion properties', function(done) {
    let title = sampleArticleAnalysis.titleAnalysis;
    let body = sampleArticleAnalysis.bodyAnalysis;
    let result = formatSentiment(title, 'title');
    let result2 = formatSentiment(body, 'body');

    expect(result.dataValues).toHaveProperty('joy');
    expect(result.dataValues).toHaveProperty('fear');
    expect(result.dataValues).toHaveProperty('anger');
    expect(result.dataValues).toHaveProperty('disgust');
    expect(result.dataValues).toHaveProperty('sadness');
    expect(result2.dataValues).toHaveProperty('joy');
    expect(result2.dataValues).toHaveProperty('fear');
    expect(result2.dataValues).toHaveProperty('anger');
    expect(result2.dataValues).toHaveProperty('disgust');
    expect(result2.dataValues).toHaveProperty('sadness');
    
    expect(result.dataValues.joy).toBeTruthy();
    expect(result2.dataValues.joy).toBeTruthy();
   
    done();
  });

  it('should format an event only on positive watson call', function(done) {
    let badAnalysis = {
      titleAnalysis: null,
      bodyAnalysis: null
    };

    let result1 = formatSentiment(badAnalysis.titleAnalysis, 'title');
    let result2 = formatSentiment(badAnalysis.bodyAnalysis, 'body');

    expect(result1).not.toBeTruthy();
    expect(result2).not.toBeTruthy();
    done();
  }); 
});

describe('buildSaveSentiment', function() {
  beforeEach(() => {
    return db.clearDB();
  });

  it('should save a formatted Sentiment if it does not exist in DB', async function(done) {
    expect.assertions(3);

    const test = sampleArticleAnalysis.titleAnalysis;
    const before = await db.Sentiment.findAll({where: {}});
    expect(before.length).toEqual(0);

    await buildSaveSentiment(test);

    const after = await db.Sentiment.find({});
    expect(after).toBeTruthy();
    expect(after.dataValues.sentiment).toEqual(test.sentiment.document.score);
    done();
  });

  it('should not yet associate to events or articles', async function(done) {
    expect.assertions(1);

    const test = sampleArticleAnalysis.titleAnalysis;
    const saved = await buildSaveSentiment(test, 'title');
  
    const testArticle = articleWithConcepts;
    const savedArticle = await buildSaveArticle(testArticle);   
    const sentiments = await savedArticle.article.getSentiments();
    expect(sentiments.length).toBe(0);
    done();
  });

  it('shoud not save a bad watson call', async function(done) {
    expect.assertions(2);
    
    let badAnalysis = {
      titleAnalysis: null,
      bodyAnalysis: null
    };

    const test1 = await buildSaveSentiment(badAnalysis.titleAnalysis, 'title');
    const test2 = await buildSaveSentiment(badAnalysis.bodyAnalysis, 'body');

    expect(test1).not.toBeTruthy();
    expect(test2).not.toBeTruthy();
    done();

  });
});

describe('buildSaveConcept', function() {
  beforeEach(() => {
    return db.clearDB();
  });

  it('should save a formatted concept if it does not exist in DB', async function(done) {
    expect.assertions(3);

    const test = lambda2[4].concepts[0];
    const before = await db.Concept.findAll({where: {}});
    expect(before.length).toEqual(0);

    await buildSaveConcept(test);

    const after = await db.Concept.find({where:{uri: test.uri}});
    expect(after).toBeTruthy();
    expect(after.dataValues.uri).toEqual(test.uri);
    done();
  });

  it('should save concepts whose uri contains nonenglish chars', async function(done) {
    expect.assertions(4)

    const test = {uri:'test ćoncept'};
    const saved = await buildSaveConcept(test);
    expect(saved).toBeTruthy();

    const found = await db.Concept.find({where: {uri: test.uri}});
    expect(found).toBeTruthy();
    expect(found.dataValues.uri).toEqual(test.uri);
    expect(found.dataValues.uri).toContain('ć');
    done();
  });
});



describe('buildSaveEvent', function() {
  beforeEach(() => {
    // Clears the database 
    // Jest will wait for this promise to resolve before running tests.
    return db.clearDB();
  });

  it('should save a formatted event if it doesn\'t already exist in the database', async function(done) {
    expect.assertions(4);

    const before = await db.Event.find({where:{uri:lambda2[0].uri}});
    expect(before).not.toBeTruthy();

    await buildSaveEvent(lambda2[0]);
    
    const after = await db.Event.find({where:{}});
    expect(after).toBeTruthy();
    expect(after.dataValues.uri).toEqual(lambda2[0].uri);
    expect(after._options.isNewRecord).toBe(false);
    done();
  });

  it('should retrieve a matching event if it is already in the database', async function(done) {
    expect.assertions(3);
    let id;

    const before = await db.Event.find({where:{}});
    expect(before).not.toBeTruthy();
    
    await buildSaveEvent(lambda2[4]);
   
    await db.Event.find({where:{}}).then(event => {
      expect(event).toBeTruthy();
      id = event.id;
    });  
    
    const buildSaveAfterCreate = await buildSaveEvent(lambda2[4]);
    expect(buildSaveAfterCreate.dataValues.id).toEqual(id);
    done();
  });

  it('should not save the event if event has no uri', async function(done) {
    expect.assertions(2);

    const badEvent = {
      title: 'bad event',
      summary: 'fail fail all the live long day'
    };

    const event= await buildSaveEvent(badEvent);
    expect(event).not.toBeTruthy();

    const allEvent = await db.Event.findAll({});
    expect(allEvent.length).toEqual(0);

    done();
  });

  it('should not save the event if event has no english title or summary', async function(done) {
    expect.assertions(3);

    const badEvent = {
      title: {eng: 'bad event'},
      summary: {fra:'fail fail all the live long day'}
    };

    const badEvent2 = {
      title: {fra: 'another bad event'},
      summary: {eng:'fail fail all the live long day'}
    };

    const event= await buildSaveEvent(badEvent);
    const event2= await buildSaveEvent(badEvent);
    expect(event).not.toBeTruthy();
    expect(event2).not.toBeTruthy();

    const allEvent = await db.Event.findAll({});
    expect(allEvent.length).toEqual(0);

    done();
  });
});

describe('buildSaveSubcategory', function() {
  beforeEach(() => {
    return db.clearDB().then(async() => await buildSaveEvent(lambda2[9]));
  });

  it('should save a subcategory if it is not already in the db', async function(done) {
    expect.assertions(4);

    const testCategories = lambda2[9].categories;
    const before = await db.Subcategory.find({where:{}});
    expect(before).not.toBeTruthy();

    await buildSaveSubcategory(testCategories[0]);
    
    const after = await db.Subcategory.find({where:{}});
    expect(after).toBeTruthy();
    expect(after.dataValues.uri).toEqual(testCategories[0].uri);
    expect(after._options.isNewRecord).toBe(false);
    done();
  });

  it('should retrieve a subcategory if it is already in the db', async function(done) {
    expect.assertions(3);
    const testCategories = lambda2[9].categories;
    let id;

    const before = await db.Subcategory.find({where:{}});
    expect(before).not.toBeTruthy();
    
    await buildSaveSubcategory(testCategories[0]);
   
    await db.Subcategory.find({where:{}}).then(x => {
      expect(x).toBeTruthy();
      id = x.id;
    });  
    
    const buildSaveAfterCreate = await buildSaveSubcategory(testCategories[0]);
    expect(buildSaveAfterCreate.dataValues.id).toEqual(id);
    done();
  });

  it('should associate each subcategory with its higher level dmoz Category', async function(done) {
    expect.assertions(4);
    const testCategories = lambda2[9].categories;

    const saved = await buildSaveSubcategory(testCategories[0]);
    const name = saved.dataValues.uri.split('/')[1];

    const category = await db.Category.find({where:{name}});
    const sub = await db.Subcategory.find({where:{uri:testCategories[0].uri}});
    expect(category).toBeTruthy();
    expect(sub).toBeTruthy();
    
    const subs = await category.getSubcategories();
    expect(subs.length).toBe(1);
    expect(subs[0].dataValues.uri).toEqual(saved.dataValues.uri);   
    done();
  });
});

describe('associateEventConceptsOrSubcategories', function() {
  beforeEach(async() => {
    return db.clearDB().then(async() => {
      const testEvent = lambda2[6];
      await buildSaveEvent(testEvent);
    }); 
  });

  it('should save all concepts associated with the input event', async function(done) {
    expect.assertions(4);

    const testEvent = lambda2[6]; 
    await db.Event.findAll({where:{}}).then(result => {
      expect(result.length).toBe(1);
    });

    await db.Concept.findAll({where:{}}).then(result => {
      expect(result.length).toBe(0);
    });

    await associateEventConceptsOrSubcategories(testEvent.concepts, 'concept', testEvent.uri);

    await db.Concept.findAll({where:{}}).then(result => {
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toEqual(testEvent.concepts.length);
    })

    done();
  });

  it('should associate all concepts through EventConcept table', async function(done) {
    expect.assertions(3);

    const testConcepts = lambda2[6].concepts;

    const event = await db.Event.find({where:{}});
    const concepts = await event.getConcepts();
    expect(concepts.length).toBe(0);

    await associateEventConceptsOrSubcategories(testConcepts, 'concept', lambda2[6].uri);

    const savedConcepts = await event.getConcepts();
    expect(savedConcepts.length).toBeGreaterThan(0);
    expect(savedConcepts.length).toEqual(testConcepts.length);
    done();
  });

  it('should save all subcategories associated with the input event', async function(done) {
    expect.assertions(4);

    const testEvent = lambda2[6]; 
    await db.Event.findAll({where:{}}).then(result => {
      expect(result.length).toBe(1);
    });
    await db.Subcategory.findAll({where:{}}).then(result => {
      expect(result.length).toBe(0);
    });
    await associateEventConceptsOrSubcategories(testEvent.categories, 'subcategory', testEvent.uri);
    await db.Subcategory.findAll({where:{}}).then(result => {
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toEqual(testEvent.categories.length);
    });
    done();
  });

  it('should associate all subcategories greater than weight 50 through EventSubcategory table', async function(done) {
    expect.assertions(3);

    const testCategories = lambda2[6].categories;
    const weighted = testCategories.filter(x => x.wgt > 50);
    const rejects = testCategories.filter(x => x.wgt <= 50);

    const event = await db.Event.find({where:{}});
    const subcategories = await event.getSubcategories();
    expect(subcategories.length).toBe(0);

    await associateEventConceptsOrSubcategories(testCategories, 'subcategory', lambda2[6].uri);

    const savedSubcategories = await event.getSubcategories();

    expect(savedSubcategories.length).toBeGreaterThan(0);
    expect(savedSubcategories.length).toEqual(weighted.length);
    done();
  });

  it('should associate all concepts when multiple events are added', async function(done) {
    expect.assertions(4);

    const testConcepts1 = lambda2[6].concepts;
    const event1 = await db.Event.find({where:{}});
    const event2 = lambda2[7];
    const testConcepts2 = lambda2[7].concepts;

    await associateEventConceptsOrSubcategories(testConcepts1, 'concept', lambda2[6].uri);

    const savedConcepts1 = await event1.getConcepts();
    expect(savedConcepts1.length).toBeGreaterThan(0);
    expect(savedConcepts1.length).toEqual(testConcepts1.length)

    const savedEvent2 = await buildSaveEvent(event2);

    await associateEventConceptsOrSubcategories(testConcepts2, 'concept', lambda2[7].uri);

    const savedConcepts2 = await savedEvent2.getConcepts();
    expect(savedConcepts2.length).toBeGreaterThan(0);
    expect(savedConcepts2.length).toEqual(testConcepts2.length)
    done();
  });
});
//TODO, fix this test after changing lambda
describe('associateArticleConceptsOrSubcategories', function() {
  beforeEach(async() => {
    await db.clearDB();
    const testArticle = articleWithConcepts;
    const saved = await buildSaveArticle(testArticle);
  });

  it('should save all concepts associated with the input article', async function(done) {
    expect.assertions(4);

    const testArticle = articleWithConcepts; 
    const found = await db.Article.findAll({where:{}});
    expect(found.length).toBe(1);
    const conceptsBefore = await db.Concept.findAll({where:{}});
    expect(conceptsBefore.length).toBe(0)

    await associateArticleConceptsOrSubcategories(testArticle.concepts, 'concept', testArticle.uri);
    const conceptsAfter = await db.Concept.findAll({where:{}});
    expect(conceptsAfter.length).toBeGreaterThan(0);
    expect(conceptsAfter.length).toEqual(testArticle.concepts.length);

    done();
  });

  it('should associate all concepts through ArticleConcept table', async function(done) {
    expect.assertions(3);

    const article = articleWithConcepts;
    const testConcepts = article.concepts;
    const found = await db.Article.find({where:{}});
    const concepts = await found.getConcepts();
    expect(concepts.length).toBe(0);

    await associateArticleConceptsOrSubcategories(testConcepts, 'concept', article.uri);

    const savedConcepts = await found.getConcepts();
    expect(savedConcepts.length).toBeGreaterThan(0);
    expect(savedConcepts.length).toEqual(testConcepts.length);
    done();
  });

  it('should save all subcategories associated with the input event', async function(done) {
    expect.assertions(3);

    const testArticle = articleWithConcepts; 
    const found = await db.Article.find({where:{uri: testArticle.uri}});
    const before = await db.Subcategory.findAll({where:{}});
    expect(before.length).toBe(0);
    
    await associateArticleConceptsOrSubcategories(testArticle.categories, 'subcategory', testArticle.uri);
    const after = await db.Subcategory.findAll({where:{}});
    expect(after.length).toBeGreaterThan(0);
    expect(after.length).toEqual(testArticle.categories.length)
   
    done();
  });
});

describe('extractReleventEvents', function() {

  it('given an object of uris by news source, should return an array of uris related to the policital spectrum', function(done) { 
  
    const uris = extractReleventEvents(lambda1All.data);
    expect(Array.isArray(uris)).toBe(true);
    expect(uris.length).toBeGreaterThan(0);
    done();
  });

  it('should return events that have been reported on by right, middle and center', function(done) {
    const uris = extractReleventEvents(lambda1All);
    
    const right = lambda1All.data.breitbart.concat(lambda1All.data.blaze).concat(lambda1All.data.wnd)
                  .concat(lambda1All.data.fox).concat(lambda1All.data.washingtontimes).concat(lambda1All.data.federalist);

    const left = lambda1All.data.huffington.concat(lambda1All.data.times).concat(lambda1All.data.guardian).concat(lambda1All.data.latimes)
                 .concat(lambda1All.data.huffington).concat(lambda1All.data.msnbc).concat(lambda1All.data.motherjones);

    const center = lambda1All.data.ap.concat(lambda1All.data.hill).concat(lambda1All.data.npr);

    for (const uri of uris) {
      expect(right).toContain(uri);
      expect(left).toContain(uri);
      expect(center).toContain(uri);
    }
    done();
  });
});

describe('formatArticle', function() {
  it('should return an instance of sequelize article model', function(done) {
    const article = lambda4.articles.fox[0];  
    let result = formatArticle(article);
  
    expect(result).toBeInstanceOf(db.Article);
    expect(result._options.isNewRecord).toBe(true);
    expect(result.dataValues).toBeTruthy();
    done();
  });

  it('should have a uri category', function(done) {
    let result = formatArticle(lambda4.articles.fox[0]);
    
    expect(result.dataValues).toHaveProperty('uri');
    expect(typeof result.dataValues.uri).toBe('string');
    expect(result.dataValues.uri).toBeTruthy();
    done();
  });

  it('should have a title', function(done) {
    let result = formatArticle(lambda4.articles.fox[0]);

    expect(result.dataValues).toHaveProperty('title');
    expect(typeof result.dataValues.title).toBe('string');
    done();
  });

  it('should have a body', function(done) {
    let result = formatArticle(lambda4.articles.fox[0]);

    expect(result.dataValues).toHaveProperty('body');
    expect(typeof result.dataValues.body).toBe('string');
    done();
  });

  it('should ignore unnecessary data returned from Event Registry', function(done) {    
    let result = formatArticle(lambda4.articles.fox[0]);

    expect(result).not.toHaveProperty('lang');
    expect(result).not.toHaveProperty('isDuplicate');
    expect(result).not.toHaveProperty('source');
    done();
  });
});

describe('extractFormatSource', function() {
  it('should return an instance of sequelize source model', function(done) {
    const article = lambda4.articles.fox[0];  
    const source = article.source;
    let result = extractFormatSource(article);
  
    expect(result).toBeInstanceOf(db.Source);
    expect(result._options.isNewRecord).toBe(true);
    expect(result.dataValues).toBeTruthy();
    done();
  });

  it('should have a uri category', function(done) {
    const article = lambda4.articles.fox[0];  
    const source = article.source;
    let result = extractFormatSource(article);
    
    expect(result.dataValues).toHaveProperty('uri');
    expect(typeof result.dataValues.uri).toBe('string');
    expect(result.dataValues.uri).toBeTruthy();
    done();
  });

  it('should have a title', function(done) {
    const article = lambda4.articles.fox[0];  
    const source = article.source;
    let result = extractFormatSource(article);

    expect(result.dataValues).toHaveProperty('title');
    expect(typeof result.dataValues.title).toBe('string');
    done();
  });

  it('should ignore unnecessary data returned from Event Registry', function(done) {   
    const article = lambda4.articles.fox[0];  
    const source = article.source;
    let result = extractFormatSource(article); 
    expect(result.id).not.toEqual(source.id);
    done();
  });
});

describe('buildASaveArticle', function() {
  beforeEach(() => {
    return db.clearDB().then(async() => await buildSaveEvent(lambda2[1]));
  });

  it('should save a formatted article if it does not exist in DB', async function(done) {
    expect.assertions(3);

    const test = lambda4.articles.fox[0];
    const before = await db.Article.findAll({where: {}});
    expect(before.length).toEqual(0);

    const saved = await buildSaveArticle(test);
    const after = await db.Article.find({where:{uri: test.uri}});
  
    expect(after).toBeTruthy();
    expect(after.dataValues.uri).toEqual(saved.article.dataValues.uri);
    done();
  });

  it('should not save an event if the eventURI is null', async function(done) {
    expect.assertions(2);

    const test = lambda4.articles.fox[1];
    const before = await db.Article.findAll({where: {}});
    expect(before.length).toEqual(0);
    console.log(test.uri)

    const saved = await buildSaveArticle(test);
    const after = await db.Article.find({where:{uri: test.uri}});
  
    expect(after).not.toBeTruthy();
    done();
  });

  it('should retrive an article if it does exist in the DB', async function(done) {
    expect.assertions(5);

    const test = lambda4.articles.fox[0];
    const before = await db.Article.findAll({where: {}});
    expect(before.length).toEqual(0);

    const saved = await buildSaveArticle(test);
    const after1 = await db.Article.findAll({where:{}});
    const savedAgain = await buildSaveArticle(test);
    const after2 = await db.Article.findAll({where:{}});

    expect(after1.length).toBeGreaterThan(0);
    expect(after2.length).toBeGreaterThan(0);
    expect(savedAgain.article.dataValues.uri).toEqual(savedAgain.article.dataValues.uri);
    expect(after2.length).toEqual(after1.length);
    done();
  });

  it('should return whether or not an article is already saved in the DB', async function(done) {
    expect.assertions(4);

    const test = lambda4.articles.fox[0];
    const before = await db.Article.findAll({where: {}});
    expect(before.length).toEqual(0);

    const saved = await buildSaveArticle(test);
    const after1 = await db.Article.findAll({where:{}});
    const savedAgain = await buildSaveArticle(test);
    const after2 = await db.Article.findAll({where:{}});

    expect(saved.new).toBeTruthy();
    expect(savedAgain.new).not.toBeTruthy();
    expect(savedAgain.article.dataValues.uri).toEqual(savedAgain.article.dataValues.uri);
    done();
  });

  it('should associate the source to the article', async function(done) {
    expect.assertions(5);
    const test = lambda4.articles.fox[0];
    const saved = await buildSaveArticle(test);
    const found = await db.Article.find({where:{}});
   
    expect(found.dataValues).toHaveProperty('SourceId');
    expect(found.dataValues.SourceId).toBeTruthy();
   
    const source = await db.Source.find({where: {uri: test.source.uri}});
    const articles = await source.getArticles();
    
    expect(source.dataValues.uri).toEqual(test.source.uri);
    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0].dataValues.uri).toEqual(test.uri);
    done();
  }); 


  xit('should call format source if the source does not exist yet', async function(done) {
    
  });

  xit('should not call format source if the source already exists', async function(done) {
   
  }); 
});

xdescribe('getUnassociatedArticlesBySource', function() {
  beforeEach(() => {
    return db.clearDB().then(async() => {
      for (const article of lambda4.articles.fox) {
        await buildSaveArticle(article);
      }
    });
  });

  it('shou;d retrieve events that are unassociated')
});

xdescribe('calculateBias', function() {

});

xdescribe('isEventRelevant', function() {

});

xdescribe('associateArticlesNewEvent', function() {

});