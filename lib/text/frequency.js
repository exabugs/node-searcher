/*
 * Frequency Collection
 * @author exabugs@gmail.com
 */

var _ = require('underscore')
  , mongodb = require('mongodb')
  , async = require('async')
  , extend = require('../extend')
  , Util = require('../vector/util')
  ;

exports.tfiof = function (db, target, source, field, callback) {
  // 検索条件
  var condition = target.option.condition || {};
  var collection = db.collection(target.collection);
  condition[target.attribute] = {$exists: 1};

  var f = {};
  f[target.attribute] = 1;

  var cursor = collection.find(condition, {fields: f});
  cursor.count(function (err, count) {
    if (err || count === 0) {
      callback(err);
    }
    var c = count;
    cursor.each(function (err, item) {
      if (item !== null) {
        var x = extend.getValue(item, target.attribute);
        exports.to_tfiof(x, field, db.collection(source.collection), function (err, x) {
          var obj = {};
          obj[target.attribute] = x;
          collection.findAndModify({_id: item._id}, null, {$set: obj}, function (err) {
            if (err || --c === 0) {
              callback(err, count);
            }
          });
        });
      }
    });
  });
}

exports.to_tfiof = function (tf_array, field, of_coll, callback) {
  var util = new Util([field[0], field[2]]);
  var words = _.pluck(tf_array, field[0]);
  of_coll.find({_id: {$in: words}}).toArray(function (err, array) {
    merge(tf_array, field, array, ['_id', 'value']);
    util.normalize(tf_array);
    callback(err, tf_array);
  });
}

function merge(a, af, b, bf) {
  var result = [];
  var ia = 0, ib = 0;
  while (ia < a.length) {
    var ka = a[ia][af[0]];
    var kb = b[ib][bf[0]];
    if (ka == kb) {
      var obja = a[ia++];
      var objb = b[ib++];
      obja[af[2]] = obja[af[1]] * objb[bf[1]];
    } else if (ka > kb) {
      ib++;
    } else {
      ia++;
    }
  }
  return result;
}

/**
 * 単語が出現するオブジェクトの個数を求める
 * @param db
 * @param info
 * @param field
 * @param callback
 */
exports.object_frequency = function (db, info, field, callback) {

  // 検索条件
  var condition = info.option.condition || {};
  var collection = db.collection(info.collection);
  condition[info.attribute] = {$exists: 1};

  // ユーティリティ関数
  var util = {};
  extend.extend(util, extend);

  collection.find(condition).count(function (err, total) {

    // パラメータ
    var params = {
      attribute: info.attribute, // String : 検索対象 key-val形式(配列) フィールド名
      field: field,
      total: total
    };

    // MapReduce
    collection.mapReduce(
      function () {
        _.getValue(this, $.attribute).forEach(function (item) {
          emit(item[$.field[0]], 1);
        });
      },
      function (key, values) {
        return Array.sum(values);
      },
      {
        scope: {_: util, $: params},
        finalize: function (key, value) {
          return Math.log($.total / value);
        },
        query: condition,
        out: info.option.out || {inline: 1}
      },
      function (err, results) {
        callback(err, results);
      }
    );
  });
}

/**
 * 単語が出現する回数を求める
 * @param collection
 * @param attribute
 * @param field
 * @param option
 * @param callback
 */
//exports.term_frequency = function (collection, attribute, field, option, callback) {
exports.term_frequency = function (db, info, field, callback) {

  // 検索条件
  var condition = info.option.condition || {};
  condition[info.attribute] = {$exists: 1};

  // ユーティリティ関数
  var util = new Util(field);
  extend.extend(util, Util.prototype); // mapReduce関数scopeパラメータでprototypeが使えないのでコピー
  extend.extend(util, extend); // extendを使うのでコピー

  // パラメータ
  var params = {
    attribute: info.attribute, // String : 検索対象 key-val形式(配列) フィールド名
    field: field
  };

  db.collection(info.collection).mapReduce(
    function () {
      _.getValue(this, $.attribute).forEach(function (item) {
        emit(item[$.field[0]], item[$.field[1]]);
      });
    },
    function (key, values) {
      return Array.sum(values);
    },
    {
      scope: {_: util, $: params},
      query: condition,
      out: info.option.out || {inline: 1}
    },
    function (err, results) {
      callback(err, results);
    }
  );
}

/**
 * 集計して上位のオブジェクトに集約する
 * @param source
 * @param target
 * @param field
 * @param callback
 */
exports.countup = function (db, target, source, field, callback) {

  var condition = target.option.condition || {};
  var collection = db.collection(target.collection);
  var cursor = collection.find(condition);

  cursor.count(function (err, count) {
    if (err || count == 0) {
      return callback(err, count);
    }
    var c = count;
    cursor.each(function (err, item) {
      if (item) {
        source.option.condition = source.option.condition || {};
        source.option.condition[source.key] = {$in: [item._id]};
        exports.term_frequency(db, source, field, function (err, results) {
          var array = [];
          results.forEach(function (result) {
            var item = {};
            item[field[0]] = result._id;
            item[field[1]] = result.value;
            array.push(item);
          });
          var update = {};
          update[target.attribute] = array;
          collection.findAndModify({_id: item._id}, [], {$set: update}, function (err) {
            if (--c === 0) {
              return callback(err, count);
            }
          });
        });
      }
    });
  });



}