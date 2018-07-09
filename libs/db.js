const MongoClient = require('mongodb').MongoClient,
      config      = require('../config/config');

let db = null, // reference to db
    url = config.store.mongo.uri,
    dbname = config.store.mongo.dbname,
    options = config.store.mongo.options,
    c = config.color;


let initDb = ()=>{
  return new Promise(function(resolve, reject) {
    if(db) resolve(db); // if already have reference to mongo then resolve(db)
    MongoClient.connect(url, options)
      .then(client => {
        db = client.db(dbname);
        console.log(`${c.green}[i] connected to MongoDB ${c.white}${url+dbname}}`);
        resolve(db)
      })
      .catch(e=>{
        console.log(`${c.red}Failed connect to DB: ${c.white}${e}`);
        reject()
      })
  });
};

// wait mongo connection and return Promise with DB reference
let getInstance = async () => await initDb();

module.exports = {
  get:  getInstance() // get DB instance
};
