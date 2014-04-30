/**
 * Created by dreamarts on 2014/03/30.
 */

var _ = require('underscore')
  , log = require('log')
  , should = require("should")
  , extend = require('../../lib/extend')
  ;

describe('extend', function () {

  describe('継承', function () {

    it('extend', function () {

      var object;
      var result;

      var master = {
        test_function_a: function (a) {
          return a + 1;
        },
        test_function_b: function (a) {
          return a + 2;
        }
      }
      // case 1 : 別オブジェクトに、指定した属性をコピーする場合
      object = {};
      extend.extend(object, master, ['test_function_b']);
      result = typeof object.test_function_a;
      result.should.eql('undefined');
      result = object.test_function_b(100);
      result.should.eql(102);

      // case 2 : 別オブジェクトに、全ての属性をコピーする場合
      object = {};
      extend.extend(object, master);
      result = object.test_function_a(100);
      result.should.eql(101);
      result = object.test_function_b(100);
      result.should.eql(102);
    });
  });

  describe('オブジェクト操作', function () {

    it('getValue', function () {

      var target = {c: 'xxx'};

      should.equal(extend.getValue(target, 'c'), 'xxx');

    });

    it('getValue', function () {

      var target = {a: {b: {c: 'xxx'}}};

      should.equal(extend.getValue(target, 'a.b.c'), 'xxx');

      should.equal(extend.getValue(target, 'a.b.d'), undefined);

    });

    it('setValue', function () {

      var target = {c: 'xxx'};

      extend.setValue(target, 'd', 'yyy');

      should.equal(extend.getValue(target, 'c'), 'xxx');

      should.equal(extend.getValue(target, 'd'), 'yyy');

    });

    it('setValue', function () {

      var target = {a: {b: {c: 'xxx'}}};

      extend.setValue(target, 'a.b.d', 'yyy');

      should.equal(extend.getValue(target, 'a.b.c'), 'xxx');

      should.equal(extend.getValue(target, 'a.b.d'), 'yyy');

    });

    it('setValue (readonly)', function () {

      var target = {};

      var val = extend.getValue(target, 'a.b.d', 'yyy');

      extend.setValue(target, 'a.b.d', 'yyy');

      should.equal(extend.getValue(target, 'a.b.c'), undefined);

      should.equal(extend.getValue(target, 'a.b.d'), 'yyy');

    });

    it('hasValue', function () {

      var target = {a: {b: {c: 'xxx'}}};

      should.equal(extend.hasValue(target, 'a'), true);

      should.equal(extend.hasValue(target, 'A'), false);

      should.equal(extend.hasValue(target, 'a.b.c'), true);

      should.equal(extend.hasValue(target, 'a.b.d'), false);

      should.equal(extend.hasValue(target, 'a.x.y'), false);

      should.equal(extend.hasValue(target, 'a.x.z'), false);
    });

    it('delValue', function () {

      var target = {a: {b: {c: 'xxx'}}};

      extend.delValue(target, 'a.b.c')

      should.equal(extend.hasValue(target, 'a.b.c'), false);

      should.equal(extend.hasValue(target, 'a.b.d'), false);

    });

  });

});
