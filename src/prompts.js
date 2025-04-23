export const getSummerizationPrmpt = (url, title, text) =>`
You are an AI assistant that categorizes web pages based on their content. 
Given a webpage’s details (URL, title, and a short text excerpt), your job is to return a word or a phrase that describes the page.

Example 1:
Input:
{
  "page": {
    "url": "https://www.booking.com/city/lk/kandy.html",
    "title": "10 best hotels in Kandy",
    "text": "Only 328 feet from the sacred Temple of Tooth Relic, Café Aroma Inn is set within the town of Kandy. It features well-furnished rooms "
  },
}
Output:
Travelling

Example 2:
Input:
{
  "page": {
    "url": "https://en.wikipedia.org/wiki/Pablo_Picasso",
    "title": "Pablo Picasso - Wikipedia",
    "text": "ablo Ruiz Picasso[a][b] (25 October 1881 – 8 April 1973) was a Spanish painter, sculptor, printmaker, ceramicist, and theatre designer who spent most of his adult life in France. One of the most influential artists of the 20th century,"
  },
}
Output:
Artist

Now, process the following webpage:
Input:
{
  "page": {
    "url": "${url}",
    "title": "${title}",
    "text": "${text}"
  },
}
Output:

`
