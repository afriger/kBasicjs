function VirtualMachine() {
  this.functions = new Array();
  this.functions["PRINT"] = function(tok) {
    tok.mode = 1;
    var r = vm.EvalExpression(tok);
    gOutputObj.value += r + "\n";
  };
  this.functions["ASSIGNMENT"] = function(tok) {
    tok.mode = 0;
    vm.EvalExpression(tok);
  };
  this.functions["IF"] = function(tok) {
    tok.mode = "if";
    var res = vm.EvalExpression(tok);
    if (res == undefined || res == null) {
      return false;
    }
    return res;
  };
  this.functions["INCHES"] = function(t) {
    vm.INCHES = true;
  };
  this.functions["SYS"] = function(t) {};
  this.functions["TKO"] = function(t) {
    vm.TKO = true;
  };
  this.functions["SPO"] = function(t) {};
  this.functions["NRESX"] = function(t) {};
  this.functions["DEF"] = function(t) {};
} //VirtualMachine

VirtualMachine.prototype.EvalExpression = function(tok) {
  var s = "";
  var ret = null;
  var mode = tok.mode;
  if (mode == 1 || mode == 0) {
    var start = mode;
    for (var k = start; k < tok.length; ++k) {
      var x = tok[k].getText();
      if (tok[k].getType() == "STRING") {
        x = "'" + new String(x) + "'";
      }
      s += x;
    }
  }
  if (mode == "if") {
    s = "(";
    for (var k = 1; k < tok.length; ++k) {
      var x = tok[k].getText();
      if (x == "=") x = "==";
      s += x;
    }
    s += ")";
  }
  if (Is.good(s)) {
    try {
      ret = eval(s);
    } catch (e) {
      log.e;
      ret = null;
    }
  }
  log("expr: " + s + "; res: " + ret);
  return ret;
};

var vm = new VirtualMachine();

var gSourceObj = null;
var gDebugObj = null;
var gOutputObj = null;
var regexFunctions = new RegExp(
  [
    "^(VAL|STR$|LEFT$|RIGHT$|MID$|LEN|RND|INT",
    "|INSTR|ABS|ASC|CHR$|SQR|STRING$|SIN|COS|TAN|TIMER",
    "|CRT|BOXDRAW|CURSOR|NOMWERT|FILLROW|REVERSE|LINEROW|BLINK",
    ")$"
  ].join("")
);
var regexKeywords = new RegExp(
  [
    "^(IF|THEN|ELSE|FOR|TO|STEP|GOTO|GOSUB|RETURN|NEXT|INPUT",
    "|LET|CLS|END|PRINT|DIM|DATA|READ|END|OR|AND|MOD|WHILE",
    "|WEND|RANDOMIZE|SYSTEM|KEY|CLEAR|FROM|STOP",
    "|INCHES|TKO|SMW|ADF|MS|SPO|NRESX|OHM|SYS",
    "|BSIZE|QRATE|DPIN|HP4|HP5|HP6|HP4",
    "|HP5|HP6|DEF|PT||ST|SET|RPS|PF|PR|PPOS|GPS|XV|YV|FT",
    "|GPS|PS|RPS)$"
  ].join("")
);

// Stream API, for parsing source and INPUT entry
function Stream(string) {
  this.line = 0;
  this.column = 0;

  this.match = function match(re) {
    var m = string.match(re),
      lines;
    if (m) {
      string = string.substring(m[0].length);
      lines = m[0].split("\n");
      if (lines.length > 1) {
        this.line += lines.length - 1;
        this.column = lines[lines.length - 1].length;
      } else {
        this.column += m[0].length;
      }

      this.lastMatch = m;
      return m;
    }
    return void 0;
  };

  this.eof = function eof() {
    return string.length === 0;
  };
}

var Is = {
  space: function(c) {
    return c == " " || c == "\t" || c == "\v" || c == "\f";
  },

  digit: function(c) {
    return c >= "0" && c <= "9";
  },

  digit_in_base: function(c, base) {
    if (base == 10) {
      return c >= "0" && c <= "9";
    }
    if (base == 8) {
      return c >= "0" && c <= "7";
    }
    if (base == 16) {
      var d = c.toUpperCase();
      return (c >= "0" && c <= "9") || (d >= "A" && d <= "F");
    }
    return false;
  },

  alpha: function(c) {
    return (c >= "A" && c <= "Z") || (c >= "a" && c <= "z");
  },

  alnum: function(c) {
    return this.alpha(c) || this.digit(c);
  },
  good: function(str) {
    return str != 0 && str.length > 0;
  },
  tokensArr: function(t) {
    if (t) {
      return t.length > 0;
    }
    return false;
  }
};

function Token(text, type) {
  this.text = text;
  this.type = type;

  this.toString = function() {
    return "[" + this.text + "," + this.type + "]";
  };

  this.getType = function() {
    return this.type;
  };

  this.getText = function() {
    //sasa change to plus "vm."
    if (type == "IDENTIFIER") {
      return "vm." + this.text;
    }
    return this.text;
  };
  this.getKeywordText = function() {
    if (this.type == "KEYWORD") {
      return this.text;
    }
    return null;
  };
  this.isKeyword = function(kw, t) {
    if (this.type == "KEYWORD") {
      if (this.text == kw) {
        var name = new String(kw);
        vm.functions[name](t);
        return true;
      }
      return false;
    }
  };
}

var log = function(msg) {
  console.log(msg);
  if (gDebugObj) {
    gDebugObj.value += msg + "\n";
  }
};
function Erase() {
  if (gDebugObj) {
    gDebugObj.value = "";
  }
}

function ini(sourceObj) {
  gOutputObj = document.getElementById("output");
  gDebugObj = document.getElementById("consol");
  gSourceObj = sourceObj;
  if (gSourceObj != null) {
    gSourceObj.value = "A=1, B=3; rerererer yuyu \nPRINT A\n";
  }
}
function Start() {
  // var s = "vm.A||vm.B";
  // var r = eval(s);
  // alert(r)
  var program = new kbasic(gSourceObj.value);
  for (var i = 0; i < program._countLines; ++i) {
    var expressions = program.expressionsOnLine(i);
    for (var k = 0; k < expressions.length; ++k) {
      program.tokenize(expressions[k]);
      var t = program._tokens;
      program._tokensLine[program._tokensLine.length] = t;
      //log("[" + k + "]" + t.toString());
      program._tokens = [];
    }
    program._tokensLine[program._tokensLine.length] = new Token(
      program._ENDL,
      program._ENDL
    );
  }

  program.interpreter();
}

function kbasic(source /*string*/) {
  //Constant
  this._REM = ";";
  this._DELIMITER = ",";
  this._ENDL = "ENDL";
  this._tokensLine = new Array();
  this._tokens = new Array();
  this.addToken = function(t) {
    this._tokens[this._tokens.length] = t;
  };
  source = String(source).trim();
  this._lines = source == null ? null : source.split("\n");
  this._countLines = this._lines.length;
} //class kbasic

kbasic.prototype.expressionsOnLine = function(k) {
  var str = String(this._lines[k]);
  var pos = str.indexOf(this._REM);
  if (pos > 1) {
    str = str.substr(0, pos);
  }
  res = str.split(this._DELIMITER);
  return res;
};

kbasic.prototype.interpreter = function(begin, end) {
  var start = begin ? begin : 0;
  var finish = end ? end : this._tokensLine.length;

  for (var k = start; k < finish; ++k) {
    var t = this._tokensLine[k];
    var length = t.length;
    if (!(length && length > 0)) {
      continue;
    }
    log("tok:" + t + ":" + k);
    if (t[0].getKeywordText() == "STOP") {
      log("End of program");
      break;
    }
    if (t[0].getKeywordText() == "GPS") {
      this.Subroutine(k, t[1].text);
      continue;
    }
    if (t[0].getKeywordText() == "FOR") {
      k = this.Loopfor(k) + 1;
      continue;
    }
    if (t[0].getText() == "IF") {
      var res = vm.functions["IF"](t);
      if (res == false) {
        for (var i = 0; i < length; ++i) {
          t = this._tokensLine[++k];
          if (t[0].getType == this._ENDL) {
            break;
          }
        }
      }
      continue;
    }
    if (t[0].isKeyword("PRINT", t)) {
      continue;
    }
    if (t[0].isKeyword("INCHES", t)) {
      continue;
    }
    if (t[0].isKeyword("SYS", t)) {
      continue;
    }
    if (t[0].isKeyword("TKO", t)) {
      continue;
    }
    if (t[0].isKeyword("SPO", t)) {
      continue;
    }
    if (t[0].isKeyword("NRESX", t)) {
      continue;
    }
    if (t[0].isKeyword("DEF", t)) {
      continue;
    }

    for (var i = 0; i < length; ++i) {
      if (t[i].text == "=") vm.functions["ASSIGNMENT"](t);
    }
  }
};

kbasic.prototype.Subroutine = function(start, name) {
  var pEnd = this._tokensLine.length;
  var begin = 0;
  var end = 0;
  for (var k = start; k < pEnd; ++k) {
    var t = this._tokensLine[k];
    var length = t.length;
    if (length && length > 0) {
      if (t[0].getType() == "KEYWORD" && t[0].getText() == "PS") {
        if (t[1].text == name) {
          begin = k;
        }
      }
      if (t[0].getType() == "KEYWORD" && t[0].getText() == "RPS") {
        if (t[1].text == name) {
          end = k;
          alert("PS: " + begin + ":" + end);
        }
        break;
      }
    }
  }
  if (begin > 0 && end != 0 && end < pEnd) {
    this.interpreter(begin, end);
  } else {
    alert("Err: Sub not found.");
  }
};

kbasic.prototype.Loopfor = function(start) {
  var f = this._tokensLine[start++];
  var flen = f.length;
  if (flen < 6) {
    return start;
  }
  var name = f[1].text;
  var from = 0;
  var to = 0;
  if (f[2].getKeywordText() == "FROM") {
    from = f[3].getText();
  }
  if (f[4].getKeywordText() == "TO") {
    to = f[5].getText();
  }

  var pEnd = this._tokensLine.length;
  var begin = start;
  var end = 0;
  for (var k = start; k < pEnd; ++k) {
    var t = this._tokensLine[k];

    if (Is.tokensArr(t)) {
      if (t[0].getKeywordText() == "NEXT") {
        if (t[1].text == name) {
          end = k;
        }
        break;
      }
    }
  }
  for (var i = from; i < to; ++i) {
    var s = f[1].getText() + "=" + i;
    eval(s);
    if (begin > 0 && end < pEnd) {
      this.interpreter(begin, end);
    }
  }
  return end;
};
