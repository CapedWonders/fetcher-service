exports.handler = async (event) => {
  //get the first page (100 articles)
  const initialResponse = await getArticlesBySource(event.sourceUri, event.daysAgo, 1);
  const responses = {
    "1": initialResponse
  }
  const totalPages = initialResponse.articles.pages;
  let currentPage = 1;
  console.log(totalPages);
  //if there are more than 100 articles, keep fetching until we have them all
  while(currentPage < totalPages) {
    currentPage++;
    responses[currentPage.toString()] = await getArticlesBySource(event.sourceUri, event.daysAgo, currentPage);
  }  
  console.log("RESPONSES OBJ:", responses);
  const result = extractArticlesEventUris(responses);
  return result;
};

//event registry API
const { EventRegistry, QueryArticles, ArticleInfoFlags, ReturnInfo, SourceInfoFlags, RequestArticlesInfo } = require('eventregistry');
const er = new EventRegistry({apiKey: process.env.EVENT_REGISTRY_API_KEY});

//moment
const moment = require('moment');

//format the date for API call
const getDate = (daysAgo) => {
  return daysAgo 
    ? moment().subtract(daysAgo, 'day').format('YYYY-MM-DD') 
    : moment().format('YYYY-MM-DD');
};

//helper to retrieve all articles published yesterday by news outlet and page number of results
const getArticlesBySource = async(sourceUri, daysAgo, page) => { 
  const q = new QueryArticles({
    lang: ["eng"],
    dateStart: getDate(daysAgo),
    dateEnd: getDate(daysAgo),
    sourceUri: sourceUri
  });
  const sourceInfo = new SourceInfoFlags({image:true});
  const articleInfo = new ArticleInfoFlags({image: true, concepts: true, categories: true});
  const returnInfo = new ReturnInfo({articleInfo: articleInfo, sourceInfo: sourceInfo});
  const requestArticlesInfo = new RequestArticlesInfo({page: page, count: 100, returnInfo: returnInfo});
  q.setRequestedResult(requestArticlesInfo);
  const response = await er.execQuery(q);
  console.log(response);
  return response;
};

const extractArticlesEventUris = (articlesObj) => {
  let articles = [];
  let eventUris = [];
  for (const page in articlesObj) {
    let currentArticles = articlesObj[page].articles.results;
    articles = articles.concat(currentArticles);
    eventUris = eventUris.concat(currentArticles.map(article => article.eventUri).filter(uri => uri));
  }
  return { articles: articles, uris: eventUris };
}




