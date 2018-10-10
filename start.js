var vm = function() {};

var gSourceObj = null;
var log = console.log;

function ini(sourceObj) {
  gSourceObj = sourceObj;

  if (gSourceObj != null) {
    //document.write("No Source");
    gSourceObj.value = "A=1, B=3; rerererer yuyu \nPRINT 77\n";
  }

  var program = new kbasic(sourceObj.value);
  var expressions = program.expressionsOnLine(0);
  program.tokenize(expressions[0]);
  log("tokens length:" + program._tokens.length);
  log(program._tokens.toString());
}

function test() {
  //var expr = "A";
  // var s = new Stream(expr);

  // if (s.match(regexIdentifier)) {
  //   var identifier = s.lastMatch[1].toUpperCase() + (s.lastMatch[2] || "");
  //   alert(">" + identifier + "<");
  // } else {
  //   alert("zhop");
  // }
  //alert(Is.space(expr));
}

var regexIdentifier = /^([A-Za-z][A-Za-z0-9]?)[A-Za-z0-9]*(\$|%)?/;
var keywords = /^(IF|THEN|ELSE|FOR|TO|STEP|GOTO|GOSUB|RETURN|NEXT|INPUT|LET|CLS|END|PRINT|DIM|DATA|READ|REM|END|OR|AND|MOD|WHILE|WEND|RANDOMIZE|SYSTEM|KEY|CLEAR)$/i;
var functions = /^(VAL|STR\$|LEFT\$|RIGHT\$|MID\$|LEN|RND|INT|INSTR|ABS|ASC|CHR\$|SQR|STRING\$|SIN|COS|TAN|TIMER)$/i;

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

var TType = {
  NUMBER: 1,
  LOGICAL_OPERATOR: 2,
  MULT_OPERATOR: 3,
  KEYWORD: 4,
  FUNCTION: 5,
  IDENTIFIER: 6,
  STRING: 7,
  MULT_OPERATOR: 8,
  OPENPAREN: 9,
  CLOSEPAREN: 10,
  PLUS_OPERATOR: 11,
  COMMENT: 12,
  STATEMENT_DELIMITER: 13,
  DELIMITER: 14,
  ASSIGNMENT: 15,
  RELATIONAL: 16,
  ENDOFLINE: 17,
  CHARACTER: 18,
  ID: 19,
  ASSIGNMENT_OPERATOR: 20,
  PRINT_DEBUG: 21
};

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
    return this.text;
  };
}

function kbasic(source /*string*/) {
  var a = eval("vm.a=3; vm.b=8;");
  var r = eval("vm.c= vm.a+vm.b;");
  alert(r);
  //Constant
  this.REM = ";";
  this.DELIMITER = ",";
  this._tokens = new Array();
  this.addToken = function(t) {
    this._tokens[this._tokens.length] = t;
  };

  this._lines = source == null ? null : source.split("\n");
  log("_lines.length: " + this._lines.length);
} //class kbasic

kbasic.prototype.expressionsOnLine = function(k) {
  var str = String(this._lines[k]);
  var pos = str.indexOf(this.REM);
  if (pos > 1) {
    str = str.substr(0, pos - 1);
  }
  res = str.split(this.DELIMITER);
  log("exppressions: " + res.length);
  return res;
};

kbasic.prototype.tokenize = function(input /*line*/) {
  if (input == null || input.length < 1) {
    return;
  }
  var input = String(input).trim();
  var sum = "";
  var i = 0;
  var c = input[0];

  if (input[0] == "S" && Is.space(input[1])) {
    this._tokens.addToken(new Token("S", TType.PRINT_DEBUG));
    i++;
  }
  this.error = false;
  while (i < input.length) {
    var c = input[i];
    var next;
    if (i + 1 < input.length) {
      next = input[i + 1];
    } else {
      next = -1;
    }

    if (c == ".") {
      var start = i;
      i++;
      c = input[i];
      while (i < input.length && Is.digit(c)) {
        i++;
        c = input[i];
      }
      var number = input.substring(start, i);
      var t = new Token(number, "NUMBER");
      this.addToken(t);
      continue;
    }
    if (Is.digit(c)) {
      var start = i;
      while (i < input.length && Is.digit(c)) {
        i++;
        c = input[i];
      }

      if (i < input.length && c == ".") {
        i++;
        c = input[i];
        while (i < input.length && Is.digit(c)) {
          i++;
          c = input[i];
        }
      } else if (i < input.length && c == "E") {
        i++;
        c = input[i];
        if (i < input.length && (c == "+" || c == "-")) {
          i++;
          c = input[i];
          while (i < input.length && Is.digit(c)) {
            i++;
            c = input[i];
          }
        }
      }

      var number = input.substring(start, i);

      if (c == "#" || c == "!") {
        //ignore 123#
        i++;
      }

      var t = new Token(number, "NUMBER");
      this.addToken(t);
      continue;
    }
    if (c == "&") {
      var base = 8;
      var start = i + 1;
      if (next.toUpperCase() == "H") {
        base = 16;
        i += 2;
        start++;
      } else if (next.toUpperCase() == "O") {
        i += 2;
        start++;
      }

      if (i < input.length) c = input[i];
      else c = -1;

      while (i < input.length && Is.digit_in_base(c, base)) {
        i++;
        c = input[i];
      }
      var number = input.substring(start, i);
      var n = parseInt(number, base);
      var t = new Token(n.toString(), "NUMBER");
      this.addToken(t);
      continue;
    }

    if (Is.alpha(c)) {
      var start = i;
      while (i < input.length && Is.alnum(c)) {
        i++;
        c = input[i];
      }

      if (c == "$" || c == "!" || c == "#" || c == "%") {
        i++;
      }

      identifier = input.substring(start, i);
      r = identifier.match(keywords);
      if (r && r[0]) {
        var n = identifier.toUpperCase();
        if (n === "OR" || n === "AND") {
          t = new Token(n, "LOGICAL_OPERATOR");
        } else if (n === "MOD") {
          t = new Token(n, "MULT_OPERATOR");
        } else {
          t = new Token(identifier.toUpperCase(), "KEYWORD");
        }
      } else {
        r = identifier.match(functions);
        if (r && r[0]) {
          t = new Token(identifier.toUpperCase(), "FUNCTION");
        } else {
          t = new Token(identifier, "IDENTIFIER");
        }
      }
      this.addToken(t);
      continue;
    }

    if (c == '"') {
      var start = i;
      i++;
      if (i >= input.length) {
        this.error = true;
        break;
      }
      c = input[i];
      while (i < input.length && c != '"') {
        i++;
        c = input[i];
      }
      if (c != '"') {
        this.error = true;
        break;
      }
      i++;
      var str = input.substring(start, i);
      var t = new Token(str.substring(1, str.length - 1), "STRING");
      this.addToken(t);
      continue;
    }
    if (Is.space(c)) {
      while (i < input.length && Is.space(c)) {
        i++;
        c = input[i];
      }
      continue;
    }

    if (c == "*" || c == "/" || c == "^" || c == "\\") {
      i++;
      var t = new Token(c, "MULT_OPERATOR");
      this.addToken(t);
      continue;
    }

    if (c == "(") {
      i++;
      var t = new Token(c, "OPENPAREN");
      this.addToken(t);
      continue;
    }

    if (c == ")") {
      i++;
      var t = new Token(c, "CLOSEPAREN");
      this.addToken(t);
      continue;
    }

    if (c == "+" || c == "-") {
      i++;
      var t = new Token(c, "PLUS_OPERATOR");
      this.addToken(t);
      continue;
    }
    if (c == "=") {
      //actually ambiguous, might be equality testing
      i++;
      var t = new Token(c, "ASSIGNMENT");
      this.addToken(t);
      continue;
    }

    if (c == ">" || c == "<") {
      i++;
      if (c == "<" && next == ">") {
        i++;
        t = new Token("<>", "RELATIONAL");
      } else {
        if (next == "=") {
          i++;
          t = new Token(c + "=", "RELATIONAL");
        } else {
          t = new Token(c, "RELATIONAL");
        }
      }
      this.addToken(t);
      continue;
    }
    if (c == "\r" || c == "\n") {
      i++;
      if (c == "\r" && next == "\n") {
        i++;
      }
      var t = new Token("--", "ENDOFLINE");
      this.addToken(t);
      continue;
    }

    var t = new Token(c, "CHARACTER");
    this.addToken(t);
    i++;
  } //while main
  if (this.error) throw "ERROR: " + this.error;
};
