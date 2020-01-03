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
},{}],"UVmY":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  "&Tab;": "\t",
  "&NewLine;": "\n",
  "&excl;": "!",
  //"&quot;": "\"",
  //"&QUOT;": "\"",
  "&num;": "#",
  "&dollar;": "$",
  "&percnt;": "%",
  "&amp;": "&",
  "&AMP;": "&",
  "&apos;": "'",
  "&lpar;": "(",
  "&rpar;": ")",
  "&ast;": "*",
  "&midast;": "*",
  "&plus;": "+",
  "&comma;": ",",
  "&period;": ".",
  "&sol;": "/",
  "&colon;": ":",
  "&semi;": ";",
  // "&lt;": "<",
  // "&LT;": "<",
  "&equals;": "=",
  // "&gt;": ">",
  // "&GT;": ">",
  "&quest;": "?",
  "&commat;": "@",
  "&lsqb;": "[",
  "&lbrack;": "[",
  "&bsol;": "\\",
  "&rsqb;": "]",
  "&rbrack;": "]",
  "&Hat;": "^",
  "&lowbar;": "_",
  "&grave;": "`",
  "&DiacriticalGrave;": "`",
  "&lcub;": "{",
  "&lbrace;": "{",
  "&verbar;": "|",
  "&vert;": "|",
  "&VerticalLine;": "|",
  "&rcub;": "}",
  "&rbrace;": "}",
  "&nbsp;": " ",
  "&NonBreakingSpace;": " ",
  "&iexcl;": "¡",
  "&cent;": "¢",
  "&pound;": "£",
  "&curren;": "¤",
  "&yen;": "¥",
  "&brvbar;": "¦",
  "&sect;": "§",
  "&Dot;": "¨",
  "&die;": "¨",
  "&DoubleDot;": "¨",
  "&uml;": "¨",
  "&copy;": "©",
  "&COPY;": "©",
  "&ordf;": "ª",
  "&laquo;": "«",
  "&not;": "¬",
  "&shy;": "­",
  "&reg;": "®",
  "&circledR;": "®",
  "&REG;": "®",
  "&macr;": "¯",
  "&OverBar;": "¯",
  "&strns;": "¯",
  "&deg;": "°",
  "&plusmn;": "±",
  "&pm;": "±",
  "&PlusMinus;": "±",
  "&sup2;": "²",
  "&sup3;": "³",
  "&acute;": "´",
  "&DiacriticalAcute;": "´",
  "&micro;": "µ",
  "&para;": "¶",
  "&middot;": "·",
  "&centerdot;": "·",
  "&CenterDot;": "·",
  "&cedil;": "¸",
  "&Cedilla;": "¸",
  "&sup1;": "¹",
  "&ordm;": "º",
  "&raquo;": "»",
  "&frac14;": "¼",
  "&frac12;": "½",
  "&half;": "½",
  "&frac34;": "¾",
  "&iquest;": "¿",
  "&Agrave;": "À",
  "&Aacute;": "Á",
  "&Acirc;": "Â",
  "&Atilde;": "Ã",
  "&Auml;": "Ä",
  "&Aring;": "Å",
  "&AElig;": "Æ",
  "&Ccedil;": "Ç",
  "&Egrave;": "È",
  "&Eacute;": "É",
  "&Ecirc;": "Ê",
  "&Euml;": "Ë",
  "&Igrave;": "Ì",
  "&Iacute;": "Í",
  "&Icirc;": "Î",
  "&Iuml;": "Ï",
  "&ETH;": "Ð",
  "&Ntilde;": "Ñ",
  "&Ograve;": "Ò",
  "&Oacute;": "Ó",
  "&Ocirc;": "Ô",
  "&Otilde;": "Õ",
  "&Ouml;": "Ö",
  "&times;": "×",
  "&Oslash;": "Ø",
  "&Ugrave;": "Ù",
  "&Uacute;": "Ú",
  "&Ucirc;": "Û",
  "&Uuml;": "Ü",
  "&Yacute;": "Ý",
  "&THORN;": "Þ",
  "&szlig;": "ß",
  "&agrave;": "à",
  "&aacute;": "á",
  "&acirc;": "â",
  "&atilde;": "ã",
  "&auml;": "ä",
  "&aring;": "å",
  "&aelig;": "æ",
  "&ccedil;": "ç",
  "&egrave;": "è",
  "&eacute;": "é",
  "&ecirc;": "ê",
  "&euml;": "ë",
  "&igrave;": "ì",
  "&iacute;": "í",
  "&icirc;": "î",
  "&iuml;": "ï",
  "&eth;": "ð",
  "&ntilde;": "ñ",
  "&ograve;": "ò",
  "&oacute;": "ó",
  "&ocirc;": "ô",
  "&otilde;": "õ",
  "&ouml;": "ö",
  "&divide;": "÷",
  "&div;": "÷",
  "&oslash;": "ø",
  "&ugrave;": "ù",
  "&uacute;": "ú",
  "&ucirc;": "û",
  "&uuml;": "ü",
  "&yacute;": "ý",
  "&thorn;": "þ",
  "&yuml;": "ÿ",
  "&Amacr;": "Ā",
  "&amacr;": "ā",
  "&Abreve;": "Ă",
  "&abreve;": "ă",
  "&Aogon;": "Ą",
  "&aogon;": "ą",
  "&Cacute;": "Ć",
  "&cacute;": "ć",
  "&Ccirc;": "Ĉ",
  "&ccirc;": "ĉ",
  "&Cdot;": "Ċ",
  "&cdot;": "ċ",
  "&Ccaron;": "Č",
  "&ccaron;": "č",
  "&Dcaron;": "Ď",
  "&dcaron;": "ď",
  "&Dstrok;": "Đ",
  "&dstrok;": "đ",
  "&Emacr;": "Ē",
  "&emacr;": "ē",
  "&Edot;": "Ė",
  "&edot;": "ė",
  "&Eogon;": "Ę",
  "&eogon;": "ę",
  "&Ecaron;": "Ě",
  "&ecaron;": "ě",
  "&Gcirc;": "Ĝ",
  "&gcirc;": "ĝ",
  "&Gbreve;": "Ğ",
  "&gbreve;": "ğ",
  "&Gdot;": "Ġ",
  "&gdot;": "ġ",
  "&Gcedil;": "Ģ",
  "&Hcirc;": "Ĥ",
  "&hcirc;": "ĥ",
  "&Hstrok;": "Ħ",
  "&hstrok;": "ħ",
  "&Itilde;": "Ĩ",
  "&itilde;": "ĩ",
  "&Imacr;": "Ī",
  "&imacr;": "ī",
  "&Iogon;": "Į",
  "&iogon;": "į",
  "&Idot;": "İ",
  "&imath;": "ı",
  "&inodot;": "ı",
  "&IJlig;": "Ĳ",
  "&ijlig;": "ĳ",
  "&Jcirc;": "Ĵ",
  "&jcirc;": "ĵ",
  "&Kcedil;": "Ķ",
  "&kcedil;": "ķ",
  "&kgreen;": "ĸ",
  "&Lacute;": "Ĺ",
  "&lacute;": "ĺ",
  "&Lcedil;": "Ļ",
  "&lcedil;": "ļ",
  "&Lcaron;": "Ľ",
  "&lcaron;": "ľ",
  "&Lmidot;": "Ŀ",
  "&lmidot;": "ŀ",
  "&Lstrok;": "Ł",
  "&lstrok;": "ł",
  "&Nacute;": "Ń",
  "&nacute;": "ń",
  "&Ncedil;": "Ņ",
  "&ncedil;": "ņ",
  "&Ncaron;": "Ň",
  "&ncaron;": "ň",
  "&napos;": "ŉ",
  "&ENG;": "Ŋ",
  "&eng;": "ŋ",
  "&Omacr;": "Ō",
  "&omacr;": "ō",
  "&Odblac;": "Ő",
  "&odblac;": "ő",
  "&OElig;": "Œ",
  "&oelig;": "œ",
  "&Racute;": "Ŕ",
  "&racute;": "ŕ",
  "&Rcedil;": "Ŗ",
  "&rcedil;": "ŗ",
  "&Rcaron;": "Ř",
  "&rcaron;": "ř",
  "&Sacute;": "Ś",
  "&sacute;": "ś",
  "&Scirc;": "Ŝ",
  "&scirc;": "ŝ",
  "&Scedil;": "Ş",
  "&scedil;": "ş",
  "&Scaron;": "Š",
  "&scaron;": "š",
  "&Tcedil;": "Ţ",
  "&tcedil;": "ţ",
  "&Tcaron;": "Ť",
  "&tcaron;": "ť",
  "&Tstrok;": "Ŧ",
  "&tstrok;": "ŧ",
  "&Utilde;": "Ũ",
  "&utilde;": "ũ",
  "&Umacr;": "Ū",
  "&umacr;": "ū",
  "&Ubreve;": "Ŭ",
  "&ubreve;": "ŭ",
  "&Uring;": "Ů",
  "&uring;": "ů",
  "&Udblac;": "Ű",
  "&udblac;": "ű",
  "&Uogon;": "Ų",
  "&uogon;": "ų",
  "&Wcirc;": "Ŵ",
  "&wcirc;": "ŵ",
  "&Ycirc;": "Ŷ",
  "&ycirc;": "ŷ",
  "&Yuml;": "Ÿ",
  "&Zacute;": "Ź",
  "&zacute;": "ź",
  "&Zdot;": "Ż",
  "&zdot;": "ż",
  "&Zcaron;": "Ž",
  "&zcaron;": "ž",
  "&fnof;": "ƒ",
  "&imped;": "Ƶ",
  "&gacute;": "ǵ",
  "&jmath;": "ȷ",
  "&circ;": "ˆ",
  "&caron;": "ˇ",
  "&Hacek;": "ˇ",
  "&breve;": "˘",
  "&Breve;": "˘",
  "&dot;": "˙",
  "&DiacriticalDot;": "˙",
  "&ring;": "˚",
  "&ogon;": "˛",
  "&tilde;": "˜",
  "&DiacriticalTilde;": "˜",
  "&dblac;": "˝",
  "&DiacriticalDoubleAcute;": "˝",
  "&DownBreve;": "",
  "&UnderBar;": "",
  "&Alpha;": "Α",
  "&Beta;": "Β",
  "&Gamma;": "Γ",
  "&Delta;": "Δ",
  "&Epsilon;": "Ε",
  "&Zeta;": "Ζ",
  "&Eta;": "Η",
  "&Theta;": "Θ",
  "&Iota;": "Ι",
  "&Kappa;": "Κ",
  "&Lambda;": "Λ",
  "&Mu;": "Μ",
  "&Nu;": "Ν",
  "&Xi;": "Ξ",
  "&Omicron;": "Ο",
  "&Pi;": "Π",
  "&Rho;": "Ρ",
  "&Sigma;": "Σ",
  "&Tau;": "Τ",
  "&Upsilon;": "Υ",
  "&Phi;": "Φ",
  "&Chi;": "Χ",
  "&Psi;": "Ψ",
  "&Omega;": "Ω",
  "&alpha;": "α",
  "&beta;": "β",
  "&gamma;": "γ",
  "&delta;": "δ",
  "&epsiv;": "ε",
  "&varepsilon;": "ε",
  "&epsilon;": "ε",
  "&zeta;": "ζ",
  "&eta;": "η",
  "&theta;": "θ",
  "&iota;": "ι",
  "&kappa;": "κ",
  "&lambda;": "λ",
  "&mu;": "μ",
  "&nu;": "ν",
  "&xi;": "ξ",
  "&omicron;": "ο",
  "&pi;": "π",
  "&rho;": "ρ",
  "&sigmav;": "ς",
  "&varsigma;": "ς",
  "&sigmaf;": "ς",
  "&sigma;": "σ",
  "&tau;": "τ",
  "&upsi;": "υ",
  "&upsilon;": "υ",
  "&phi;": "φ",
  "&phiv;": "φ",
  "&varphi;": "φ",
  "&chi;": "χ",
  "&psi;": "ψ",
  "&omega;": "ω",
  "&thetav;": "ϑ",
  "&vartheta;": "ϑ",
  "&thetasym;": "ϑ",
  "&Upsi;": "ϒ",
  "&upsih;": "ϒ",
  "&straightphi;": "ϕ",
  "&piv;": "ϖ",
  "&varpi;": "ϖ",
  "&Gammad;": "Ϝ",
  "&gammad;": "ϝ",
  "&digamma;": "ϝ",
  "&kappav;": "ϰ",
  "&varkappa;": "ϰ",
  "&rhov;": "ϱ",
  "&varrho;": "ϱ",
  "&epsi;": "ϵ",
  "&straightepsilon;": "ϵ",
  "&bepsi;": "϶",
  "&backepsilon;": "϶",
  "&IOcy;": "Ё",
  "&DJcy;": "Ђ",
  "&GJcy;": "Ѓ",
  "&Jukcy;": "Є",
  "&DScy;": "Ѕ",
  "&Iukcy;": "І",
  "&YIcy;": "Ї",
  "&Jsercy;": "Ј",
  "&LJcy;": "Љ",
  "&NJcy;": "Њ",
  "&TSHcy;": "Ћ",
  "&KJcy;": "Ќ",
  "&Ubrcy;": "Ў",
  "&DZcy;": "Џ",
  "&Acy;": "А",
  "&Bcy;": "Б",
  "&Vcy;": "В",
  "&Gcy;": "Г",
  "&Dcy;": "Д",
  "&IEcy;": "Е",
  "&ZHcy;": "Ж",
  "&Zcy;": "З",
  "&Icy;": "И",
  "&Jcy;": "Й",
  "&Kcy;": "К",
  "&Lcy;": "Л",
  "&Mcy;": "М",
  "&Ncy;": "Н",
  "&Ocy;": "О",
  "&Pcy;": "П",
  "&Rcy;": "Р",
  "&Scy;": "С",
  "&Tcy;": "Т",
  "&Ucy;": "У",
  "&Fcy;": "Ф",
  "&KHcy;": "Х",
  "&TScy;": "Ц",
  "&CHcy;": "Ч",
  "&SHcy;": "Ш",
  "&SHCHcy;": "Щ",
  "&HARDcy;": "Ъ",
  "&Ycy;": "Ы",
  "&SOFTcy;": "Ь",
  "&Ecy;": "Э",
  "&YUcy;": "Ю",
  "&YAcy;": "Я",
  "&acy;": "а",
  "&bcy;": "б",
  "&vcy;": "в",
  "&gcy;": "г",
  "&dcy;": "д",
  "&iecy;": "е",
  "&zhcy;": "ж",
  "&zcy;": "з",
  "&icy;": "и",
  "&jcy;": "й",
  "&kcy;": "к",
  "&lcy;": "л",
  "&mcy;": "м",
  "&ncy;": "н",
  "&ocy;": "о",
  "&pcy;": "п",
  "&rcy;": "р",
  "&scy;": "с",
  "&tcy;": "т",
  "&ucy;": "у",
  "&fcy;": "ф",
  "&khcy;": "х",
  "&tscy;": "ц",
  "&chcy;": "ч",
  "&shcy;": "ш",
  "&shchcy;": "щ",
  "&hardcy;": "ъ",
  "&ycy;": "ы",
  "&softcy;": "ь",
  "&ecy;": "э",
  "&yucy;": "ю",
  "&yacy;": "я",
  "&iocy;": "ё",
  "&djcy;": "ђ",
  "&gjcy;": "ѓ",
  "&jukcy;": "є",
  "&dscy;": "ѕ",
  "&iukcy;": "і",
  "&yicy;": "ї",
  "&jsercy;": "ј",
  "&ljcy;": "љ",
  "&njcy;": "њ",
  "&tshcy;": "ћ",
  "&kjcy;": "ќ",
  "&ubrcy;": "ў",
  "&dzcy;": "џ",
  "&ensp;": " ",
  "&emsp;": " ",
  "&emsp13;": " ",
  "&emsp14;": " ",
  "&numsp;": " ",
  "&puncsp;": " ",
  "&thinsp;": " ",
  "&ThinSpace;": " ",
  "&hairsp;": " ",
  "&VeryThinSpace;": " ",
  "&ZeroWidthSpace;": "​",
  "&NegativeVeryThinSpace;": "​",
  "&NegativeThinSpace;": "​",
  "&NegativeMediumSpace;": "​",
  "&NegativeThickSpace;": "​",
  "&zwnj;": "",
  "&zwj;": "‍",
  "&lrm;": "‎",
  "&rlm;": "‏",
  "&hyphen;": "‐",
  "&dash;": "‐",
  "&ndash;": "–",
  "&mdash;": "—",
  "&horbar;": "―",
  "&Verbar;": "‖",
  "&Vert;": "‖",
  "&lsquo;": "‘",
  "&OpenCurlyQuote;": "‘",
  "&rsquo;": "’",
  "&rsquor;": "’",
  "&CloseCurlyQuote;": "’",
  "&lsquor;": "‚",
  "&sbquo;": "‚",
  "&ldquo;": "“",
  "&OpenCurlyDoubleQuote;": "“",
  "&rdquo;": "”",
  "&rdquor;": "”",
  "&CloseCurlyDoubleQuote;": "”",
  "&ldquor;": "„",
  "&bdquo;": "„",
  "&dagger;": "†",
  "&Dagger;": "‡",
  "&ddagger;": "‡",
  "&bull;": "•",
  "&bullet;": "•",
  "&nldr;": "‥",
  "&hellip;": "…",
  "&mldr;": "…",
  "&permil;": "‰",
  "&pertenk;": "‱",
  "&prime;": "′",
  "&Prime;": "″",
  "&tprime;": "‴",
  "&bprime;": "‵",
  "&backprime;": "‵",
  "&lsaquo;": "‹",
  "&rsaquo;": "›",
  "&oline;": "‾",
  "&caret;": "⁁",
  "&hybull;": "⁃",
  "&frasl;": "⁄",
  "&bsemi;": "⁏",
  "&qprime;": "⁗",
  "&MediumSpace;": " ",
  "&NoBreak;": "⁠",
  "&ApplyFunction;": "⁡",
  "&af;": "⁡",
  "&InvisibleTimes;": "⁢",
  "&it;": "⁢",
  "&InvisibleComma;": "⁣",
  "&ic;": "⁣",
  "&euro;": "€",
  "&tdot;": "",
  "&TripleDot;": "",
  "&DotDot;": "",
  "&Copf;": "ℂ",
  "&complexes;": "ℂ",
  "&incare;": "℅",
  "&gscr;": "ℊ",
  "&hamilt;": "ℋ",
  "&HilbertSpace;": "ℋ",
  "&Hscr;": "ℋ",
  "&Hfr;": "ℌ",
  "&Poincareplane;": "ℌ",
  "&quaternions;": "ℍ",
  "&Hopf;": "ℍ",
  "&planckh;": "ℎ",
  "&planck;": "ℏ",
  "&hbar;": "ℏ",
  "&plankv;": "ℏ",
  "&hslash;": "ℏ",
  "&Iscr;": "ℐ",
  "&imagline;": "ℐ",
  "&image;": "ℑ",
  "&Im;": "ℑ",
  "&imagpart;": "ℑ",
  "&Ifr;": "ℑ",
  "&Lscr;": "ℒ",
  "&lagran;": "ℒ",
  "&Laplacetrf;": "ℒ",
  "&ell;": "ℓ",
  "&Nopf;": "ℕ",
  "&naturals;": "ℕ",
  "&numero;": "№",
  "&copysr;": "℗",
  "&weierp;": "℘",
  "&wp;": "℘",
  "&Popf;": "ℙ",
  "&primes;": "ℙ",
  "&rationals;": "ℚ",
  "&Qopf;": "ℚ",
  "&Rscr;": "ℛ",
  "&realine;": "ℛ",
  "&real;": "ℜ",
  "&Re;": "ℜ",
  "&realpart;": "ℜ",
  "&Rfr;": "ℜ",
  "&reals;": "ℝ",
  "&Ropf;": "ℝ",
  "&rx;": "℞",
  "&trade;": "™",
  "&TRADE;": "™",
  "&integers;": "ℤ",
  "&Zopf;": "ℤ",
  "&ohm;": "Ω",
  "&mho;": "℧",
  "&Zfr;": "ℨ",
  "&zeetrf;": "ℨ",
  "&iiota;": "℩",
  "&angst;": "Å",
  "&bernou;": "ℬ",
  "&Bernoullis;": "ℬ",
  "&Bscr;": "ℬ",
  "&Cfr;": "ℭ",
  "&Cayleys;": "ℭ",
  "&escr;": "ℯ",
  "&Escr;": "ℰ",
  "&expectation;": "ℰ",
  "&Fscr;": "ℱ",
  "&Fouriertrf;": "ℱ",
  "&phmmat;": "ℳ",
  "&Mellintrf;": "ℳ",
  "&Mscr;": "ℳ",
  "&order;": "ℴ",
  "&orderof;": "ℴ",
  "&oscr;": "ℴ",
  "&alefsym;": "ℵ",
  "&aleph;": "ℵ",
  "&beth;": "ℶ",
  "&gimel;": "ℷ",
  "&daleth;": "ℸ",
  "&CapitalDifferentialD;": "ⅅ",
  "&DD;": "ⅅ",
  "&DifferentialD;": "ⅆ",
  "&dd;": "ⅆ",
  "&ExponentialE;": "ⅇ",
  "&exponentiale;": "ⅇ",
  "&ee;": "ⅇ",
  "&ImaginaryI;": "ⅈ",
  "&ii;": "ⅈ",
  "&frac13;": "⅓",
  "&frac23;": "⅔",
  "&frac15;": "⅕",
  "&frac25;": "⅖",
  "&frac35;": "⅗",
  "&frac45;": "⅘",
  "&frac16;": "⅙",
  "&frac56;": "⅚",
  "&frac18;": "⅛",
  "&frac38;": "⅜",
  "&frac58;": "⅝",
  "&frac78;": "⅞",
  "&larr;": "←",
  "&leftarrow;": "←",
  "&LeftArrow;": "←",
  "&slarr;": "←",
  "&ShortLeftArrow;": "←",
  "&uarr;": "↑",
  "&uparrow;": "↑",
  "&UpArrow;": "↑",
  "&ShortUpArrow;": "↑",
  "&rarr;": "→",
  "&rightarrow;": "→",
  "&RightArrow;": "→",
  "&srarr;": "→",
  "&ShortRightArrow;": "→",
  "&darr;": "↓",
  "&downarrow;": "↓",
  "&DownArrow;": "↓",
  "&ShortDownArrow;": "↓",
  "&harr;": "↔",
  "&leftrightarrow;": "↔",
  "&LeftRightArrow;": "↔",
  "&varr;": "↕",
  "&updownarrow;": "↕",
  "&UpDownArrow;": "↕",
  "&nwarr;": "↖",
  "&UpperLeftArrow;": "↖",
  "&nwarrow;": "↖",
  "&nearr;": "↗",
  "&UpperRightArrow;": "↗",
  "&nearrow;": "↗",
  "&searr;": "↘",
  "&searrow;": "↘",
  "&LowerRightArrow;": "↘",
  "&swarr;": "↙",
  "&swarrow;": "↙",
  "&LowerLeftArrow;": "↙",
  "&nlarr;": "↚",
  "&nleftarrow;": "↚",
  "&nrarr;": "↛",
  "&nrightarrow;": "↛",
  "&rarrw;": "↝",
  "&rightsquigarrow;": "↝",
  "&Larr;": "↞",
  "&twoheadleftarrow;": "↞",
  "&Uarr;": "↟",
  "&Rarr;": "↠",
  "&twoheadrightarrow;": "↠",
  "&Darr;": "↡",
  "&larrtl;": "↢",
  "&leftarrowtail;": "↢",
  "&rarrtl;": "↣",
  "&rightarrowtail;": "↣",
  "&LeftTeeArrow;": "↤",
  "&mapstoleft;": "↤",
  "&UpTeeArrow;": "↥",
  "&mapstoup;": "↥",
  "&map;": "↦",
  "&RightTeeArrow;": "↦",
  "&mapsto;": "↦",
  "&DownTeeArrow;": "↧",
  "&mapstodown;": "↧",
  "&larrhk;": "↩",
  "&hookleftarrow;": "↩",
  "&rarrhk;": "↪",
  "&hookrightarrow;": "↪",
  "&larrlp;": "↫",
  "&looparrowleft;": "↫",
  "&rarrlp;": "↬",
  "&looparrowright;": "↬",
  "&harrw;": "↭",
  "&leftrightsquigarrow;": "↭",
  "&nharr;": "↮",
  "&nleftrightarrow;": "↮",
  "&lsh;": "↰",
  "&Lsh;": "↰",
  "&rsh;": "↱",
  "&Rsh;": "↱",
  "&ldsh;": "↲",
  "&rdsh;": "↳",
  "&crarr;": "↵",
  "&cularr;": "↶",
  "&curvearrowleft;": "↶",
  "&curarr;": "↷",
  "&curvearrowright;": "↷",
  "&olarr;": "↺",
  "&circlearrowleft;": "↺",
  "&orarr;": "↻",
  "&circlearrowright;": "↻",
  "&lharu;": "↼",
  "&LeftVector;": "↼",
  "&leftharpoonup;": "↼",
  "&lhard;": "↽",
  "&leftharpoondown;": "↽",
  "&DownLeftVector;": "↽",
  "&uharr;": "↾",
  "&upharpoonright;": "↾",
  "&RightUpVector;": "↾",
  "&uharl;": "↿",
  "&upharpoonleft;": "↿",
  "&LeftUpVector;": "↿",
  "&rharu;": "⇀",
  "&RightVector;": "⇀",
  "&rightharpoonup;": "⇀",
  "&rhard;": "⇁",
  "&rightharpoondown;": "⇁",
  "&DownRightVector;": "⇁",
  "&dharr;": "⇂",
  "&RightDownVector;": "⇂",
  "&downharpoonright;": "⇂",
  "&dharl;": "⇃",
  "&LeftDownVector;": "⇃",
  "&downharpoonleft;": "⇃",
  "&rlarr;": "⇄",
  "&rightleftarrows;": "⇄",
  "&RightArrowLeftArrow;": "⇄",
  "&udarr;": "⇅",
  "&UpArrowDownArrow;": "⇅",
  "&lrarr;": "⇆",
  "&leftrightarrows;": "⇆",
  "&LeftArrowRightArrow;": "⇆",
  "&llarr;": "⇇",
  "&leftleftarrows;": "⇇",
  "&uuarr;": "⇈",
  "&upuparrows;": "⇈",
  "&rrarr;": "⇉",
  "&rightrightarrows;": "⇉",
  "&ddarr;": "⇊",
  "&downdownarrows;": "⇊",
  "&lrhar;": "⇋",
  "&ReverseEquilibrium;": "⇋",
  "&leftrightharpoons;": "⇋",
  "&rlhar;": "⇌",
  "&rightleftharpoons;": "⇌",
  "&Equilibrium;": "⇌",
  "&nlArr;": "⇍",
  "&nLeftarrow;": "⇍",
  "&nhArr;": "⇎",
  "&nLeftrightarrow;": "⇎",
  "&nrArr;": "⇏",
  "&nRightarrow;": "⇏",
  "&lArr;": "⇐",
  "&Leftarrow;": "⇐",
  "&DoubleLeftArrow;": "⇐",
  "&uArr;": "⇑",
  "&Uparrow;": "⇑",
  "&DoubleUpArrow;": "⇑",
  "&rArr;": "⇒",
  "&Rightarrow;": "⇒",
  "&Implies;": "⇒",
  "&DoubleRightArrow;": "⇒",
  "&dArr;": "⇓",
  "&Downarrow;": "⇓",
  "&DoubleDownArrow;": "⇓",
  "&hArr;": "⇔",
  "&Leftrightarrow;": "⇔",
  "&DoubleLeftRightArrow;": "⇔",
  "&iff;": "⇔",
  "&vArr;": "⇕",
  "&Updownarrow;": "⇕",
  "&DoubleUpDownArrow;": "⇕",
  "&nwArr;": "⇖",
  "&neArr;": "⇗",
  "&seArr;": "⇘",
  "&swArr;": "⇙",
  "&lAarr;": "⇚",
  "&Lleftarrow;": "⇚",
  "&rAarr;": "⇛",
  "&Rrightarrow;": "⇛",
  "&zigrarr;": "⇝",
  "&larrb;": "⇤",
  "&LeftArrowBar;": "⇤",
  "&rarrb;": "⇥",
  "&RightArrowBar;": "⇥",
  "&duarr;": "⇵",
  "&DownArrowUpArrow;": "⇵",
  "&loarr;": "⇽",
  "&roarr;": "⇾",
  "&hoarr;": "⇿",
  "&forall;": "∀",
  "&ForAll;": "∀",
  "&comp;": "∁",
  "&complement;": "∁",
  "&part;": "∂",
  "&PartialD;": "∂",
  "&exist;": "∃",
  "&Exists;": "∃",
  "&nexist;": "∄",
  "&NotExists;": "∄",
  "&nexists;": "∄",
  "&empty;": "∅",
  "&emptyset;": "∅",
  "&emptyv;": "∅",
  "&varnothing;": "∅",
  "&nabla;": "∇",
  "&Del;": "∇",
  "&isin;": "∈",
  "&isinv;": "∈",
  "&Element;": "∈",
  "&in;": "∈",
  "&notin;": "∉",
  "&NotElement;": "∉",
  "&notinva;": "∉",
  "&niv;": "∋",
  "&ReverseElement;": "∋",
  "&ni;": "∋",
  "&SuchThat;": "∋",
  "&notni;": "∌",
  "&notniva;": "∌",
  "&NotReverseElement;": "∌",
  "&prod;": "∏",
  "&Product;": "∏",
  "&coprod;": "∐",
  "&Coproduct;": "∐",
  "&sum;": "∑",
  "&Sum;": "∑",
  "&minus;": "−",
  "&mnplus;": "∓",
  "&mp;": "∓",
  "&MinusPlus;": "∓",
  "&plusdo;": "∔",
  "&dotplus;": "∔",
  "&setmn;": "∖",
  "&setminus;": "∖",
  "&Backslash;": "∖",
  "&ssetmn;": "∖",
  "&smallsetminus;": "∖",
  "&lowast;": "∗",
  "&compfn;": "∘",
  "&SmallCircle;": "∘",
  "&radic;": "√",
  "&Sqrt;": "√",
  "&prop;": "∝",
  "&propto;": "∝",
  "&Proportional;": "∝",
  "&vprop;": "∝",
  "&varpropto;": "∝",
  "&infin;": "∞",
  "&angrt;": "∟",
  "&ang;": "∠",
  "&angle;": "∠",
  "&angmsd;": "∡",
  "&measuredangle;": "∡",
  "&angsph;": "∢",
  "&mid;": "∣",
  "&VerticalBar;": "∣",
  "&smid;": "∣",
  "&shortmid;": "∣",
  "&nmid;": "∤",
  "&NotVerticalBar;": "∤",
  "&nsmid;": "∤",
  "&nshortmid;": "∤",
  "&par;": "∥",
  "&parallel;": "∥",
  "&DoubleVerticalBar;": "∥",
  "&spar;": "∥",
  "&shortparallel;": "∥",
  "&npar;": "∦",
  "&nparallel;": "∦",
  "&NotDoubleVerticalBar;": "∦",
  "&nspar;": "∦",
  "&nshortparallel;": "∦",
  "&and;": "∧",
  "&wedge;": "∧",
  "&or;": "∨",
  "&vee;": "∨",
  "&cap;": "∩",
  "&cup;": "∪",
  "&int;": "∫",
  "&Integral;": "∫",
  "&Int;": "∬",
  "&tint;": "∭",
  "&iiint;": "∭",
  "&conint;": "∮",
  "&oint;": "∮",
  "&ContourIntegral;": "∮",
  "&Conint;": "∯",
  "&DoubleContourIntegral;": "∯",
  "&Cconint;": "∰",
  "&cwint;": "∱",
  "&cwconint;": "∲",
  "&ClockwiseContourIntegral;": "∲",
  "&awconint;": "∳",
  "&CounterClockwiseContourIntegral;": "∳",
  "&there4;": "∴",
  "&therefore;": "∴",
  "&Therefore;": "∴",
  "&becaus;": "∵",
  "&because;": "∵",
  "&Because;": "∵",
  "&ratio;": "∶",
  "&Colon;": "∷",
  "&Proportion;": "∷",
  "&minusd;": "∸",
  "&dotminus;": "∸",
  "&mDDot;": "∺",
  "&homtht;": "∻",
  "&sim;": "∼",
  "&Tilde;": "∼",
  "&thksim;": "∼",
  "&thicksim;": "∼",
  "&bsim;": "∽",
  "&backsim;": "∽",
  "&ac;": "∾",
  "&mstpos;": "∾",
  "&acd;": "∿",
  "&wreath;": "≀",
  "&VerticalTilde;": "≀",
  "&wr;": "≀",
  "&nsim;": "≁",
  "&NotTilde;": "≁",
  "&esim;": "≂",
  "&EqualTilde;": "≂",
  "&eqsim;": "≂",
  "&sime;": "≃",
  "&TildeEqual;": "≃",
  "&simeq;": "≃",
  "&nsime;": "≄",
  "&nsimeq;": "≄",
  "&NotTildeEqual;": "≄",
  "&cong;": "≅",
  "&TildeFullEqual;": "≅",
  "&simne;": "≆",
  "&ncong;": "≇",
  "&NotTildeFullEqual;": "≇",
  "&asymp;": "≈",
  "&ap;": "≈",
  "&TildeTilde;": "≈",
  "&approx;": "≈",
  "&thkap;": "≈",
  "&thickapprox;": "≈",
  "&nap;": "≉",
  "&NotTildeTilde;": "≉",
  "&napprox;": "≉",
  "&ape;": "≊",
  "&approxeq;": "≊",
  "&apid;": "≋",
  "&bcong;": "≌",
  "&backcong;": "≌",
  "&asympeq;": "≍",
  "&CupCap;": "≍",
  "&bump;": "≎",
  "&HumpDownHump;": "≎",
  "&Bumpeq;": "≎",
  "&bumpe;": "≏",
  "&HumpEqual;": "≏",
  "&bumpeq;": "≏",
  "&esdot;": "≐",
  "&DotEqual;": "≐",
  "&doteq;": "≐",
  "&eDot;": "≑",
  "&doteqdot;": "≑",
  "&efDot;": "≒",
  "&fallingdotseq;": "≒",
  "&erDot;": "≓",
  "&risingdotseq;": "≓",
  "&colone;": "≔",
  "&coloneq;": "≔",
  "&Assign;": "≔",
  "&ecolon;": "≕",
  "&eqcolon;": "≕",
  "&ecir;": "≖",
  "&eqcirc;": "≖",
  "&cire;": "≗",
  "&circeq;": "≗",
  "&wedgeq;": "≙",
  "&veeeq;": "≚",
  "&trie;": "≜",
  "&triangleq;": "≜",
  "&equest;": "≟",
  "&questeq;": "≟",
  "&ne;": "≠",
  "&NotEqual;": "≠",
  "&equiv;": "≡",
  "&Congruent;": "≡",
  "&nequiv;": "≢",
  "&NotCongruent;": "≢",
  "&le;": "≤",
  "&leq;": "≤",
  "&ge;": "≥",
  "&GreaterEqual;": "≥",
  "&geq;": "≥",
  "&lE;": "≦",
  "&LessFullEqual;": "≦",
  "&leqq;": "≦",
  "&gE;": "≧",
  "&GreaterFullEqual;": "≧",
  "&geqq;": "≧",
  "&lnE;": "≨",
  "&lneqq;": "≨",
  "&gnE;": "≩",
  "&gneqq;": "≩",
  "&Lt;": "≪",
  "&NestedLessLess;": "≪",
  "&ll;": "≪",
  "&Gt;": "≫",
  "&NestedGreaterGreater;": "≫",
  "&gg;": "≫",
  "&twixt;": "≬",
  "&between;": "≬",
  "&NotCupCap;": "≭",
  "&nlt;": "≮",
  "&NotLess;": "≮",
  "&nless;": "≮",
  "&ngt;": "≯",
  "&NotGreater;": "≯",
  "&ngtr;": "≯",
  "&nle;": "≰",
  "&NotLessEqual;": "≰",
  "&nleq;": "≰",
  "&nge;": "≱",
  "&NotGreaterEqual;": "≱",
  "&ngeq;": "≱",
  "&lsim;": "≲",
  "&LessTilde;": "≲",
  "&lesssim;": "≲",
  "&gsim;": "≳",
  "&gtrsim;": "≳",
  "&GreaterTilde;": "≳",
  "&nlsim;": "≴",
  "&NotLessTilde;": "≴",
  "&ngsim;": "≵",
  "&NotGreaterTilde;": "≵",
  "&lg;": "≶",
  "&lessgtr;": "≶",
  "&LessGreater;": "≶",
  "&gl;": "≷",
  "&gtrless;": "≷",
  "&GreaterLess;": "≷",
  "&ntlg;": "≸",
  "&NotLessGreater;": "≸",
  "&ntgl;": "≹",
  "&NotGreaterLess;": "≹",
  "&pr;": "≺",
  "&Precedes;": "≺",
  "&prec;": "≺",
  "&sc;": "≻",
  "&Succeeds;": "≻",
  "&succ;": "≻",
  "&prcue;": "≼",
  "&PrecedesSlantEqual;": "≼",
  "&preccurlyeq;": "≼",
  "&sccue;": "≽",
  "&SucceedsSlantEqual;": "≽",
  "&succcurlyeq;": "≽",
  "&prsim;": "≾",
  "&precsim;": "≾",
  "&PrecedesTilde;": "≾",
  "&scsim;": "≿",
  "&succsim;": "≿",
  "&SucceedsTilde;": "≿",
  "&npr;": "⊀",
  "&nprec;": "⊀",
  "&NotPrecedes;": "⊀",
  "&nsc;": "⊁",
  "&nsucc;": "⊁",
  "&NotSucceeds;": "⊁",
  "&sub;": "⊂",
  "&subset;": "⊂",
  "&sup;": "⊃",
  "&supset;": "⊃",
  "&Superset;": "⊃",
  "&nsub;": "⊄",
  "&nsup;": "⊅",
  "&sube;": "⊆",
  "&SubsetEqual;": "⊆",
  "&subseteq;": "⊆",
  "&supe;": "⊇",
  "&supseteq;": "⊇",
  "&SupersetEqual;": "⊇",
  "&nsube;": "⊈",
  "&nsubseteq;": "⊈",
  "&NotSubsetEqual;": "⊈",
  "&nsupe;": "⊉",
  "&nsupseteq;": "⊉",
  "&NotSupersetEqual;": "⊉",
  "&subne;": "⊊",
  "&subsetneq;": "⊊",
  "&supne;": "⊋",
  "&supsetneq;": "⊋",
  "&cupdot;": "⊍",
  "&uplus;": "⊎",
  "&UnionPlus;": "⊎",
  "&sqsub;": "⊏",
  "&SquareSubset;": "⊏",
  "&sqsubset;": "⊏",
  "&sqsup;": "⊐",
  "&SquareSuperset;": "⊐",
  "&sqsupset;": "⊐",
  "&sqsube;": "⊑",
  "&SquareSubsetEqual;": "⊑",
  "&sqsubseteq;": "⊑",
  "&sqsupe;": "⊒",
  "&SquareSupersetEqual;": "⊒",
  "&sqsupseteq;": "⊒",
  "&sqcap;": "⊓",
  "&SquareIntersection;": "⊓",
  "&sqcup;": "⊔",
  "&SquareUnion;": "⊔",
  "&oplus;": "⊕",
  "&CirclePlus;": "⊕",
  "&ominus;": "⊖",
  "&CircleMinus;": "⊖",
  "&otimes;": "⊗",
  "&CircleTimes;": "⊗",
  "&osol;": "⊘",
  "&odot;": "⊙",
  "&CircleDot;": "⊙",
  "&ocir;": "⊚",
  "&circledcirc;": "⊚",
  "&oast;": "⊛",
  "&circledast;": "⊛",
  "&odash;": "⊝",
  "&circleddash;": "⊝",
  "&plusb;": "⊞",
  "&boxplus;": "⊞",
  "&minusb;": "⊟",
  "&boxminus;": "⊟",
  "&timesb;": "⊠",
  "&boxtimes;": "⊠",
  "&sdotb;": "⊡",
  "&dotsquare;": "⊡",
  "&vdash;": "⊢",
  "&RightTee;": "⊢",
  "&dashv;": "⊣",
  "&LeftTee;": "⊣",
  "&top;": "⊤",
  "&DownTee;": "⊤",
  "&bottom;": "⊥",
  "&bot;": "⊥",
  "&perp;": "⊥",
  "&UpTee;": "⊥",
  "&models;": "⊧",
  "&vDash;": "⊨",
  "&DoubleRightTee;": "⊨",
  "&Vdash;": "⊩",
  "&Vvdash;": "⊪",
  "&VDash;": "⊫",
  "&nvdash;": "⊬",
  "&nvDash;": "⊭",
  "&nVdash;": "⊮",
  "&nVDash;": "⊯",
  "&prurel;": "⊰",
  "&vltri;": "⊲",
  "&vartriangleleft;": "⊲",
  "&LeftTriangle;": "⊲",
  "&vrtri;": "⊳",
  "&vartriangleright;": "⊳",
  "&RightTriangle;": "⊳",
  "&ltrie;": "⊴",
  "&trianglelefteq;": "⊴",
  "&LeftTriangleEqual;": "⊴",
  "&rtrie;": "⊵",
  "&trianglerighteq;": "⊵",
  "&RightTriangleEqual;": "⊵",
  "&origof;": "⊶",
  "&imof;": "⊷",
  "&mumap;": "⊸",
  "&multimap;": "⊸",
  "&hercon;": "⊹",
  "&intcal;": "⊺",
  "&intercal;": "⊺",
  "&veebar;": "⊻",
  "&barvee;": "⊽",
  "&angrtvb;": "⊾",
  "&lrtri;": "⊿",
  "&xwedge;": "⋀",
  "&Wedge;": "⋀",
  "&bigwedge;": "⋀",
  "&xvee;": "⋁",
  "&Vee;": "⋁",
  "&bigvee;": "⋁",
  "&xcap;": "⋂",
  "&Intersection;": "⋂",
  "&bigcap;": "⋂",
  "&xcup;": "⋃",
  "&Union;": "⋃",
  "&bigcup;": "⋃",
  "&diam;": "⋄",
  "&diamond;": "⋄",
  "&Diamond;": "⋄",
  "&sdot;": "⋅",
  "&sstarf;": "⋆",
  "&Star;": "⋆",
  "&divonx;": "⋇",
  "&divideontimes;": "⋇",
  "&bowtie;": "⋈",
  "&ltimes;": "⋉",
  "&rtimes;": "⋊",
  "&lthree;": "⋋",
  "&leftthreetimes;": "⋋",
  "&rthree;": "⋌",
  "&rightthreetimes;": "⋌",
  "&bsime;": "⋍",
  "&backsimeq;": "⋍",
  "&cuvee;": "⋎",
  "&curlyvee;": "⋎",
  "&cuwed;": "⋏",
  "&curlywedge;": "⋏",
  "&Sub;": "⋐",
  "&Subset;": "⋐",
  "&Sup;": "⋑",
  "&Supset;": "⋑",
  "&Cap;": "⋒",
  "&Cup;": "⋓",
  "&fork;": "⋔",
  "&pitchfork;": "⋔",
  "&epar;": "⋕",
  "&ltdot;": "⋖",
  "&lessdot;": "⋖",
  "&gtdot;": "⋗",
  "&gtrdot;": "⋗",
  "&Ll;": "⋘",
  "&Gg;": "⋙",
  "&ggg;": "⋙",
  "&leg;": "⋚",
  "&LessEqualGreater;": "⋚",
  "&lesseqgtr;": "⋚",
  "&gel;": "⋛",
  "&gtreqless;": "⋛",
  "&GreaterEqualLess;": "⋛",
  "&cuepr;": "⋞",
  "&curlyeqprec;": "⋞",
  "&cuesc;": "⋟",
  "&curlyeqsucc;": "⋟",
  "&nprcue;": "⋠",
  "&NotPrecedesSlantEqual;": "⋠",
  "&nsccue;": "⋡",
  "&NotSucceedsSlantEqual;": "⋡",
  "&nsqsube;": "⋢",
  "&NotSquareSubsetEqual;": "⋢",
  "&nsqsupe;": "⋣",
  "&NotSquareSupersetEqual;": "⋣",
  "&lnsim;": "⋦",
  "&gnsim;": "⋧",
  "&prnsim;": "⋨",
  "&precnsim;": "⋨",
  "&scnsim;": "⋩",
  "&succnsim;": "⋩",
  "&nltri;": "⋪",
  "&ntriangleleft;": "⋪",
  "&NotLeftTriangle;": "⋪",
  "&nrtri;": "⋫",
  "&ntriangleright;": "⋫",
  "&NotRightTriangle;": "⋫",
  "&nltrie;": "⋬",
  "&ntrianglelefteq;": "⋬",
  "&NotLeftTriangleEqual;": "⋬",
  "&nrtrie;": "⋭",
  "&ntrianglerighteq;": "⋭",
  "&NotRightTriangleEqual;": "⋭",
  "&vellip;": "⋮",
  "&ctdot;": "⋯",
  "&utdot;": "⋰",
  "&dtdot;": "⋱",
  "&disin;": "⋲",
  "&isinsv;": "⋳",
  "&isins;": "⋴",
  "&isindot;": "⋵",
  "&notinvc;": "⋶",
  "&notinvb;": "⋷",
  "&isinE;": "⋹",
  "&nisd;": "⋺",
  "&xnis;": "⋻",
  "&nis;": "⋼",
  "&notnivc;": "⋽",
  "&notnivb;": "⋾",
  "&barwed;": "⌅",
  "&barwedge;": "⌅",
  "&Barwed;": "⌆",
  "&doublebarwedge;": "⌆",
  "&lceil;": "⌈",
  "&LeftCeiling;": "⌈",
  "&rceil;": "⌉",
  "&RightCeiling;": "⌉",
  "&lfloor;": "⌊",
  "&LeftFloor;": "⌊",
  "&rfloor;": "⌋",
  "&RightFloor;": "⌋",
  "&drcrop;": "⌌",
  "&dlcrop;": "⌍",
  "&urcrop;": "⌎",
  "&ulcrop;": "⌏",
  "&bnot;": "⌐",
  "&profline;": "⌒",
  "&profsurf;": "⌓",
  "&telrec;": "⌕",
  "&target;": "⌖",
  "&ulcorn;": "⌜",
  "&ulcorner;": "⌜",
  "&urcorn;": "⌝",
  "&urcorner;": "⌝",
  "&dlcorn;": "⌞",
  "&llcorner;": "⌞",
  "&drcorn;": "⌟",
  "&lrcorner;": "⌟",
  "&frown;": "⌢",
  "&sfrown;": "⌢",
  "&smile;": "⌣",
  "&ssmile;": "⌣",
  "&cylcty;": "⌭",
  "&profalar;": "⌮",
  "&topbot;": "⌶",
  "&ovbar;": "⌽",
  "&solbar;": "⌿",
  "&angzarr;": "⍼",
  "&lmoust;": "⎰",
  "&lmoustache;": "⎰",
  "&rmoust;": "⎱",
  "&rmoustache;": "⎱",
  "&tbrk;": "⎴",
  "&OverBracket;": "⎴",
  "&bbrk;": "⎵",
  "&UnderBracket;": "⎵",
  "&bbrktbrk;": "⎶",
  "&OverParenthesis;": "⏜",
  "&UnderParenthesis;": "⏝",
  "&OverBrace;": "⏞",
  "&UnderBrace;": "⏟",
  "&trpezium;": "⏢",
  "&elinters;": "⏧",
  "&blank;": "␣",
  "&oS;": "Ⓢ",
  "&circledS;": "Ⓢ",
  "&boxh;": "─",
  "&HorizontalLine;": "─",
  "&boxv;": "│",
  "&boxdr;": "┌",
  "&boxdl;": "┐",
  "&boxur;": "└",
  "&boxul;": "┘",
  "&boxvr;": "├",
  "&boxvl;": "┤",
  "&boxhd;": "┬",
  "&boxhu;": "┴",
  "&boxvh;": "┼",
  "&boxH;": "═",
  "&boxV;": "║",
  "&boxdR;": "╒",
  "&boxDr;": "╓",
  "&boxDR;": "╔",
  "&boxdL;": "╕",
  "&boxDl;": "╖",
  "&boxDL;": "╗",
  "&boxuR;": "╘",
  "&boxUr;": "╙",
  "&boxUR;": "╚",
  "&boxuL;": "╛",
  "&boxUl;": "╜",
  "&boxUL;": "╝",
  "&boxvR;": "╞",
  "&boxVr;": "╟",
  "&boxVR;": "╠",
  "&boxvL;": "╡",
  "&boxVl;": "╢",
  "&boxVL;": "╣",
  "&boxHd;": "╤",
  "&boxhD;": "╥",
  "&boxHD;": "╦",
  "&boxHu;": "╧",
  "&boxhU;": "╨",
  "&boxHU;": "╩",
  "&boxvH;": "╪",
  "&boxVh;": "╫",
  "&boxVH;": "╬",
  "&uhblk;": "▀",
  "&lhblk;": "▄",
  "&block;": "█",
  "&blk14;": "░",
  "&blk12;": "▒",
  "&blk34;": "▓",
  "&squ;": "□",
  "&square;": "□",
  "&Square;": "□",
  "&squf;": "▪",
  "&squarf;": "▪",
  "&blacksquare;": "▪",
  "&FilledVerySmallSquare;": "▪",
  "&EmptyVerySmallSquare;": "▫",
  "&rect;": "▭",
  "&marker;": "▮",
  "&fltns;": "▱",
  "&xutri;": "△",
  "&bigtriangleup;": "△",
  "&utrif;": "▴",
  "&blacktriangle;": "▴",
  "&utri;": "▵",
  "&triangle;": "▵",
  "&rtrif;": "▸",
  "&blacktriangleright;": "▸",
  "&rtri;": "▹",
  "&triangleright;": "▹",
  "&xdtri;": "▽",
  "&bigtriangledown;": "▽",
  "&dtrif;": "▾",
  "&blacktriangledown;": "▾",
  "&dtri;": "▿",
  "&triangledown;": "▿",
  "&ltrif;": "◂",
  "&blacktriangleleft;": "◂",
  "&ltri;": "◃",
  "&triangleleft;": "◃",
  "&loz;": "◊",
  "&lozenge;": "◊",
  "&cir;": "○",
  "&tridot;": "◬",
  "&xcirc;": "◯",
  "&bigcirc;": "◯",
  "&ultri;": "◸",
  "&urtri;": "◹",
  "&lltri;": "◺",
  "&EmptySmallSquare;": "◻",
  "&FilledSmallSquare;": "◼",
  "&starf;": "★",
  "&bigstar;": "★",
  "&star;": "☆",
  "&phone;": "☎",
  "&female;": "♀",
  "&male;": "♂",
  "&spades;": "♠",
  "&spadesuit;": "♠",
  "&clubs;": "♣",
  "&clubsuit;": "♣",
  "&hearts;": "♥",
  "&heartsuit;": "♥",
  "&diams;": "♦",
  "&diamondsuit;": "♦",
  "&sung;": "♪",
  "&flat;": "♭",
  "&natur;": "♮",
  "&natural;": "♮",
  "&sharp;": "♯",
  "&check;": "✓",
  "&checkmark;": "✓",
  "&cross;": "✗",
  "&malt;": "✠",
  "&maltese;": "✠",
  "&sext;": "✶",
  "&VerticalSeparator;": "❘",
  "&lbbrk;": "❲",
  "&rbbrk;": "❳",
  "&lobrk;": "⟦",
  "&LeftDoubleBracket;": "⟦",
  "&robrk;": "⟧",
  "&RightDoubleBracket;": "⟧",
  "&lang;": "⟨",
  "&LeftAngleBracket;": "⟨",
  "&langle;": "⟨",
  "&rang;": "⟩",
  "&RightAngleBracket;": "⟩",
  "&rangle;": "⟩",
  "&Lang;": "⟪",
  "&Rang;": "⟫",
  "&loang;": "⟬",
  "&roang;": "⟭",
  "&xlarr;": "⟵",
  "&longleftarrow;": "⟵",
  "&LongLeftArrow;": "⟵",
  "&xrarr;": "⟶",
  "&longrightarrow;": "⟶",
  "&LongRightArrow;": "⟶",
  "&xharr;": "⟷",
  "&longleftrightarrow;": "⟷",
  "&LongLeftRightArrow;": "⟷",
  "&xlArr;": "⟸",
  "&Longleftarrow;": "⟸",
  "&DoubleLongLeftArrow;": "⟸",
  "&xrArr;": "⟹",
  "&Longrightarrow;": "⟹",
  "&DoubleLongRightArrow;": "⟹",
  "&xhArr;": "⟺",
  "&Longleftrightarrow;": "⟺",
  "&DoubleLongLeftRightArrow;": "⟺",
  "&xmap;": "⟼",
  "&longmapsto;": "⟼",
  "&dzigrarr;": "⟿",
  "&nvlArr;": "⤂",
  "&nvrArr;": "⤃",
  "&nvHarr;": "⤄",
  "&Map;": "⤅",
  "&lbarr;": "⤌",
  "&rbarr;": "⤍",
  "&bkarow;": "⤍",
  "&lBarr;": "⤎",
  "&rBarr;": "⤏",
  "&dbkarow;": "⤏",
  "&RBarr;": "⤐",
  "&drbkarow;": "⤐",
  "&DDotrahd;": "⤑",
  "&UpArrowBar;": "⤒",
  "&DownArrowBar;": "⤓",
  "&Rarrtl;": "⤖",
  "&latail;": "⤙",
  "&ratail;": "⤚",
  "&lAtail;": "⤛",
  "&rAtail;": "⤜",
  "&larrfs;": "⤝",
  "&rarrfs;": "⤞",
  "&larrbfs;": "⤟",
  "&rarrbfs;": "⤠",
  "&nwarhk;": "⤣",
  "&nearhk;": "⤤",
  "&searhk;": "⤥",
  "&hksearow;": "⤥",
  "&swarhk;": "⤦",
  "&hkswarow;": "⤦",
  "&nwnear;": "⤧",
  "&nesear;": "⤨",
  "&toea;": "⤨",
  "&seswar;": "⤩",
  "&tosa;": "⤩",
  "&swnwar;": "⤪",
  "&rarrc;": "⤳",
  "&cudarrr;": "⤵",
  "&ldca;": "⤶",
  "&rdca;": "⤷",
  "&cudarrl;": "⤸",
  "&larrpl;": "⤹",
  "&curarrm;": "⤼",
  "&cularrp;": "⤽",
  "&rarrpl;": "⥅",
  "&harrcir;": "⥈",
  "&Uarrocir;": "⥉",
  "&lurdshar;": "⥊",
  "&ldrushar;": "⥋",
  "&LeftRightVector;": "⥎",
  "&RightUpDownVector;": "⥏",
  "&DownLeftRightVector;": "⥐",
  "&LeftUpDownVector;": "⥑",
  "&LeftVectorBar;": "⥒",
  "&RightVectorBar;": "⥓",
  "&RightUpVectorBar;": "⥔",
  "&RightDownVectorBar;": "⥕",
  "&DownLeftVectorBar;": "⥖",
  "&DownRightVectorBar;": "⥗",
  "&LeftUpVectorBar;": "⥘",
  "&LeftDownVectorBar;": "⥙",
  "&LeftTeeVector;": "⥚",
  "&RightTeeVector;": "⥛",
  "&RightUpTeeVector;": "⥜",
  "&RightDownTeeVector;": "⥝",
  "&DownLeftTeeVector;": "⥞",
  "&DownRightTeeVector;": "⥟",
  "&LeftUpTeeVector;": "⥠",
  "&LeftDownTeeVector;": "⥡",
  "&lHar;": "⥢",
  "&uHar;": "⥣",
  "&rHar;": "⥤",
  "&dHar;": "⥥",
  "&luruhar;": "⥦",
  "&ldrdhar;": "⥧",
  "&ruluhar;": "⥨",
  "&rdldhar;": "⥩",
  "&lharul;": "⥪",
  "&llhard;": "⥫",
  "&rharul;": "⥬",
  "&lrhard;": "⥭",
  "&udhar;": "⥮",
  "&UpEquilibrium;": "⥮",
  "&duhar;": "⥯",
  "&ReverseUpEquilibrium;": "⥯",
  "&RoundImplies;": "⥰",
  "&erarr;": "⥱",
  "&simrarr;": "⥲",
  "&larrsim;": "⥳",
  "&rarrsim;": "⥴",
  "&rarrap;": "⥵",
  "&ltlarr;": "⥶",
  "&gtrarr;": "⥸",
  "&subrarr;": "⥹",
  "&suplarr;": "⥻",
  "&lfisht;": "⥼",
  "&rfisht;": "⥽",
  "&ufisht;": "⥾",
  "&dfisht;": "⥿",
  "&lopar;": "⦅",
  "&ropar;": "⦆",
  "&lbrke;": "⦋",
  "&rbrke;": "⦌",
  "&lbrkslu;": "⦍",
  "&rbrksld;": "⦎",
  "&lbrksld;": "⦏",
  "&rbrkslu;": "⦐",
  "&langd;": "⦑",
  "&rangd;": "⦒",
  "&lparlt;": "⦓",
  "&rpargt;": "⦔",
  "&gtlPar;": "⦕",
  "&ltrPar;": "⦖",
  "&vzigzag;": "⦚",
  "&vangrt;": "⦜",
  "&angrtvbd;": "⦝",
  "&ange;": "⦤",
  "&range;": "⦥",
  "&dwangle;": "⦦",
  "&uwangle;": "⦧",
  "&angmsdaa;": "⦨",
  "&angmsdab;": "⦩",
  "&angmsdac;": "⦪",
  "&angmsdad;": "⦫",
  "&angmsdae;": "⦬",
  "&angmsdaf;": "⦭",
  "&angmsdag;": "⦮",
  "&angmsdah;": "⦯",
  "&bemptyv;": "⦰",
  "&demptyv;": "⦱",
  "&cemptyv;": "⦲",
  "&raemptyv;": "⦳",
  "&laemptyv;": "⦴",
  "&ohbar;": "⦵",
  "&omid;": "⦶",
  "&opar;": "⦷",
  "&operp;": "⦹",
  "&olcross;": "⦻",
  "&odsold;": "⦼",
  "&olcir;": "⦾",
  "&ofcir;": "⦿",
  "&olt;": "⧀",
  "&ogt;": "⧁",
  "&cirscir;": "⧂",
  "&cirE;": "⧃",
  "&solb;": "⧄",
  "&bsolb;": "⧅",
  "&boxbox;": "⧉",
  "&trisb;": "⧍",
  "&rtriltri;": "⧎",
  "&LeftTriangleBar;": "⧏",
  "&RightTriangleBar;": "⧐",
  "&race;": "⧚",
  "&iinfin;": "⧜",
  "&infintie;": "⧝",
  "&nvinfin;": "⧞",
  "&eparsl;": "⧣",
  "&smeparsl;": "⧤",
  "&eqvparsl;": "⧥",
  "&lozf;": "⧫",
  "&blacklozenge;": "⧫",
  "&RuleDelayed;": "⧴",
  "&dsol;": "⧶",
  "&xodot;": "⨀",
  "&bigodot;": "⨀",
  "&xoplus;": "⨁",
  "&bigoplus;": "⨁",
  "&xotime;": "⨂",
  "&bigotimes;": "⨂",
  "&xuplus;": "⨄",
  "&biguplus;": "⨄",
  "&xsqcup;": "⨆",
  "&bigsqcup;": "⨆",
  "&qint;": "⨌",
  "&iiiint;": "⨌",
  "&fpartint;": "⨍",
  "&cirfnint;": "⨐",
  "&awint;": "⨑",
  "&rppolint;": "⨒",
  "&scpolint;": "⨓",
  "&npolint;": "⨔",
  "&pointint;": "⨕",
  "&quatint;": "⨖",
  "&intlarhk;": "⨗",
  "&pluscir;": "⨢",
  "&plusacir;": "⨣",
  "&simplus;": "⨤",
  "&plusdu;": "⨥",
  "&plussim;": "⨦",
  "&plustwo;": "⨧",
  "&mcomma;": "⨩",
  "&minusdu;": "⨪",
  "&loplus;": "⨭",
  "&roplus;": "⨮",
  "&Cross;": "⨯",
  "&timesd;": "⨰",
  "&timesbar;": "⨱",
  "&smashp;": "⨳",
  "&lotimes;": "⨴",
  "&rotimes;": "⨵",
  "&otimesas;": "⨶",
  "&Otimes;": "⨷",
  "&odiv;": "⨸",
  "&triplus;": "⨹",
  "&triminus;": "⨺",
  "&tritime;": "⨻",
  "&iprod;": "⨼",
  "&intprod;": "⨼",
  "&amalg;": "⨿",
  "&capdot;": "⩀",
  "&ncup;": "⩂",
  "&ncap;": "⩃",
  "&capand;": "⩄",
  "&cupor;": "⩅",
  "&cupcap;": "⩆",
  "&capcup;": "⩇",
  "&cupbrcap;": "⩈",
  "&capbrcup;": "⩉",
  "&cupcup;": "⩊",
  "&capcap;": "⩋",
  "&ccups;": "⩌",
  "&ccaps;": "⩍",
  "&ccupssm;": "⩐",
  "&And;": "⩓",
  "&Or;": "⩔",
  "&andand;": "⩕",
  "&oror;": "⩖",
  "&orslope;": "⩗",
  "&andslope;": "⩘",
  "&andv;": "⩚",
  "&orv;": "⩛",
  "&andd;": "⩜",
  "&ord;": "⩝",
  "&wedbar;": "⩟",
  "&sdote;": "⩦",
  "&simdot;": "⩪",
  "&congdot;": "⩭",
  "&easter;": "⩮",
  "&apacir;": "⩯",
  "&apE;": "⩰",
  "&eplus;": "⩱",
  "&pluse;": "⩲",
  "&Esim;": "⩳",
  "&Colone;": "⩴",
  "&Equal;": "⩵",
  "&eDDot;": "⩷",
  "&ddotseq;": "⩷",
  "&equivDD;": "⩸",
  "&ltcir;": "⩹",
  "&gtcir;": "⩺",
  "&ltquest;": "⩻",
  "&gtquest;": "⩼",
  "&les;": "⩽",
  "&LessSlantEqual;": "⩽",
  "&leqslant;": "⩽",
  "&ges;": "⩾",
  "&GreaterSlantEqual;": "⩾",
  "&geqslant;": "⩾",
  "&lesdot;": "⩿",
  "&gesdot;": "⪀",
  "&lesdoto;": "⪁",
  "&gesdoto;": "⪂",
  "&lesdotor;": "⪃",
  "&gesdotol;": "⪄",
  "&lap;": "⪅",
  "&lessapprox;": "⪅",
  "&gap;": "⪆",
  "&gtrapprox;": "⪆",
  "&lne;": "⪇",
  "&lneq;": "⪇",
  "&gne;": "⪈",
  "&gneq;": "⪈",
  "&lnap;": "⪉",
  "&lnapprox;": "⪉",
  "&gnap;": "⪊",
  "&gnapprox;": "⪊",
  "&lEg;": "⪋",
  "&lesseqqgtr;": "⪋",
  "&gEl;": "⪌",
  "&gtreqqless;": "⪌",
  "&lsime;": "⪍",
  "&gsime;": "⪎",
  "&lsimg;": "⪏",
  "&gsiml;": "⪐",
  "&lgE;": "⪑",
  "&glE;": "⪒",
  "&lesges;": "⪓",
  "&gesles;": "⪔",
  "&els;": "⪕",
  "&eqslantless;": "⪕",
  "&egs;": "⪖",
  "&eqslantgtr;": "⪖",
  "&elsdot;": "⪗",
  "&egsdot;": "⪘",
  "&el;": "⪙",
  "&eg;": "⪚",
  "&siml;": "⪝",
  "&simg;": "⪞",
  "&simlE;": "⪟",
  "&simgE;": "⪠",
  "&LessLess;": "⪡",
  "&GreaterGreater;": "⪢",
  "&glj;": "⪤",
  "&gla;": "⪥",
  "&ltcc;": "⪦",
  "&gtcc;": "⪧",
  "&lescc;": "⪨",
  "&gescc;": "⪩",
  "&smt;": "⪪",
  "&lat;": "⪫",
  "&smte;": "⪬",
  "&late;": "⪭",
  "&bumpE;": "⪮",
  "&pre;": "⪯",
  "&preceq;": "⪯",
  "&PrecedesEqual;": "⪯",
  "&sce;": "⪰",
  "&succeq;": "⪰",
  "&SucceedsEqual;": "⪰",
  "&prE;": "⪳",
  "&scE;": "⪴",
  "&prnE;": "⪵",
  "&precneqq;": "⪵",
  "&scnE;": "⪶",
  "&succneqq;": "⪶",
  "&prap;": "⪷",
  "&precapprox;": "⪷",
  "&scap;": "⪸",
  "&succapprox;": "⪸",
  "&prnap;": "⪹",
  "&precnapprox;": "⪹",
  "&scnap;": "⪺",
  "&succnapprox;": "⪺",
  "&Pr;": "⪻",
  "&Sc;": "⪼",
  "&subdot;": "⪽",
  "&supdot;": "⪾",
  "&subplus;": "⪿",
  "&supplus;": "⫀",
  "&submult;": "⫁",
  "&supmult;": "⫂",
  "&subedot;": "⫃",
  "&supedot;": "⫄",
  "&subE;": "⫅",
  "&subseteqq;": "⫅",
  "&supE;": "⫆",
  "&supseteqq;": "⫆",
  "&subsim;": "⫇",
  "&supsim;": "⫈",
  "&subnE;": "⫋",
  "&subsetneqq;": "⫋",
  "&supnE;": "⫌",
  "&supsetneqq;": "⫌",
  "&csub;": "⫏",
  "&csup;": "⫐",
  "&csube;": "⫑",
  "&csupe;": "⫒",
  "&subsup;": "⫓",
  "&supsub;": "⫔",
  "&subsub;": "⫕",
  "&supsup;": "⫖",
  "&suphsub;": "⫗",
  "&supdsub;": "⫘",
  "&forkv;": "⫙",
  "&topfork;": "⫚",
  "&mlcp;": "⫛",
  "&Dashv;": "⫤",
  "&DoubleLeftTee;": "⫤",
  "&Vdashl;": "⫦",
  "&Barv;": "⫧",
  "&vBar;": "⫨",
  "&vBarv;": "⫩",
  "&Vbar;": "⫫",
  "&Not;": "⫬",
  "&bNot;": "⫭",
  "&rnmid;": "⫮",
  "&cirmid;": "⫯",
  "&midcir;": "⫰",
  "&topcir;": "⫱",
  "&nhpar;": "⫲",
  "&parsim;": "⫳",
  "&parsl;": "⫽",
  "&fflig;": "ﬀ",
  "&filig;": "ﬁ",
  "&fllig;": "ﬂ",
  "&ffilig;": "ﬃ",
  "&ffllig;": "ﬄ",
  "&Ascr;": "𝒜",
  "&Cscr;": "𝒞",
  "&Dscr;": "𝒟",
  "&Gscr;": "𝒢",
  "&Jscr;": "𝒥",
  "&Kscr;": "𝒦",
  "&Nscr;": "𝒩",
  "&Oscr;": "𝒪",
  "&Pscr;": "𝒫",
  "&Qscr;": "𝒬",
  "&Sscr;": "𝒮",
  "&Tscr;": "𝒯",
  "&Uscr;": "𝒰",
  "&Vscr;": "𝒱",
  "&Wscr;": "𝒲",
  "&Xscr;": "𝒳",
  "&Yscr;": "𝒴",
  "&Zscr;": "𝒵",
  "&ascr;": "𝒶",
  "&bscr;": "𝒷",
  "&cscr;": "𝒸",
  "&dscr;": "𝒹",
  "&fscr;": "𝒻",
  "&hscr;": "𝒽",
  "&iscr;": "𝒾",
  "&jscr;": "𝒿",
  "&kscr;": "𝓀",
  "&lscr;": "𝓁",
  "&mscr;": "𝓂",
  "&nscr;": "𝓃",
  "&pscr;": "𝓅",
  "&qscr;": "𝓆",
  "&rscr;": "𝓇",
  "&sscr;": "𝓈",
  "&tscr;": "𝓉",
  "&uscr;": "𝓊",
  "&vscr;": "𝓋",
  "&wscr;": "𝓌",
  "&xscr;": "𝓍",
  "&yscr;": "𝓎",
  "&zscr;": "𝓏",
  "&Afr;": "𝔄",
  "&Bfr;": "𝔅",
  "&Dfr;": "𝔇",
  "&Efr;": "𝔈",
  "&Ffr;": "𝔉",
  "&Gfr;": "𝔊",
  "&Jfr;": "𝔍",
  "&Kfr;": "𝔎",
  "&Lfr;": "𝔏",
  "&Mfr;": "𝔐",
  "&Nfr;": "𝔑",
  "&Ofr;": "𝔒",
  "&Pfr;": "𝔓",
  "&Qfr;": "𝔔",
  "&Sfr;": "𝔖",
  "&Tfr;": "𝔗",
  "&Ufr;": "𝔘",
  "&Vfr;": "𝔙",
  "&Wfr;": "𝔚",
  "&Xfr;": "𝔛",
  "&Yfr;": "𝔜",
  "&afr;": "𝔞",
  "&bfr;": "𝔟",
  "&cfr;": "𝔠",
  "&dfr;": "𝔡",
  "&efr;": "𝔢",
  "&ffr;": "𝔣",
  "&gfr;": "𝔤",
  "&hfr;": "𝔥",
  "&ifr;": "𝔦",
  "&jfr;": "𝔧",
  "&kfr;": "𝔨",
  "&lfr;": "𝔩",
  "&mfr;": "𝔪",
  "&nfr;": "𝔫",
  "&ofr;": "𝔬",
  "&pfr;": "𝔭",
  "&qfr;": "𝔮",
  "&rfr;": "𝔯",
  "&sfr;": "𝔰",
  "&tfr;": "𝔱",
  "&ufr;": "𝔲",
  "&vfr;": "𝔳",
  "&wfr;": "𝔴",
  "&xfr;": "𝔵",
  "&yfr;": "𝔶",
  "&zfr;": "𝔷",
  "&Aopf;": "𝔸",
  "&Bopf;": "𝔹",
  "&Dopf;": "𝔻",
  "&Eopf;": "𝔼",
  "&Fopf;": "𝔽",
  "&Gopf;": "𝔾",
  "&Iopf;": "𝕀",
  "&Jopf;": "𝕁",
  "&Kopf;": "𝕂",
  "&Lopf;": "𝕃",
  "&Mopf;": "𝕄",
  "&Oopf;": "𝕆",
  "&Sopf;": "𝕊",
  "&Topf;": "𝕋",
  "&Uopf;": "𝕌",
  "&Vopf;": "𝕍",
  "&Wopf;": "𝕎",
  "&Xopf;": "𝕏",
  "&Yopf;": "𝕐",
  "&aopf;": "𝕒",
  "&bopf;": "𝕓",
  "&copf;": "𝕔",
  "&dopf;": "𝕕",
  "&eopf;": "𝕖",
  "&fopf;": "𝕗",
  "&gopf;": "𝕘",
  "&hopf;": "𝕙",
  "&iopf;": "𝕚",
  "&jopf;": "𝕛",
  "&kopf;": "𝕜",
  "&lopf;": "𝕝",
  "&mopf;": "𝕞",
  "&nopf;": "𝕟",
  "&oopf;": "𝕠",
  "&popf;": "𝕡",
  "&qopf;": "𝕢",
  "&ropf;": "𝕣",
  "&sopf;": "𝕤",
  "&topf;": "𝕥",
  "&uopf;": "𝕦",
  "&vopf;": "𝕧",
  "&wopf;": "𝕨",
  "&xopf;": "𝕩",
  "&yopf;": "𝕪",
  "&zopf;": "𝕫"
};
exports.default = _default;
},{}],"Focm":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _striptags = _interopRequireDefault(require("striptags"));

var _utils = require("./utils");

var _entities = _interopRequireDefault(require("./entities"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var blocks = ['p', 'div', 'br', 'hr', 'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'li', 'pre', 'table', 'th', 'td', 'blockquote', 'header', 'footer', 'nav', 'section', 'summary', 'aside', 'article', 'address', 'code', 'img'];
var unparsable = ['audio', 'iframe', 'map', 'progress', 'track', 'meter', 'object', 'svg', 'wbr', 'video', 'webview', 'dialog', 'canvas'];
var silent = ['ol', 'ul', 'span'];

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
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = silent[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var element = _step2.value;
      html = html.replace(new RegExp("<".concat(element, "(.*?)>(.*?)</").concat(element, ">")), '$2');
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

  html = html.replace(/<(\/)?(ul|ol|span)+(.*?)>/g, '');
  return html;
};

var parseLinks = function parseLinks(html) {
  // First parse all links that have some text
  html = html.replace(/<a(.+?)href="(.+?)"(.*?)>(.+?)<\/a>/gm, '$4 ($2)'); // Remove all those that doesn't

  return html.replace(/<a(.+?)href="(.+?)"(.+?)?>(.*?)<\/a>/gm, '');
};

var parseImages = function parseImages(html) {
  // Parse images where the alt property is before the src one
  html = html.replace(/<img(.+?)alt="(.+?)"(.+?)src="(.+?)"(.*?)>/gm, 'Image: $2 ($4)'); // Parse images where the alt property is after the src one

  html = html.replace(/<img(.+?)src="(.+?)"(.+?)alt="(.+?)"(.*?)>/gm, 'Image: $4 ($2)'); // Parse images where no alt property was provided

  html = html.replace(/<img(.+?)src="(.+?)"(.*?)>/gm, 'Image: $2');
  return html;
};

var breakOnBlocks = function breakOnBlocks(html) {
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = blocks[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var block = _step3.value;
      html = html.replace(new RegExp("</".concat(block, ">"), 'gm'), "</".concat(block, ">\n"));
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

var removeExtraBreakLines = function removeExtraBreakLines(html) {
  return html.replace(/(\n\n)+/gm, '\n');
};

var removeBlocks = function removeBlocks(html) {
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = blocks[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var block = _step4.value;
      html = html.replace(new RegExp("<".concat(block, "(.*?)>"), 'gm'), '');
      html = html.replace(new RegExp("</".concat(block, "(.*?)>"), 'gm'), '');
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
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

var replaceEntities = function replaceEntities(html) {
  for (var entity in _entities.default) {
    html = html.replace(new RegExp("".concat(entity), 'gm'), _entities.default[entity]);
  }

  return html;
};

var replaceSensitiveCharacters = function replaceSensitiveCharacters(html) {
  html = html.replace(/&gt;/gm, '>');
  html = html.replace(/&GT;/gm, '>');
  html = html.replace(/&lt;/gm, '<');
  html = html.replace(/&LT;/gm, '<');
  html = html.replace(/&quot;/gm, '"');
  html = html.replace(/&QUOT;/gm, '"');
  html = html.replace(/﻿/gm, '');
  return html;
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

var htmlToText = (0, _utils.compose)(removeIndentation, replaceSensitiveCharacters, convertTagsToBreak, removeAllNonTagsToBreakOn, //removeExtraBreakLines,
removeLeadingNewLines, removeTrailingNewLines, removeBlocks, breakOnBlocks, parseImages, parseListItems, parseLinks, replaceEntities, removeTextStyling, removeSilentElements, removeUnparsableElements, preprocess);
var _default = htmlToText;
exports.default = _default;
},{"striptags":"G6CD","./utils":"FOZT","./entities":"UVmY"}]},{},["Focm"], "HTMLToText")
//# sourceMappingURL=html-to-text.js.map