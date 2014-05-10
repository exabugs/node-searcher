/**
 * Created by dreamarts on 2014/03/30.
 */

var _ = require('underscore')
  , log = require('log')
  , should = require("should")
  , text = require('../../lib/text')
  , mongo = require('../../lib/db')
  , async = require('async')
  , frequency = require('../../lib/text/frequency')
  , test = require('../test_util')
  ;

describe('text.index', function () {

  var db;

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

  describe('parse 1', function () {
    it('should return -1 when the value is not present', function (done) {
      text.parse('食後にコーヒーを飲む。１２３。', function (err, words) {
        words.should.eql({'123':1, '食後': 1, 'コーヒー': 1});
        done();
      })
    })
  });

});
