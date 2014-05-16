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

 var source = {
        collection: 'mails.files',
        attribute: 'metadata.tf',
        option: {
          condition: {
            'contentType': 'text/plain'
          }
        }
      };

 var searcher = new Searcher(URL, FIELD);

 searcher.batch('mails', condition, 'metadata.tf', function (err, count) {

 */
Searcher.prototype.parse = function (source, callback) {
  var field = this.field;
  this.open(function (err, db) {
    if (err) {
      callback(err);
    } else {
      text.batch(db, source, field, function (err, count) {
        db.close();
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
  var freq = this.freq;
  var field = this.field;
  this.open(function (err, db) {
    if (err) {
      callback(err);
    } else {
      frequency.countup(db, target, source, field, function (err) {
        if (err) {
          db.close();
          callback(err);
        } else {
          frequency.object_frequency(db, target, freq, field, function (err) {
            if (err) {
              db.close();
              callback(err);
            } else {
              frequency.tfiof(db, target, freq, field, function (err) {
                db.close();
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

 var target = {
      collection: 'mails',
      option: {
        condition: {
          'tf': '先日フジテレビでラーメン'
        },
        copy: ['subject'],
        out: 'mails.search.result'
      }
    };

 var searcher = new Searcher(URL, FIELD, FREQ);

 searcher.search(collection, condition, option, function (err) {

 */
Searcher.prototype.search = function (target, callback) {
  var freq = this.freq;
  var field = this.field;
  this.open(function (err, db) {
    if (err) {
      callback(err);
    } else {
      text.search(db, target, freq, field, function (err) {
        db.close();
        callback(err);
      });
    }
  });
};

/**
 * 相互類似度
 * @param source
 * @param callback

 var source = {
      collection: 'mails',
      attribute: 'tf',
      option: {
        out: 'mails.mutual'
      }
    };

 */
Searcher.prototype.mutualize = function (source, callback) {
  var field = this.field;
  this.open(function (err, db) {
    if (err) {
      callback(err);
    } else {
      frequency.mutualize(db, source, field, function (err) {
        db.close();
        callback(err);
      });
    }
  });
};

/**
 * 主座標分析
 * →「R」が実行可能な場合、類似検索結果に対して主座標分析を行うことができる。
 * @param target 検索結果コレクション ({x, y}アトリビュート指定)
 * @param source ofコレクション
 * @param callback

 var target = {
      collection: 'mails.search.result',
      attribute: 'tf',
      option: {
        field: ['x, 'y']
      }
    };

 var source = {
      collection: 'mails.mutual',
      option: {
      }
    };


 */
Searcher.prototype.cmdscale = function (target, source, callback) {
  var self = this;
  this.open(function (err, db) {
    if (err) {
      callback(err);
    } else {
      frequency.cmdscale(db, target, source, function (err) {
        db.close();
        callback(err);
      });
    }
  });
};

module.exports = Searcher;
