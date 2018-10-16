kbasic.prototype.tokenize = function(input /*line*/) {
  if (input == null || input.length < 1) {
    return;
  }
  var input = String(input).trim();
  var sum = "";
  var i = 0;
  var c = input[0];

  if (input[0] == "S" && Is.space(input[1])) {
    this._tokens.addToken(new Token("S", "PRINT_DEBUG"));
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
      if (next == "&") {
        i += 2;
        var t = new Token("&&", "LOGICAL_OPERATOR");
        this.addToken(t);
        continue;
      }
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
      r = identifier.match(regexKeywords);
      if (r && r[0]) {
        var n = identifier.toUpperCase();
        if (n === "OR") {
          t = new Token("||", "LOGICAL_OPERATOR");
        } else if (n === "AND") {
          t = new Token("&&", "LOGICAL_OPERATOR");
        } else if (n === "MOD") {
          t = new Token(n, "MULT_OPERATOR");
        } else {
          t = new Token(identifier.toUpperCase(), "KEYWORD");
        }
      } else {
        r = identifier.match(regexFunctions);
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
    // 'STRING' too
    if (c == "'") {
      var start = i;
      i++;
      if (i >= input.length) {
        this.error = true;
        break;
      }
      c = input[i];
      while (i < input.length && c != "'") {
        i++;
        c = input[i];
      }
      if (c != "'") {
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
      i++;
      var t = new Token(c, "ASSIGNMENT");
      this.addToken(t);
      continue;
    }

    if (c == ">" || c == "<") {
      i++;
      if (c == "<" && next == ">") {
        i++;
        t = new Token("!=", "RELATIONAL");
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
    if (c == ":") {
      i++;
      var t = new Token("&&", "LOGICAL_OPERATOR");
      this.addToken(t);
      continue;
    }
    if (c == "|" && next == "|") {
        i+=2;
        var t = new Token("||", "LOGICAL_OPERATOR");
        this.addToken(t);
        continue;
      }
      var t = new Token(c, "CHARACTER");
    this.addToken(t);
    i++;
  } //while main
  if (this.error) throw "ERROR: " + this.error;
};
