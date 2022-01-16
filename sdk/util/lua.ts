export type LuaTableParserOptions = {
  emptyObjectUndefined?: boolean;
  emitArrays?: boolean;
}

export class LuaTableParser {
  private index: number = 0;
  private data: string;

  constructor(data: string, private opts?: LuaTableParserOptions) {
    // remove comments
    this.data = data.replaceAll(/-- .*$/gm, "");
  }

  peekChar(): string {
    while (true) {
      const char = this.data[this.index];
      if (/\s/.test(char)) {
        this.index += 1;
        continue;
      }
      return char;
    }
  }

  peekStartsWith(prefix: string) {
    return this.data.slice(this.index).startsWith(prefix);
  }

  readChar(allowWhiteSpace: boolean = false): string {
    while (true) {
      const char = this.data[this.index];
      this.index += 1;
      if (!allowWhiteSpace && /\s/.test(char)) {
        continue;
      }
      return char;
    }
  }

  read(size: number): string {
    let result = "";
    for (let i = 0; i < size; i++) {
      result += this.readChar();
    }
    return result;
  }

  expect(match: string) {
    const data = this.read(match.length);
    if (data !== match) {
      throw new Error(`Expected '${match}' got '${data}'`);
    }
  }

  parse<T = unknown>(): T {
    while (true) {
      const char = this.readChar();
      if (char === "=") break;
    }

    return this.parseTable() as T;
  }

  parseTable(): unknown {
    this.expect("{");

    let isArray: boolean | null= null;
    let table: Record<string | number, unknown> = {};
    while (true) {
      if (this.peekChar() === "}") break;

      const key = this.parseKey();
      if (typeof key === "string") {
        isArray = false;
      } else if (typeof key === "number" && isArray === null) {
        isArray = true;
      }
    
      this.expect("=");
      const value = this.parseOne();
      table[key] = value;

      // todo: require for continuation
      if (this.peekChar() === ",") {
        this.readChar();
      }
    }

    this.expect("}");

    let keys = Object.keys(table).map((it) => parseInt(it)).sort((a, b) => a - b);
    let last = keys[0] - 1;
    for (const key of keys) {
      if (last !== key - 1) {
        isArray = false;
        break;
      }
      last = key;
    }
    
    if (isArray && this.opts?.emitArrays) {
      const entries = Object.entries(table).sort(([a], [b]) => parseInt(a) - parseInt(b)).map((it) => it[1]);
      return Array.from(entries);
    }

    if (Object.entries(table).length === 0 && this.opts?.emptyObjectUndefined) {
      return undefined;
    }

    return table;
  }

  parseKey(): string | number {
    this.expect("[");

    if (/\d/.test(this.peekChar())) {
      const result = this.parseNumber();
      this.expect("]");
      return result;
    } else {
      const result = this.parseString();
      this.expect("]");
      return result;
    }
  }

  parseString(): string {
    this.expect('"');
    let contents = "";
    while (true) {
      // todo: consider escapes
      const char = this.readChar(true);
      if (char === '"') break;
      contents += char;
    }
    return contents;
  }

  parseNumber(): number {
    let number = "";
    while (true) {
      const char = this.peekChar();
      if (/\d/.test(char) || char === "." && !number.includes(".") || char === "-" && number === "") {
        number += this.readChar();
      } else {
        // todo: parseInt or parseFloat
        return parseFloat(number);
      }
    }
  }

  parseOne(): unknown {
    const char = this.peekChar();
    if (char === "{") {
      return this.parseTable();
    } else if (char === "[") {
      return this.parseKey();
    } else if (char === '"') {
      return this.parseString();
    } else if (/\d/.test(char) || char === "-") {
      return this.parseNumber();
    } else if (char === "f" && this.peekStartsWith("false")) {
      this.read(5);
      return false;
    } else if (char === "t" && this.peekStartsWith("true")) {
      this.read(4);
      return true;
    }

    return null;
  }
}

export function parseLuaTable<T = {}>(data: string, opts?: LuaTableParserOptions): T {
  return (new LuaTableParser(data, opts)).parse() as T;
}
