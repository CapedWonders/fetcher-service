exports.handler = async (event, context) => {
  const eventInfo = await getEventsByChunk(event.uris);
  return eventInfo;
};

//event registry API
const { EventRegistry, QueryEvents } = require('eventregistry');
const er = new EventRegistry({apiKey: process.env.EVENT_REGISTRY_API_KEY});

//lodash
const { chunk } = require('lodash');

//helper function to retrive detailed event info by event uri list
const getEventInfo = async(uriList) => {
  let unsavedEvents = [];
  const q = QueryEvents.initWithEventUriList(uriList);
  const response = await er.execQuery(q);
  return response.events.results;
};

//ER has a max of 50 uris per query
const getEventsByChunk = async(uriList) => {
  let returnEvents = [];
  const chunks = chunk(uriList, 50);

  for (const chunk of chunks) {
    let current = await getEventInfo(chunk); 
    returnEvents = returnEvents.concat(current)
  }

  return returnEvents;
}

