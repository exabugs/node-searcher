/*
 * ベクトル操作
 * @author exabugs@gmail.com
 */

"use strict";

var _ = require('underscore')
  , Util = require('./util')
  , extend = require('../extend')
  ;

/**
 * コサイン値(類似度)
 * @param collection Collection : 検索対象コレクション
 * @param condition
 * @param condition2 [ {attribute: 'meta.tf', keyword: [ {key: 'a', val: 1, tfiof: 0.938...}, ... ]
 * @param option
 * @param field
 * @param callback
 */
exports.cosine = function (collection, condition, condition2, option, field, callback) {

  // 検索条件
  condition2.forEach(function (item) {
    var words = _.pluck(item.keyword, field[0]);
    if (0 < words.length) {
      condition[[item.attribute, field[0]].join('.')] = {$in: words};
    }
  });

  // ユーティリティ関数
  var util = new Util([field[0], field[2]]);
  extend.extend(util, Util.prototype); // mapReduce関数scopeパラメータでprototypeが使えないのでコピー
  extend.extend(util, extend); // extendを使うのでコピー

  // パラメータ
  var params = {
    condition2: condition2,
    copy: option.copy
  };

  // MapReduce
  collection.mapReduce(
    function () {

      // 出力
      var value = {};
      _.extend(value, this, $.copy);

      var self = this;
      $.condition2.forEach(function (item) {
        var result = {};
        var array = _.getValue(self, item.attribute);
        var intersect = _.intersect(item.keyword, array);
        _.setValue(result, item.attribute, intersect);
        _.extend(value, result);
      });

      emit(this._id, value);
    },
    function (key, values) {
      return values[0];
    },
    {
      scope: {_: util, $: params},
      query: condition,
      out: option.out
    },
    function (err, result) {
      if (err) {
        return callback(err, result);
      } else {
        var rename = {};
        option.copy.forEach(function (item) {
          rename['value.' + item] = item;
        });
        condition2.forEach(function (item) {
          rename['value.' + item.attribute] = item.attribute + ".score";
        });
        result.update({}, {$rename: rename}, {multi: true}, function (err) {
          result.update({}, {$unset: {'value': 1}}, {multi: true}, function (err) {
            return callback(err, result);
          });
        });
      }
    }
  );

};
