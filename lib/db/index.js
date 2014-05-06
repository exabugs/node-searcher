"use strict";

var MongoClient = require("mongodb").MongoClient;

exports.open = function (callback) {
  MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
    callback(err, db);
  });
}
