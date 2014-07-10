/*
 * ベクトル操作(ユーティリティ)
 * @author exabugs@gmail.com
 */

"use strict";

// 'util' は MongoDB の MapReduce に渡すので require 禁止
// Don't required here!

var _ = require('underscore');

/**
 * コンストラクタ
 * @param k
 * @param v
 * @constructor
 */
function Util(prop) {
  this.prop = prop;
}

/**
 * ソート
 * @param array
 * @returns {*}
 */
Util.prototype.sort = function (array) {
  var k = this.prop[0];
  return _.sortBy(array, function (value) {
    return value[k];
  });
}

/**
 * ノルム
 * @param array
 * @returns {number}
 */
Util.prototype.norm = function (array) {
  var sum = 0;
  for (var i = 0; i < array.length; i++) {
    var val = array[i][this.prop[1]];
    sum += val * val;
  }
  return Math.sqrt(sum);
}

/**
 * 正規化
 * @param array
 */
Util.prototype.normalize = function (array) {
  var norm = this.norm(array);
  if (0 < norm) {
    for (var i = 0; i < array.length; i++) {
      array[i][this.prop[1]] = array[i][this.prop[1]] / norm;
    }
  }
  return array;
};

/**
 * 和
 * @param a 昇順ソート済み配列
 * @param b 昇順ソート済み配列
 * @returns {Array}
 */
Util.prototype.sum = function (a, b) {
  var k = this.prop[0];
  var c = this.prop[1];
  var result = [];
  for (var i = 0, j = 0; i < a.length || j < b.length;) {
    var data = {};
    if (j == b.length || (i < a.length && a[i][k] < b[j][k])) {
      data[k] = a[i][k];
      data[c] = a[i][c];
      i++;
    } else if (i == a.length || (j < b.length && a[i][k] > b[j][k])) {
      data[k] = b[j][k];
      data[c] = b[j][c];
      j++;
    } else {
      data[k] = a[i][k];
      data[c] = a[i][c] + b[j][c];
      i++;
      j++;
    }
    result.push(data)
  }
  return result;
};

/**
 * 内積
 * @param a 昇順ソート済み配列
 * @param b 昇順ソート済み配列
 * @returns {number}
 */
Util.prototype.intersect = function (a, b) {
  var result = 0;
  var head = 0;
  for (var i = 0; i < a.length && head < b.length; i++) {
    var value = a[i];
    var index = this.search(b, value, head);
    if (0 <= index) {
      result += value[this.prop[1]] * b[index][this.prop[1]];
      head = index + 1;
    } else if (-3 == index) {
      break;
    }
  }
  return result;
};

/**
 * コサイン値(コサイン類似度)
 * @param a
 * @param b
 * @returns {number}
 */
Util.prototype.cosine = function (a, b) {
  var intersect = this.intersect(a, b);
  var norm_a = this.norm(a);
  var norm_b = this.norm(b);
  return intersect / norm_a / norm_b;
};

/**
 * バイナリサーチ
 * @param array 検索対象
 * @param value 検索値
 * @param head 開始インデックス
 * @returns {number}
 *  0以上 : 見つかった
 *  -1   : 見つからない (範囲内)
 *  -2   : 見つからない (最小より小さい)
 *  -3   : 見つからない (最大より大きい)
 */
Util.prototype.search = function (array, value, head) {
  head = head || 0;
  var tail = array.length - 1;
  while (head <= tail) {
    var where = head + Math.floor((tail - head) / 2);
    var a = array[where][this.prop[0]];
    var b = value[this.prop[0]];
    if (a == b)
      return where;
    if (a > b)
      tail = where - 1;
    else
      head = where + 1;
  }
  return tail == -1 ? -2 : array.length == head ? -3 : -1;
};

module.exports = Util;
