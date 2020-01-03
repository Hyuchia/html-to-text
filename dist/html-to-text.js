// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"G6CD":[function(require,module,exports) {
var define;
var global = arguments[3];
'use strict';

(function (global) {

    // minimal symbol polyfill for IE11 and others
    if (typeof Symbol !== 'function') {
        var Symbol = function(name) {
            return name;
        }

        Symbol.nonNative = true;
    }

    const STATE_PLAINTEXT = Symbol('plaintext');
    const STATE_HTML      = Symbol('html');
    const STATE_COMMENT   = Symbol('comment');

    const ALLOWED_TAGS_REGEX  = /<(\w*)>/g;
    const NORMALIZE_TAG_REGEX = /<\/?([^\s\/>]+)/;

    function striptags(html, allowable_tags, tag_replacement) {
        html            = html || '';
        allowable_tags  = allowable_tags || [];
        tag_replacement = tag_replacement || '';

        let context = init_context(allowable_tags, tag_replacement);

        return striptags_internal(html, context);
    }

    function init_striptags_stream(allowable_tags, tag_replacement) {
        allowable_tags  = allowable_tags || [];
        tag_replacement = tag_replacement || '';

        let context = init_context(allowable_tags, tag_replacement);

        return function striptags_stream(html) {
            return striptags_internal(html || '', context);
        };
    }

    striptags.init_streaming_mode = init_striptags_stream;

    function init_context(allowable_tags, tag_replacement) {
        allowable_tags = parse_allowable_tags(allowable_tags);

        return {
            allowable_tags : allowable_tags,
            tag_replacement: tag_replacement,

            state         : STATE_PLAINTEXT,
            tag_buffer    : '',
            depth         : 0,
            in_quote_char : ''
        };
    }

    function striptags_internal(html, context) {
        let allowable_tags  = context.allowable_tags;
        let tag_replacement = context.tag_replacement;

        let state         = context.state;
        let tag_buffer    = context.tag_buffer;
        let depth         = context.depth;
        let in_quote_char = context.in_quote_char;
        let output        = '';

        for (let idx = 0, length = html.length; idx < length; idx++) {
            let char = html[idx];

            if (state === STATE_PLAINTEXT) {
                switch (char) {
                    case '<':
                        state       = STATE_HTML;
                        tag_buffer += char;
                        break;

                    default:
                        output += char;
                        break;
                }
            }

            else if (state === STATE_HTML) {
                switch (char) {
                    case '<':
                        // ignore '<' if inside a quote
                        if (in_quote_char) {
                            break;
                        }

                        // we're seeing a nested '<'
                        depth++;
                        break;

                    case '>':
                        // ignore '>' if inside a quote
                        if (in_quote_char) {
                            break;
                        }

                        // something like this is happening: '<<>>'
                        if (depth) {
                            depth--;

                            break;
                        }

                        // this is closing the tag in tag_buffer
                        in_quote_char = '';
                        state         = STATE_PLAINTEXT;
                        tag_buffer   += '>';

                        if (allowable_tags.has(normalize_tag(tag_buffer))) {
                            output += tag_buffer;
                        } else {
                            output += tag_replacement;
                        }

                        tag_buffer = '';
                        break;

                    case '"':
                    case '\'':
                        // catch both single and double quotes

                        if (char === in_quote_char) {
                            in_quote_char = '';
                        } else {
                            in_quote_char = in_quote_char || char;
                        }

                        tag_buffer += char;
                        break;

                    case '-':
                        if (tag_buffer === '<!-') {
                            state = STATE_COMMENT;
                        }

                        tag_buffer += char;
                        break;

                    case ' ':
                    case '\n':
                        if (tag_buffer === '<') {
                            state      = STATE_PLAINTEXT;
                            output    += '< ';
                            tag_buffer = '';

                            break;
                        }

                        tag_buffer += char;
                        break;

                    default:
                        tag_buffer += char;
                        break;
                }
            }

            else if (state === STATE_COMMENT) {
                switch (char) {
                    case '>':
                        if (tag_buffer.slice(-2) == '--') {
                            // close the comment
                            state = STATE_PLAINTEXT;
                        }

                        tag_buffer = '';
                        break;

                    default:
                        tag_buffer += char;
                        break;
                }
            }
        }

        // save the context for future iterations
        context.state         = state;
        context.tag_buffer    = tag_buffer;
        context.depth         = depth;
        context.in_quote_char = in_quote_char;

        return output;
    }

    function parse_allowable_tags(allowable_tags) {
        let tag_set = new Set();

        if (typeof allowable_tags === 'string') {
            let match;

            while ((match = ALLOWED_TAGS_REGEX.exec(allowable_tags))) {
                tag_set.add(match[1]);
            }
        }

        else if (!Symbol.nonNative &&
                 typeof allowable_tags[Symbol.iterator] === 'function') {

            tag_set = new Set(allowable_tags);
        }

        else if (typeof allowable_tags.forEach === 'function') {
            // IE11 compatible
            allowable_tags.forEach(tag_set.add, tag_set);
        }

        return tag_set;
    }

    function normalize_tag(tag_buffer) {
        let match = NORMALIZE_TAG_REGEX.exec(tag_buffer);

        return match ? match[1].toLowerCase() : null;
    }

    if (typeof define === 'function' && define.amd) {
        // AMD
        define(function module_factory() { return striptags; });
    }

    else if (typeof module === 'object' && module.exports) {
        // Node
        module.exports = striptags;
    }

    else {
        // Browser
        global.striptags = striptags;
    }
}(this));

},{}],"FOZT":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compose = void 0;

var compose = function compose() {
  for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
    fns[_key] = arguments[_key];
  }

  return fns.reduce(function (f, g) {
    return function () {
      return f(g.apply(void 0, arguments));
    };
  });
};

exports.compose = compose;
},{}],"Focm":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _striptags = _interopRequireDefault(require("striptags"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var blocks = ['p', 'div', 'br', 'hr', 'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'li', 'pre', 'table', 'th', 'td', 'blockquote', 'header', 'footer', 'nav', 'section', 'summary', 'aside', 'article', 'address', 'code', 'img'];
var unparsable = ['audio', 'iframe', 'map', 'progress', 'track', 'meter', 'object', 'svg', 'wbr', 'video', 'webview', 'dialog', 'canvas'];

var preprocess = function preprocess(html) {
  return html;
};

var removeTextStyling = function removeTextStyling(html) {
  return html.replace(/<(\/)?(b|i|strong|em|font|sup|sub|small|del)>/g, '');
};

var removeUnparsableElements = function removeUnparsableElements(html) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = unparsable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var element = _step.value;
      html = html.replace(new RegExp("<".concat(element, "(.+?)?>(.+?)?</").concat(element, ">"), 'g'), '');
      html = html.replace(new RegExp("<".concat(element, "(.+?)?/>"), 'g'), '');
      html = html.replace(new RegExp("<".concat(element, "(.+?)>"), 'g'), '');
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return html;
}; // Remove all the elements that don't really matter


var removeSilentElements = function removeSilentElements(html) {
  return html.replace(/<(\/)?(ul|ol|span)+(.*?)>/g, '');
};

var parseLinks = function parseLinks(html) {
  // First parse all links that have some text
  html = html.replace(/<a(.+?)href="(.+?)"(.+?)?>(.+?)<\/a>/g, '$4 ($2)'); // Remove all those that doesn't

  return html.replace(/<a(.+?)href="(.+?)"(.+?)?>(.*?)<\/a>/g, '');
};

var parseImages = function parseImages(html) {
  // Parse images where the alt property is before the src one
  html = html.replace(/<img(.+?)alt="(.+?)"(.+?)src="(.+?)"(.*?)>/gm, 'Image: $2 ($4)'); // Parse images where the alt property is after the src one

  html = html.replace(/<img(.+?)src="(.+?)"(.+?)alt="(.+?)"(.*?)>/gm, 'Image: $4 ($2)'); // Parse images where no alt property was provided

  html = html.replace(/<img(.+?)src="(.+?)"(.*?)>/gm, 'Image: $2');
  return html;
};

var breakOnBlocks = function breakOnBlocks(html) {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = blocks[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var block = _step2.value;
      html = html.replace(new RegExp("</".concat(block, ">"), 'gm'), "</".concat(block, ">\n"));
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return html;
};

var removeExtraBreakLines = function removeExtraBreakLines(html) {
  return html.replace(/(\n\n)+/gm, '\n');
};

var removeBlocks = function removeBlocks(html) {
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = blocks[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var block = _step3.value;
      html = html.replace(new RegExp("<".concat(block, "(.*?)>"), 'gm'), '');
      html = html.replace(new RegExp("</".concat(block, "(.*?)>"), 'gm'), '');
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return html;
};

var parseListItems = function parseListItems(html) {
  // Parse list items that are not empty first
  html = html.replace(/<li(.*?)>(.+?)<\/li>/gm, '* $2\n'); // Remove the empty ones

  return html.replace(/<li(.*?)>(.*?)<\/li>/gm, '');
};

var replaceSpaces = function replaceSpaces(html) {
  return html.replace(/&nbsp;/gm, ' ');
};

var removeLeadingNewLines = function removeLeadingNewLines(html) {
  return html.replace(/\n+$/, '');
};

var removeTrailingNewLines = function removeTrailingNewLines(html) {
  return html.replace(/^\n+/, '');
};

var removeAllNonTagsToBreakOn = function removeAllNonTagsToBreakOn(html) {
  return (0, _striptags.default)(html, blocks);
};

var convertTagsToBreak = function convertTagsToBreak(html) {
  return (0, _striptags.default)(html, [], '\n');
};

var removeIndentation = function removeIndentation(html) {
  return html.replace(/(^\t+)/gm, '');
};

var htmlToText = (0, _utils.compose)( // removeIndentation,
// convertTagsToBreak,
// removeAllNonTagsToBreakOn,
// //removeExtraBreakLines,
// removeLeadingNewLines,
// removeTrailingNewLines,
// removeBlocks,
// breakOnBlocks,
parseImages, parseListItems, parseLinks, replaceSpaces, removeTextStyling, removeSilentElements, removeUnparsableElements, preprocess);
var _default = htmlToText;
exports.default = _default;
},{"striptags":"G6CD","./utils":"FOZT"}]},{},["Focm"], "HTMLToText")
//# sourceMappingURL=html-to-text.js.map