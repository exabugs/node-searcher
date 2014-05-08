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
 */
Searcher.prototype.batch = function (src, condition, attribute, callback) {
  var self = this;
  this.open(function (err, db) {
    if (err) {
      callback(err);
    } else {
      text.batch(db, src, condition, attribute, self.field, function (err, count) {
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

 var option = {
      copy: ['subject'],
      out: 'mails.search.result'
    };

 var condition = {
      'tf': '先日フジテレビでラーメン'
    };

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

