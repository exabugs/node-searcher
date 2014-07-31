node-searcher
===========

TF-IDF Searcher for Node.js

[![Build Status](https://secure.travis-ci.org/exabugs/node-searcher.png?branch=master)](http://travis-ci.org/exabugs/node-searcher)
[![Coverage Status](https://coveralls.io/repos/exabugs/node-searcher/badge.png?branch=master)](https://coveralls.io/r/exabugs/node-searcher?branch=master)
[![Code Climate](https://codeclimate.com/github/exabugs/node-searcher.png)](https://codeclimate.com/github/exabugs/node-searcher)
[![Dependency Status](https://david-dm.org/exabugs/node-searcher.png)](https://david-dm.org/exabugs/node-searcher)

[![NPM](https://nodei.co/npm/node-searcher.png?stars&downloads)](https://nodei.co/npm/node-searcher/) [![NPM](https://nodei.co/npm-dl/node-searcher.png)](https://nodei.co/npm/node-searcher/)


TF-IDF というアルゴリズムの、Node/Mongoでの実装になります。

|用語|説明|
|---|---|
|TF|Term Frequency (ある単語の、1文書内での出現確率)|
|DF|Document Frequency (ある単語を含む文書の、文書全体での出現確率)|
|IDF|Inverse DF (DFの逆数)|

TF は、1文書だけから求めることができる。
DF は、文書全部を調べる必要がある (→ バッチ処理が必要) 

以下、モジュール (index.js) での関数とのひもづけ

|関数|内容|
|---|---|
|parse|TFをもとめる|
|indexing|DFをもとめる|
|search|実際の検索処理|



Usage
-----
 1. 文書を登録した際に、parse を実行する。
 2. cron などで indexing を実行する。
 3. 検索時は、search を実行する。

 
System Requirements
-----

```
$ 
```




Installation command is `npm install node-wakame`.

### Quick example

```javascript
var should = require("should")
  ;


```

### Example 1

```javascript
```

### Example 2

```javascript
```

## License

MIT license, go wild.

