/**
 * Created by dreamarts on 2014/03/30.
 */

"use strict";

var _ = require('underscore')
  , log = require('log')
  , should = require("should")
  , text = require('../../lib/text')
  , mongo = require('../../lib/db')
  , async = require('async')
  , frequency = require('../../lib/text/frequency')
  , test = require('../test_util')
  ;

describe('text.frequency', function () {

  var db;
  var COLL_FILES = 'test.files'
  var COLL = 'test';
  var COLL_OF = 'test.of';

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

  var DATA_COLL_FILES = [
    {
      _id: 1,
      parents: [9],
      tf: [
        {key: 'a', val: 1},
        {key: 'b', val: 1},
        {key: 'c', val: 1}
      ]
    },
    {
      _id: 2,
      parents: [9],
      tf: [
        {key: 'a', val: 1},
        {key: 'b', val: 1}
      ]
    },
    {
      _id: 3,
      parents: [9],
      tf: [
        {key: 'a', val: 1}
      ]
    },
    {
      _id: 4,
      parents: [8],
      tf: [
        {key: 'x', val: 1},
        {key: 'y', val: 1},
        {key: 'z', val: 1}
      ]
    },
    {
      _id: 5,
      parents: [8],
      tf: [
        {key: 'x', val: 1},
        {key: 'y', val: 1},
        {key: 'z', val: 1}
      ]
    },
    {
      _id: 6,
      parents: [8],
      tf: [
        {key: 'x', val: 1},
        {key: 'y', val: 1},
        {key: 'z', val: 1}
      ]
    },
    {
      _id: 7,
      parents: [7],
      tf: [
        {key: 'x', val: 1},
        {key: 'y', val: 1}
      ]
    },
    {
      _id: 8,
      parents: [7],
      tf: [
        {key: 'x', val: 1}
      ]
    }
  ];

  it('準備', function (done) {
    test.remove(db, [COLL_FILES], function () {
      var collection = db.collection(COLL_FILES);
      test.insert(db, collection, DATA_COLL_FILES, function (err) {
        done();
      });
    });
  });

  var DATA_COLL = [
    {
      _id: 7,
      name: 'seven'
    },
    {
      _id: 8,
      name: 'eight'
    },
    {
      _id: 9,
      name: 'nine'
    }
  ];

  it('準備', function (done) {
    test.remove(db, [COLL], function () {
      var collection = db.collection(COLL);
      test.insert(db, collection, DATA_COLL, function (err) {
        done();
      });
    });
  });

  it('term_frequency', function (done) {

    var info = {
      collection: COLL_FILES,
      attribute: 'tf',
      option: {
        condition: {parents: 9}
      }
    }

    var field = ['key', 'val'];

    frequency.term_frequency(db, info, field, function (err, result) {
      should.not.exist(err);
      var expected = [
        {_id: 'a', value: 3},
        {_id: 'b', value: 2},
        {_id: 'c', value: 1}
      ];
      result.should.eql(expected);
      done();
    });
  });

  it('object_frequency', function (done) {

    var info = {
      collection: COLL_FILES,
      attribute: 'tf',
      option: {
        condition: {parents: 9}
      }
    };

    var field = ['key', 'val'];

    frequency.object_frequency(db, info, field, {}, function (err, result) {
      should.not.exist(err);
      var expected = [
        {_id: 'a', value: 0},
        {_id: 'b', value: 0.4054651081081644},
        {_id: 'c', value: 1.0986122886681098}
      ];
      result.should.eql(expected);
      done();
    });
  });

  it('coutup', function (done) {

    var target = {
      collection: COLL,
      attribute: 'meta.tf',
      option: {
        condition: {}
      }
    };

    var source = {
      collection: COLL_FILES,
      attribute: 'tf',
      key: 'parents',
      option: {
        condition: {}
      }
    };

    var field = ['key', 'val'];

    frequency.countup(db, target, source, field, function (err) {

      should.not.exist(err);
      done();
    });

  });

  it('tfiof', function (done) {

    var freq = {
      'meta.tf': COLL_OF
    };

    var field = ['key', 'val', 'tfiof'];

    var info = {
      collection: COLL,
      attribute: 'meta.tf',
      option: {
        out: COLL_OF,
        condition: {}
      }
    };

    frequency.object_frequency(db, info, freq, field, function (err) {

      var target = {
        collection: COLL,
        attribute: 'meta.tf',
        option: {
          condition: {}
        }
      };

      frequency.tfiof(db, target, freq, field, function (err, result) {
        should.not.exist(err);
        done();
      });
    });

  });

  it('search', function (done) {

    var freq = {
      'meta.tf': COLL_OF
    };

    var field = ['key', 'val', 'tfiof'];

    var collection = db.collection(COLL);
    var collection_freq = db.collection(COLL_OF);
    var attribute = 'meta.tf';

    var option = {
      copy: ['name'],
      out: 'test.search.result'
    };

    var condition = {
      'meta.tf': 'a x'
    };

    //exports.search = function (collection, text, collection_df, attribute, field, option, callback) {

    var expected = [
      {
        "_id": 9,
        "name": "nine",
        "meta": {"tf": 0.7521897121273947}
      },
      {
        "_id": 7,
        "name": "seven",
        "meta": {"tf": 0.30968785970908075}
      },
      {
        "_id": 8,
        "name": "eight",
        "meta": {"tf": 0.11328489511234544}
      }
    ]

    text.search(db, collection, condition, option, freq, field, function (err, result) {
    //text.search(collection, 'x a', collection_freq, attribute, field, option, function (err, result) {
      var sort = {};
      sort['meta.tf'] = -1;
      result.find({}, {sort: sort}).toArray(function (err, result) {
        result.should.eql(expected);
        done();
      });
    });
  });

});
