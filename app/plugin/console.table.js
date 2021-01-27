/*
 * Copyright (c) 2014 Gleb Bahmutov
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

function setupConsoleTable() {
	if (typeof console === 'undefined') {
	  throw new Error('Weird, console object is undefined');
	}
	if (typeof console.table === 'function') {
	  // if it is not OUR function, overwrite it
	  if (console.table === consoleTable) {
		return;
	  }
	}

	function isType(t, x) {
	  return typeof x === t;
	}

	var isString = isType.bind(null, 'string');

	function isArrayOf(isTypeFn, a) {
	  return Array.isArray(a) &&
		a.every(isTypeFn);
	}

	var isArrayOfStrings = isArrayOf.bind(null, isString);
	var isArrayOfArrays = isArrayOf.bind(null, Array.isArray);

	var Table = require('easy-table');

	function arrayToString(arr) {
	  var t = new Table();
	  arr.forEach(function (record) {
		if (typeof record === 'string' ||
		  typeof record === 'number') {
		  t.cell('item', record);
		} else {
		  // assume plain object
		  Object.keys(record).forEach(function (property) {
			t.cell(property, record[property]);
		  });
		}
		t.newRow();
	  });
	  return t.toString();
	}

	function printTableWithColumnTitles(titles, items,noConsole) {
	  var t = new Table();
	  items.forEach(function (item) {
		item.forEach(function (value, k) {
		  t.cell(titles[k], value);
		});
		t.newRow();
	  });
	  var str = t.toString();

	  return noConsole ? str : console.log(str);
	}

	function printTitleTable(title, arr) {
	  var str = arrayToString(arr);
	  var rowLength = str.indexOf('\n');
	  if (rowLength > 0) {
		if (title.length > rowLength) {
		  rowLength = title.length;
		}
		console.log(title);
		var sep = '-', k, line = '';
		for (k = 0; k < rowLength; k += 1) {
		  line += sep;
	   }
		console.log(line);
	  }
	  console.log(str);
	}

	function getTitleTable(title, arr) {
	  var str = arrayToString(arr);
	  var rowLength = str.indexOf('\n');
	  var strToReturn = '';
	  if (rowLength > 0) {
		if (title.length > rowLength) {
		  rowLength = title.length;
		}
		
		strToReturn += title + '\n';
		var sep = '-', k, line = '';
		for (k = 0; k < rowLength; k += 1) {
		  line += sep;
		}

		strToReturn += line + '\n';
	  }

	  return strToReturn + str;
	}

	function objectToArray(obj) {
	  var keys = Object.keys(obj);
	  return keys.map(function (key) {
		return {
		  key: key,
		  value: obj[key]
		};
	  });
	}

	function objectToString(obj) {
	  return arrayToString(objectToArray(obj));
	}

	function consoleTable () {
	  var args = Array.prototype.slice.call(arguments);

	  if (args.length === 2 &&
		typeof args[0] === 'string' &&
		Array.isArray(args[1])) {

		return printTitleTable(args[0], args[1]);
	  }

	  if (args.length === 2 &&
		isArrayOfStrings(args[0]) &&
		isArrayOfArrays(args[1])) {
		return printTableWithColumnTitles(args[0], args[1]);
	  }

	  args.forEach(function (k) {
		if (typeof k === 'string') {
		  return console.log(k);
		} else if (Array.isArray(k)) {
		  console.log(arrayToString(k));
		} else if (typeof k === 'object') {
		  console.log(objectToString(k));
		}
	  });
	}

	consoleTable.get = function(){
	  var args = Array.prototype.slice.call(arguments);

	  var strToReturn = '';

	  if (args.length === 2 &&
		typeof args[0] === 'string' &&
		Array.isArray(args[1])) {

		return getTitleTable(args[0], args[1]);
	  }

	  if (args.length === 2 &&
		isArrayOfStrings(args[0]) &&
		isArrayOfArrays(args[1])) {
		return printTableWithColumnTitles(args[0], args[1],true);
	  }

	  args.forEach(function (k,i) {
		if (typeof k === 'string') {
		  strToReturn += k;
	  if (i !== args.length - 1){
		strToReturn += '\n';
	  }
		  return ;
		} else if (Array.isArray(k)) {
		  strToReturn += arrayToString(k) + '\n';
		} else if (typeof k === 'object') {
		  strToReturn += objectToString(k);
		}
	  });

	  return strToReturn;
	};

	console.table = consoleTable;
}

setupConsoleTable();
