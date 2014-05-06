/*

 */

"use strict";

var MongoClient = require("mongodb").MongoClient
  , text = require('./lib/text')
  , frequency = require('./lib/text/frequency')
  ;

function Searcher(url, field) {
  this.url = url; // 'mongodb://127.0.0.1:27017/test'
  this.field = field; // ['k', 'c', 'v']
}

Searcher.prototype.open = function (callback) {
  MongoClient.connect(this.url, function (err, db) {
    callback(err, db);
  });
};

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

Searcher.prototype.countup = function (target, source, field, callback) {
  var self = this;
  this.open(function (err, db) {
    if (err) {
      callback(err);
    } else {
      frequency.countup(db, target, source, self.field, function (err) {
        callback(err);
      });
    }
  });
}

module.exports = Searcher;

