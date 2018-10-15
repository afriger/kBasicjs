function VirtualMachine() {
  this.functions = new Array();
  this.functions["PRINT"] = function(tok) {
    tok.mode = 1;
    var r = vm.EvalExpression(tok);
    log("Eval:" + r);
    gOutputObj.value += r + "\n";
  };
  this.functions["ASSIGNMENT"] = function(tok) {
    tok.mode = 0;
    var r = vm.EvalExpression(tok);
    eval(r);
  };
}

VirtualMachine.prototype.EvalExpression = function(tok) {
  var mode = tok.mode;
  if (mode == 1 || mode == 0) {
    var s = "";
    var start = mode;
    for (var k = start; k < tok.length; ++k) {
      s += tok[k].getText();
    }
    log("expr: " + s);
    return eval(s);
  }
};

var vm = new VirtualMachine();

var gSourceObj = null;
var gDebugObj = null;
var gOutputObj = null;
var regexIdentifier = /^([A-Za-z][A-Za-z0-9]?)[A-Za-z0-9]*(\$|%)?/;
var regexFunctions = new RegExp(
  [
    "^(VAL|STR$|LEFT$|RIGHT$|MID$|LEN|RND|INT",
    "|INSTR|ABS|ASC|CHR$|SQR|STRING$|SIN|COS|TAN|TIMER)$"
  ].join("")
);
var regexKeywords = new RegExp(
  [
    "^(IF|THEN|ELSE|FOR|TO|STEP|GOTO|GOSUB|RETURN|NEXT|INPUT",
    "|LET|CLS|END|PRINT|DIM|DATA|READ|REM|END|OR|AND|MOD|WHILE",
    "|WEND|RANDOMIZE|SYSTEM|KEY|CLEAR|STOP",
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
}

//var log = console.log;

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

function test() {}

function ini(sourceObj) {
  gOutputObj = document.getElementById("output");
  gDebugObj = document.getElementById("consol");
  gSourceObj = sourceObj;
  if (gSourceObj != null) {
    gSourceObj.value = "A=1, B=3; rerererer yuyu \nPRINT A\n";
  }
}
function Start() {
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
      program.ENDL,
      program.ENDL
    );
  }

  program.interpreter();
}

function kbasic(source /*string*/) {
  //Constant
  this.REM = ";";
  this.DELIMITER = ",";
  this.ENDL = "ENDL";
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
  var pos = str.indexOf(this.REM);
  if (pos > 1) {
    str = str.substr(0, pos);
  }
  res = str.split(this.DELIMITER);
  //log("exppressions: " + res.length);
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
    //log("tok:" + t + ":" + k);
    if (t[0].getType() == "KEYWORD") {
      if (t[0].getText() == "STOP") {
        log("End of program");
        break;
      }
      if (t[0].getText() == "GPS") {
        this.Subroutine(k, t[1].text);
        continue;
      }
    }
    for (var i = 0; i < length; ++i) {
      log("(" + k + "," + i + ") t " + t[i].getText() + " : " + t[i].getType());
      if (t[i].text == "PRINT") vm.functions["PRINT"](t);
      if (t[i].text == "=") vm.functions["ASSIGNMENT"](t);
    }
  }
};

kbasic.prototype.Subroutine = function(start, name) {
  var pEnd = this._tokensLine.length;
  var begin = 0,
    end = 0;
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
  if (begin > 0 && end < pEnd) {
    this.interpreter(begin, end);
  }
};
