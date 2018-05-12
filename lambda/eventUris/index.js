exports.handler = async (event, context) => {
  const uris = await getEventUrisByAllSources(getDate(3));
  
  return {message: "success", data: uris};
};

//event registry API
const { EventRegistry, QueryEventsIter, ReturnInfo, QueryItems, QueryEvents, RequestEventsUriWgtList } = require('eventregistry');
const er = new EventRegistry({apiKey: process.env.EVENT_REGISTRY_API_KEY});

//momentjs
const moment = require('moment');
const getDate = (daysAgo) => {
  return daysAgo 
    ? moment().subtract(daysAgo, 'day').format('YYYY-MM-DD') 
    : moment().format('YYYY-MM-DD');
};


//our MVP seven news sources.  Use these URIs to communicate with ER
const sourcesURI = {
  fox: new QueryItems.OR(['foxsports.com', 'foxnews.com','foxbusiness.com', 'nation.foxnews.com', 'fox11online.com', 'q13fox.com', 'radio.foxnews.com', 'fox5ny.com']),
  breitbart: 'breitbart.com',
  huffington: 'huffingtonpost.com',
  msnbc: 'msnbc.com',
  hill: 'thehill.com',
  ap: 'hosted.ap.org',
  times: 'nytimes.com'
};

//get lists of event uris by individual news sources
const getEventUrisByNewsSource = (newsUri, date) => {
  const q = new QueryEvents({
      sourceUri: newsUri,
      dateStart: date,
  });
 
  const requestEventsUriList = new RequestEventsUriWgtList();
  q.setRequestedResult(requestEventsUriList);
  return er.execQuery(q); // execute the query and return the promise
};

//get all the uris for all 7 of our MVP news sources
const getEventUrisByAllSources = async (date) => {
  let uris = {};
  let sources = 
  {
    fox: await getEventUrisByNewsSource(sourcesURI.fox, date),
    breitbart: await getEventUrisByNewsSource(sourcesURI.breitbart, date),
    huffington: await getEventUrisByNewsSource(sourcesURI.huffington, date),
    msnbc: await getEventUrisByNewsSource(sourcesURI.msnbc, date),
    hill: await getEventUrisByNewsSource(sourcesURI.hill, date),
    ap: await getEventUrisByNewsSource(sourcesURI.ap, date),
    times: await getEventUrisByNewsSource(sourcesURI.times, date),
  }

  //strip the wgt value and only pass along the events in english
  for (const item in sources) {
    uris[item] = sources[item].uriWgtList.results.map(x => x.split(":")[0]).filter(x => x.split("-")[0] === "eng");
  } 
  return uris;
};
