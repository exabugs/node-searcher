/*
 * GET users listing.
 */

var _ = require('underscore')
  , mongodb = require('mongodb')
  , ObjectID = mongodb.ObjectID
  , GridStore = mongodb.GridStore
  , fs = require('fs')
  , async = require('async')
  , spawn = require('child_process').spawn
  , stream = require('stream')
  , MeCab = require('node-wakame')
  , extend = require('../extend')
  , vector = require('../vector')
  , frequency = require('./frequency')
  , mongo = require('../db')
  ;

/**
 *
 * @param db
 * @param collection
 * @param collection_df
 * @param condition
 * @param text
 * @param callback
 */
exports.search = function (collection, text, collection_df, attribute, field, option, callback) {

  text = text || "";

  var tasks = [];
  tasks.push(function (done) {
    exports.tf(text, field, function (err, keyword) {
      done(err, keyword);
    });
  });
  tasks.push(function (keyword, done) {
    frequency.to_tfiof(keyword, field, collection_df, function (err, keyword) {
      done(err, keyword);
    });
  });
  tasks.push(function (keyword, done) {

    option.condition = option.condition || {};

    var condition = option.condition;

    var words = _.pluck(keyword, field[0]);
    if (0 < words.length) {
      condition[[attribute, field[0]].join('.')] = {$in: words};
    }

    vector.cosine(collection, attribute, field, keyword, option, function (err, result) {
      done(err, result);
    });
  });
  async.waterfall(tasks, function (err, result) {
    callback(err, result);
  });
};

exports.batch = function (db, src, condition, attribute, field, callback) {
  var collection = db.collection(src + '.files');
  var cursor = collection.find(condition, {_id: 1});
  cursor.count(function (err, count) {
    if (count == 0) {
      return callback(err, count);
    }
    var c = count;
    cursor.each(function (err, item) {
      if (item) {
        exports.patch(db, src, item._id, collection, attribute, field, function (err) {
          if (--c == 0) {
            return callback(err, count);
          }
        });
      }
    });
  });
};

/**
 *
 * @param db
 * @param src src.files の src 部分の名前
 * @param _id src.files の _id
 * @param out
 * @param callback
 */
exports.patch = function (db, src, _id, out, attribute, field, callback) {
  var option = {root: src};
  var gs = new GridStore(db, _id, 'r', option);
  gs.open(function (err, gs) {
    if (err) {
      callback(err);
    } else {
      exports.tf(gs.stream(true), field, function (err, tf) {
        var data = {};
        data[attribute] = tf;
        out.update({_id: _id}, {$set: data}, function (err, result) {
          callback(err, result);
        });
      })
    }
  });
}

/**
 * TF
 * @param input 文字列 or ストリーム
 * @param callback
 */
exports.tf = function (input, field, callback) {
  exports.parse(input, function (err, result) {
    err && callback(err);
    var tf = _.map(result, function (value, key) {
      var item = {};
      item[field[0]] = key;
      item[field[1]] = value;
      return item;
    });
    tf = _.sortBy(tf, function (v) {
      return v[field[0]];
    });
    callback(err, tf);
  });
}

/**
 *
 * @param input 文字列 or ストリーム
 * @param callback [ { 名詞 : 個数 }, ... ]
 */
exports.parse = function (input, callback) {

  var info = {
    "名詞": {"一般": 1, "固有名詞": 1, "数": 1, "サ変接続": 1, "形容動詞語幹": 1, "副詞可能": 1}
  };

  var mecab = spawn('mecab');

  var result = {};

  var process = MeCab.parse(input);

  process.on('record', function (record, index) {
    if (1 < record.length) {
      var term = record[0];
      var cond1 = record[1];
      var cond2 = record[2];
      if (info[cond1] && info[cond1][cond2]) {
        var count = result[term];
        result[term] = count ? count + 1 : 1;
      }
    }
  });

  process.on('error', function (error) {
    callback(error);
  });

  process.on('end', function (count) {
    callback(null, result);
  });

};

/**
 * DocCat
 *
 * @param req
 * @param res
 */
exports.doccat = function (req, res) {

  // アップロードファイル
  var file = req.files.file.path;

  _doccat(file, '/opt/doccat/', 1000, function (err, result) {

    // ファイル削除
    fs.unlink(file);

    res.send(result);

  });
};

/**
 * DocCat
 *
 * @param file    処理対象ファイル
 * @param dir     実行形式フォルダ
 * @param timeout 最大処理時間(msec)
 * @param callback
 * @private
 */
function _doccat(file, dir, timeout, callback) {

  // 実行形式一蘭
  var processes = _.map(fs.readdirSync(dir), function (exe) {
    return dir + exe;
  });

  // 処理開始時刻
  var start = new Date().getTime();

  async.map(processes, function (process, done) {

    var result = {process: process, data: ""};
    var process = spawn(process, [file]);

    process.stdout.on('data', function (data) {
      result.data += data;
    });

    process.on('close', function (code) {
      result.time = new Date().getTime() - start; // 処理時間
      result.code = code; // リターンコード
      done(null, result);
    });

    setTimeout(function () {
      process.kill('SIGHUP');
    }, timeout);

  }, function (err, results) {

    callback(err, _.max(results, function (result) {
      return result.data.length;
    }));

  });

}
