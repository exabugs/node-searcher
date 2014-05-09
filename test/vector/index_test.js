/**
 * Created by dreamarts on 2014/03/30.
 */

var _ = require('underscore')
  , log = require('log')
  , mongo = require('../../lib/db')
  , async = require('async')
  , should = require("should")
  , vector = require('../../lib/vector')
  , test = require('../test_util')
  ;

describe('index', function () {

  var db;
  var COLL = 'test_users';

  before(function (done) {
    // テストが始まる前の処理
    test.open(function (err, _db) {
      db = _db;
      done();
    });
  });

  after(function (done) {
    // テストが終わった後の処理
    db.close();
    done();
  });

  it('準備', function (done) {

    test.remove(db, [COLL], function () {

      var collection = db.collection(COLL);
      var data = [
        {
          user_id: 1,
          tf: [
            {key: 'a', val: '2'},
            {key: 'b', val: '2'},
            {key: 'c', val: '2'}
          ]
        },
        {
          user_id: 2,
          tf: [
            {key: 'a', val: '1'},
            {key: 'b', val: '1'},
            {key: 'c', val: '1'},
            {key: 'd', val: '1'}
          ]
        }
      ];
      async.each(data, function (item, next) {
        collection.insert(item, function (err) {
          next(err);
        });
      }, function (err) {
        done(err);
      })

    });
  });


  /**
   * コサイン値(類似度)
   * @param collection Collection : 検索対象コレクション
   * @param condition
   * @param condition2 [ {attribute: 'meta.tf', keyword: [ {key: 'a', val: 1, tfiof: 0.938...}, ... ]
   * @param option
   * @param field
   * @param callback
   */
    //exports.cosine = function (collection, condition, condition2, option, field, callback) {
  it('cosine', function (done) {

    var collection = db.collection(COLL);
    var field = ['key', 'val', 'tfiof'];
    var condition = {user_id: 1};
    var condition2 = [
      {
        attribute: 'tf',
        keyword: [
          {key: 'a', val: 1, tfoif: 0.5},
          {key: 'c', val: 1, tfiof: 0.5}
        ]
      }
    ];

    var option = {
      copy: ['user_id'],
      out: 'test.search.result'
    };

    vector.cosine(collection, condition, condition2, option, field, function (err, result) {
      done(err);
    });
  });

});

