/**
 * Created by dreamarts on 2014/03/30.
 */

var _ = require('underscore')
  , log = require('log')
  , should = require("should")
  , Util = require('../../lib/vector/util')
  ;

describe('util', function () {

  var util = new Util(['k', 'v']);

  describe('ライブラリ', function () {

    /**
     * ノルム
     * @param array
     * @param attr
     * @returns {*}
     */
    it('ノルム', function () {
      var array = [
        {v: 6},
        {v: 4},
        {v: 2}
      ];

      var result = util.norm(array);

      var expected = Math.sqrt(6 * 6 + 4 * 4 + 2 * 2)

      result.should.eql(expected);
    });

    /**
     * 正規化
     * @param array
     * @param attr
     * @returns {*}
     */
    it('正規化', function () {
      var array = [
        {v: 6},
        {v: 4},
        {v: 2}
      ];

      var result = util.normalize(array);

      var norm = Math.sqrt(6 * 6 + 4 * 4 + 2 * 2)
      var expected = [
        {v: 6 / norm},
        {v: 4 / norm},
        {v: 2 / norm}
      ];

      result.should.eql(expected);
    });

   /**
     * ソート
     * @param array
     * @param attr
     * @returns {*}
     */
    it('ソート', function () {
      var array = [
        {k: 6},
        {k: 4},
        {k: 2}
      ];

      var result = util.sort(array);

      var expected = [
        {k: 2},
        {k: 4},
        {k: 6}
      ];

      result.should.eql(expected);
    });

    /**
     * バイナリサーチ
     * @param array 検索対象
     * @param value 検索値
     * @param attr 比較属性
     * @param head 開始インデックス
     * @returns
     *  0以上 : 見つかった
     *  -1   : 見つからない (範囲内)
     *  -2   : 見つからない (最小より小さい)
     *  -3   : 見つからない (最大より大きい)
     */
    it('バイナリサーチ', function () {
      var array = [
        {k: 2},
        {k: 4},
        {k: 6}
      ];
      var result;

      result = util.search(array, {k: 0});
      result.should.eql(-2);

      result = util.search(array, {k: 1});
      result.should.eql(-2);

      result = util.search(array, {k: 2});
      result.should.eql(0);

      result = util.search(array, {k: 3});
      result.should.eql(-1);

      result = util.search(array, {k: 4});
      result.should.eql(1);

      result = util.search(array, {k: 5});
      result.should.eql(-1);

      result = util.search(array, {k: 6});
      result.should.eql(2);

      result = util.search(array, {k: 7});
      result.should.eql(-3);

      result = util.search(array, {k: 8});
      result.should.eql(-3);

    });
  });

  describe('集合演算', function () {

    it('内積', function () {
      var util = new Util(['k', 'k']);

      var array_a = [
        {k: 70},
        {k: 10},
        {k: 50},
        {k: 30},
        {k: 90},
        {k: 91},
        {k: 92}
      ];
      array_a = util.sort(array_a);

      var array_b = [
        {k: 5},
        {k: 10},
        {k: 15},
        {k: 20},
        {k: 25},
        {k: 30},
        {k: 35}
      ];
      array_b = util.sort(array_b);

      var result = util.intersect(array_a, array_b);

      var expected = 10 * 10 + 30 * 30;

      result.should.eql(expected);
    });

    it('コサイン類似度', function () {
      var array_a = [
        {k: '70', v: 2},
        {k: '10', v: 4}, //
        {k: '50', v: 2},
        {k: '30', v: 4}, //
        {k: '90', v: 2}
      ];
      array_a = util.sort(array_a);

      var array_b = [
        {k: '10', v: -4}, //
        {k: '12', v: 2},
        {k: '15', v: 2},
        {k: '20', v: 2},
        {k: '30', v: -4}, //
        {k: '35', v: 2}
      ];
      array_b = util.sort(array_b);

      var result = util.intersect(array_a, array_b);

      var expected = 4 * (-4) + 4 * (-4);


      result.should.eql(expected);


      var norm_a = Math.sqrt((4 * 4) * 2 + (2 * 2) * 3);
      var norm_b = Math.sqrt((-4 * -4) * 2 + (2 * 2) * 4);
      var norm_x = 4 * (-4) + 4 * (-4);
      expected = norm_x / norm_a / norm_b;

      var value = util.cosine(array_a, array_b);
      value.should.eql(expected);
    });

    it('和', function () {
      var array_a = [
        {k: '70', v: 2},
        {k: '10', v: 4}, //
        {k: '50', v: 2},
        {k: '30', v: 4}, //
        {k: '90', v: 2}
      ];
      array_a = util.sort(array_a);

      var array_b = [
        {k: '10', v: -4}, //
        {k: '12', v: 2},
        {k: '15', v: 2},
        {k: '20', v: 2},
        {k: '30', v: -4}, //
        {k: '35', v: 2}
      ];
      array_b = util.sort(array_b);


      var expected = [
        {k: '10', v: 0}, //
        {k: '12', v: 2},
        {k: '15', v: 2},
        {k: '20', v: 2},
        {k: '30', v: 0}, //
        {k: '35', v: 2},
        {k: '50', v: 2},
        {k: '70', v: 2},
        {k: '90', v: 2}
      ];

      {
        var result = util.sum(array_b, array_a);
        result.should.eql(expected);
      }
      {
        var result = util.sum(array_a, array_b);
        result.should.eql(expected);
      }

      var array_a = [];

      var array_b = [
        {k: '10', v: -4}, //
        {k: '12', v: 2},
        {k: '15', v: 2},
        {k: '20', v: 2},
        {k: '30', v: -4}, //
        {k: '35', v: 2}
      ];
      array_b = util.sort(array_b);

      {
        var result = util.sum(array_b, array_a);
        result.should.eql(array_b);
      }
      {
        var result = util.sum(array_a, array_b);
        result.should.eql(array_b);
      }

    });

  });

});

