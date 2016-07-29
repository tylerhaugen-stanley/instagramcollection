# Instagram Collection

## Synopsis

Instagram collection takes a hashtag, start date, and end date, and then will query Instagram for photos and videos that have the hashtag and were posted within the specific dates. The collection of media from instagram will then be saved in a postgres database and can be queried later.

## Prerequisities/Installation

What things you need to install the software and how to install them
- A [postgress database](https://www.postgresql.org/download/) running
    - Edit the db_url constant in server.js to correspond to your personal database link.
- [Node.js](https://nodejs.org/en/download/) installed on your computer 
- An Instagram [access token](http://instagram.pixelunion.net/)
    - Edit the access_token constant in server.js to correspond to your access token.

## Running the program

- In a terminal window execute `node .../server.js`
- In a brower window, load `localhost:3000`

## Authors

* **Tyler Haugen-Stanley**