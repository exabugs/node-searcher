/*

 */

"use strict";

var MongoClient = require("mongodb").MongoClient
  , text = require('./lib/text')
  , frequency = require('./lib/text/frequency')
  ;

function Searcher(url, field, freq) {
  this.url = url; // 'mongodb://127.0.0.1:27017/test'
  this.field = field; // ['k', 'c', 'v'] , ['key', 'val', 'tfiof'] etc.
  this.freq = freq; // freq = {'meta.tf': COLL_OF};
}

Searcher.prototype.open = function (callback) {
  MongoClient.connect(this.url, function (err, db) {
    callback(err, db);
  });
};

/**
 *
 * @param src
 * @param condition
 * @param attribute
 * @param callback

 var FIELD = ['k', 'c', 'w'];

 var URL = 'mongodb://127.0.0.1:27017/test';

 var target = {
        collection: 'mails'
      };

 var source = {
        collection: 'mails.files',
        attribute: 'metadata.tf',
        option: {
          condition: {
            'contentType': 'text/plain',
            'metadata.parent': mailInfo._id
          }
        }
      };

 var searcher = new Searcher(URL, FIELD);

 searcher.batch('mails', condition, 'metadata.tf', function (err, count) {

 */
Searcher.prototype.batch = function (target, source, callback) {
  var self = this;
  this.open(function (err, db) {
    if (err) {
      callback(err);
    } else {
      text.batch(db, target, source, self.field, function (err, count) {
        callback(err, count);
      });
    }
  });
};

/**
 *
 * @param target
 * @param source
 * @param callback

 var FREQ = {'tf': 'mails.of'};

 var target = {
      collection: 'mails',
      attribute: 'tf',
      option: {
        condition: {}
      }
    };

 var source = {
      collection: 'mails.files',
      attribute: 'metadata.tf',
      key: 'metadata.parent',
      option: {
        condition: {}
      }
    };

 var searcher = new Searcher(URL, FIELD, FREQ);

 searcher.indexing(target, source, function (err) {

 */
Searcher.prototype.indexing = function (target, source, callback) {
  var self = this;
  this.open(function (err, db) {
    if (err) {
      callback(err);
    } else {
      frequency.countup(db, target, source, self.field, function (err) {
        if (err) {
          callback(err);
        } else {
          frequency.object_frequency(db, target, self.freq, self.field, function (err) {
            if (err) {
              callback(err);
            } else {
              frequency.tfiof(db, target, self.freq, self.field, function (err) {
                callback(err);
              });
            }
          });
        }
      });
    }
  });
};

/**
 *
 * @param collection
 * @param condition
 * @param option
 * @param callback

 var collection = db.collection('mails');

 var condition = {
      'tf': '先日フジテレビでラーメン'
    };

 var option = {
      copy: ['subject'],
      out: 'mails.search.result'
    };

 var searcher = new Searcher(URL, FIELD, FREQ);

 searcher.search(collection, condition, option, function (err) {

 */
Searcher.prototype.search = function (collection, condition, option, callback) {
  var self = this;
  this.open(function (err, db) {
    if (err) {
      callback(err);
    } else {
      text.search(db, collection, condition, option, self.freq, self.field, function (err) {
        callback(err);
      });
    }
  });
};

module.exports = Searcher;

