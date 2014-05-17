/*
 * Frequency Collection
 * @author exabugs@gmail.com
 */

var _ = require('underscore')
  , fs = require('fs')
  , mongodb = require('mongodb')
  , ObjectID = mongodb.ObjectID
  , async = require('async')
  , extend = require('../extend')
  , Util = require('../vector/util')
  , R = require('../R')
  , path = require('path')
  ;

/**
 * ユーティリティ関数
 * @param field
 * @returns {Util}
 */
function getUtil(field) {
  var util = new Util(field);
  extend.extend(util, Util.prototype); // mapReduce関数scopeパラメータでprototypeが使えないのでコピー
  extend.extend(util, extend); // extendを使うのでコピー
  return util;
}

exports.tfiof = function (db, target, freq, field, callback) {
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
        var freqcoll = db.collection(freq[target.attribute]);
        exports.to_tfiof(x, field, freqcoll, function (err, x) {
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
  while (ia < a.length && ib < b.length) {
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
exports.object_frequency = function (db, info, freq, field, callback) {

  // 検索条件
  var condition = info.option.condition || {};
  var collection = db.collection(info.collection);
  condition[info.attribute] = {$exists: 1};

  // ユーティリティ関数
  var util = {};
  extend.extend(util, extend);

  collection.find(condition, {fields: {}}).count(function (err, total) {

    // パラメータ
    var params = {
      attribute: info.attribute,
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
        out: freq[info.attribute] || {inline: 1}
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
exports.term_frequency = function (db, info, field, callback) {

  // 検索条件
  var condition = info.option.condition || {};
  condition[info.attribute] = {$exists: 1};

  // ユーティリティ関数
  var util = getUtil(field);

  // パラメータ
  var params = {
    attribute: info.attribute,
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

  var index = {};
  index[[target.attribute, field[0]].join('.')] = 1;
  collection.ensureIndex(index, function (err) {
    var cursor = collection.find(condition, {fields: {}});
    cursor.count(function (err, count) {
      if (err || count == 0) {
        return callback(err, count);
      }
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
              if (--count === 0) {
                return callback(err);
              }
            });
          });
        }
      });
    });
  });
}

/**
 * 相互類似度
 * @param db
 * @param source
 * @param field
 * @param callback
 */
exports.mutualize = function (db, source, field, callback) {

  var condition = source.option.condition || {};
  var collection = db.collection(source.collection);

  var fields = {};
  fields[source.attribute] = 1;

  var option = {
    fields: fields,
    sort: {_id: 1}
  }

  // ユーティリティ関数
  var util = getUtil([field[0], field[2]]);

  db.collection(source.option.out).drop();

  var cursor = collection.find(condition, option);
  cursor.count(function (err, count) {
    if (err || count == 0) {
      return callback(err, count);
    }
    cursor.each(function (err, item) {
      if (item) {
        // パラメータ
        var params = {
          attribute: source.attribute,
          _id: item._id,
          vector: extend.getValue(item, source.attribute),
          field: field
        };
        collection.mapReduce(
          function () {
            var cosine = _.intersect($.vector, _.getValue(this, $.attribute));
            emit({A: $._id, B: this._id}, cosine);
          },
          function (key, values) {
            return values[0];
          },
          {
            scope: {_: util, $: params},
            query: {_id: {$gt: item._id}},
            out: source.option.out ? {merge: source.option.out} : {inline: 1}
          },
          function (err, results) {
            if (--count === 0) {
              return callback(err, results);
            }
          }
        );
      }
    });
  });
}

/**
 * 主座標分析
 * →「R」が実行可能な場合、類似検索結果に対して主座標分析を行うことができる。
 * @param db
 * @param target
 * @param source
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
exports.cmdscale = function (db, target, source, callback) {

  var field = target.option.field || ['x', 'y'];
  var target_collection = db.collection(target.collection);
  var score = target.attribute + '.score';
  var target_sort = {};
  target_sort[score] = -1; // スコア降順
  var target_condition = target.option.condition || {};

  var target_option = {fields: {'_id': 1}, sort: target_sort, limit: 200};
  target_collection.find(target_condition, target_option).toArray(function (err, results) {
    if (err) {
      callback(err);
    } else {

      // 類似度 読込
      var source_collection = db.collection(source.collection);
      var ids = _.pluck(results, '_id');
      var source_condition = source.option.condition || {};
      source_condition['_id.A'] = {$in: ids};
      source_condition['_id.B'] = {$in: ids};
      source_collection.find(source_condition).toArray(function (err, results) {
        if (err) {
          callback(err);
        } else {
          var map = _.reduce(ids, function (memo, item) {
            memo[item] = {};
            return memo;
          }, {});
          map = _.reduce(results, function (memo, item) {
            var _id = item._id;
            memo[_id.A][_id.B] = item.value;
            return memo;
          }, map);

          // R 入力データ作成
          var data = [];
          data.push('\t' + ids.join('\t'));
          _.each(ids, function (id_A) {
            var line = [];
            line.push(id_A);
            _.each(ids, function (id_B) {
              var value = (id_A === id_B) ? 1 : map[id_A][id_B];
              line.push(value === undefined ? '' : (1 - value));
            });
            data.push(line.join('\t'));
          });
          data.push('');

          // R 入力データ書込
          var tmpfilename = (new ObjectID()).toString();
          var tmpdir = '/tmp';
          var ifile = path.join(tmpdir, tmpfilename + '.in');
          var ofile = path.join(tmpdir, tmpfilename + '.out');
          fs.writeFile(ifile, data.join('\n'), function (err) {
            if (err) {
              callback(err);
            } else {
              // R 実行
              var script = path.resolve(path.join('lib', 'R', 'scripts', 'cmdscale.R'));
              R.exec(script, [ifile, ofile], function (err, stdout, stderr) {
                fs.unlink(ifile);
                if (!path.existsSync(ofile)) {
                  console.log(stderr);
                  callback(err);
                } else {
                  // R 結果読込
                  fs.readFile(ofile, function (err, text) {
                    if (err) {
                      callback(err);
                    } else {
                      fs.unlink(ofile);
                      var index = 0;
                      async.each(text.toString().split('\n'), function (element, next) {
                        var _id = ids[index++];
                        var value = element.split(' ');
                        // R 結果書込
                        var doc = {};
                        doc[target.attribute + '.' + field[0]] = parseFloat(value[0]);
                        doc[target.attribute + '.' + field[1]] = parseFloat(value[1]);
                        target_collection.findAndModify({_id: _id}, null, {$set: doc}, function (err, result) {
                          next();
                        });
                      }, function (err) {
                        callback(err);
                      });
                    }
                  });
                }
              });
            }
          })
        }
      });
    }
  });
}
