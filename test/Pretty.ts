import { pipe } from "@fp-ts/data/Function"
import * as P from "@fp-ts/schema/Pretty"
import * as S from "@fp-ts/schema/Schema"

describe.concurrent("Pretty", () => {
  it("exports", () => {
    expect(P.make).exist
    expect(P.pretty).exist
  })

  it("templateLiteral. a${string}b", () => {
    const schema = S.templateLiteral(S.literal("a"), S.string, S.literal("b"))
    const pretty = P.pretty(schema)
    expect(pretty("acb")).toEqual("acb")
  })

  it("number", () => {
    const schema = S.number
    const pretty = P.pretty(schema)
    expect(pretty(1)).toEqual("1")
    expect(pretty(NaN)).toEqual("NaN")
    expect(pretty(Infinity)).toEqual("Infinity")
    expect(pretty(-Infinity)).toEqual("-Infinity")
  })

  describe.concurrent("struct", () => {
    it("baseline", () => {
      const schema = S.struct({ a: S.string, b: S.number })
      const pretty = P.pretty(schema)
      expect(pretty({ a: "a", b: 1 })).toEqual(
        `{ "a": "a", "b": 1 }`
      )
    })

    it("empty", () => {
      const schema = S.struct({})
      const pretty = P.pretty(schema)
      expect(pretty({})).toEqual(
        "{}"
      )
    })

    it("record(string, string)", () => {
      const schema = S.record(S.string, S.string)
      const pretty = P.pretty(schema)
      expect(pretty({ a: "a", b: "b" })).toEqual(
        `{ "a": "a", "b": "b" }`
      )
    })

    it("record(symbol, string)", () => {
      const a = Symbol.for("@fp-ts/schema/test/a")
      const schema = S.record(S.symbol, S.string)
      const pretty = P.pretty(schema)
      expect(pretty({ [a]: "a" })).toEqual(
        `{ Symbol(@fp-ts/schema/test/a): "a" }`
      )
    })

    it("should not output optional property signatures", () => {
      const schema = S.partial(S.struct({ a: S.number }))
      const pretty = P.pretty(schema)
      expect(pretty({})).toEqual("{}")
      expect(pretty({ a: 1 })).toEqual(`{ "a": 1 }`)
    })
  })

  it("never", () => {
    const schema = S.never
    const pretty = P.pretty(schema)
    expect(() => pretty("a" as any as never)).toThrowError(
      new Error("cannot pretty print a `never` value")
    )
  })

  it("string", () => {
    const schema = S.string
    const pretty = P.pretty(schema)
    expect(pretty("a")).toEqual(`"a"`)
  })

  it("number", () => {
    const schema = S.number
    const pretty = P.pretty(schema)
    expect(pretty(1)).toEqual("1")
  })

  it("boolean", () => {
    const schema = S.boolean
    const pretty = P.pretty(schema)
    expect(pretty(true)).toEqual("true")
  })

  it("bigint", () => {
    const pretty = P.pretty(S.bigint)
    expect(pretty(1n)).toEqual("1n")
  })

  it("bigint", () => {
    const pretty = P.pretty(S.bigint)
    expect(pretty(1n)).toEqual("1n")
  })

  describe.concurrent("literal", () => {
    it("null", () => {
      const schema = S.literal(null)
      const pretty = P.pretty(schema)
      expect(pretty(null)).toEqual("null")
    })

    it("bigint", () => {
      const schema = S.literal(1n)
      const pretty = P.pretty(schema)
      expect(pretty(1n)).toEqual("1n")
    })
  })

  it("uniqueSymbol", () => {
    const a = Symbol.for("@fp-ts/schema/test/a")
    const schema = S.uniqueSymbol(a)
    const pretty = P.pretty(schema)
    expect(pretty(a)).toEqual("Symbol(@fp-ts/schema/test/a)")
  })

  describe.concurrent("enums", () => {
    it("Numeric enums", () => {
      enum Fruits {
        Apple,
        Banana
      }
      const schema = S.enums(Fruits)
      const pretty = P.pretty(schema)
      expect(pretty(Fruits.Apple)).toEqual(`0`)
      expect(pretty(Fruits.Banana)).toEqual(`1`)
    })

    it("String enums", () => {
      enum Fruits {
        Apple = "apple",
        Banana = "banana",
        Cantaloupe = 0
      }
      const schema = S.enums(Fruits)
      const pretty = P.pretty(schema)
      expect(pretty(Fruits.Apple)).toEqual(`"apple"`)
      expect(pretty(Fruits.Banana)).toEqual(`"banana"`)
      expect(pretty(Fruits.Cantaloupe)).toEqual(`0`)
    })

    it("Const enums", () => {
      const Fruits = {
        Apple: "apple",
        Banana: "banana",
        Cantaloupe: 3
      } as const
      const schema = S.enums(Fruits)
      const pretty = P.pretty(schema)
      expect(pretty(Fruits.Apple)).toEqual(`"apple"`)
      expect(pretty(Fruits.Banana)).toEqual(`"banana"`)
      expect(pretty(Fruits.Cantaloupe)).toEqual(`3`)
    })
  })

  describe.concurrent("tuple", () => {
    it("required element", () => {
      const schema = S.tuple(S.number)
      const pretty = P.pretty(schema)
      expect(pretty([1])).toEqual(`[1]`)
      const x = [1, "b"] as any
      expect(pretty(x)).toEqual(`[1]`)
    })

    it("required element with undefined", () => {
      const schema = S.tuple(S.union(S.number, S.undefined))
      const pretty = P.pretty(schema)
      expect(pretty([1])).toEqual(`[1]`)
      expect(pretty([undefined])).toEqual(`[undefined]`)
      const x = [1, "b"] as any
      expect(pretty(x)).toEqual(`[1]`)
    })

    it("optional element", () => {
      const schema = pipe(S.tuple(), S.optionalElement(S.number))
      const pretty = P.pretty(schema)
      expect(pretty([])).toEqual(`[]`)
      expect(pretty([1])).toEqual(`[1]`)
      const x = [1, "b"] as any
      expect(pretty(x)).toEqual(`[1]`)
    })

    it("optional element with undefined", () => {
      const schema = pipe(S.tuple(), S.optionalElement(S.union(S.number, S.undefined)))
      const pretty = P.pretty(schema)
      expect(pretty([])).toEqual(`[]`)
      expect(pretty([1])).toEqual(`[1]`)
      const x = [1, "b"] as any
      expect(pretty(x)).toEqual(`[1]`)
      expect(pretty([undefined])).toEqual(`[undefined]`)
    })

    it("baseline", () => {
      const schema = S.tuple(S.string, S.number)
      const pretty = P.pretty(schema)
      expect(pretty(["a", 1])).toEqual(`["a", 1]`)
    })

    it("empty tuple", () => {
      const schema = S.tuple()
      const pretty = P.pretty(schema)
      expect(pretty([])).toEqual(`[]`)
    })

    it("optional elements", () => {
      const schema = S.partial(S.tuple(S.string, S.number))
      const pretty = P.pretty(schema)
      expect(pretty([])).toEqual(`[]`)
      expect(pretty(["a"])).toEqual(`["a"]`)
      expect(pretty(["a", 1])).toEqual(`["a", 1]`)
    })

    it("array", () => {
      const schema = S.array(S.string)
      const pretty = P.pretty(schema)
      expect(pretty([])).toEqual(`[]`)
      expect(pretty(["a"])).toEqual(`["a"]`)
    })

    it("post rest element", () => {
      const schema = pipe(S.array(S.number), S.element(S.boolean))
      const pretty = P.pretty(schema)
      expect(pretty([true])).toEqual(`[true]`)
      expect(pretty([1, true])).toEqual(`[1, true]`)
      expect(pretty([1, 2, true])).toEqual(`[1, 2, true]`)
      expect(pretty([1, 2, 3, true])).toEqual(`[1, 2, 3, true]`)
    })

    it("post rest elements", () => {
      const schema = pipe(
        S.array(S.number),
        S.element(S.boolean),
        S.element(S.union(S.string, S.undefined))
      )
      const pretty = P.pretty(schema)
      expect(pretty([true, "c"])).toEqual(`[true, "c"]`)
      expect(pretty([1, true, "c"])).toEqual(`[1, true, "c"]`)
      expect(pretty([1, 2, true, "c"])).toEqual(`[1, 2, true, "c"]`)
      expect(pretty([1, 2, 3, true, "c"])).toEqual(`[1, 2, 3, true, "c"]`)
      expect(pretty([1, 2, 3, true, undefined])).toEqual(`[1, 2, 3, true, undefined]`)
    })

    it("post rest elements when rest is unknown", () => {
      const schema = pipe(S.array(S.unknown), S.element(S.boolean))
      const pretty = P.pretty(schema)
      expect(pretty([1, "a", 2, "b", true])).toEqual(`[1, "a", 2, "b", true]`)
      expect(pretty([true])).toEqual(`[true]`)
    })

    it("all", () => {
      const schema = pipe(
        S.tuple(S.string),
        S.rest(S.number),
        S.element(S.boolean)
      )
      const pretty = P.pretty(schema)
      expect(pretty(["a", true])).toEqual(`["a", true]`)
      expect(pretty(["a", 1, true])).toEqual(`["a", 1, true]`)
      expect(pretty(["a", 1, 2, true])).toEqual(`["a", 1, 2, true]`)
    })

    it("nonEmptyArray", () => {
      const schema = S.nonEmptyArray(S.number)
      const pretty = P.pretty(schema)
      expect(pretty([1])).toEqual(`[1]`)
      expect(pretty([1, 2])).toEqual(`[1, 2]`)
    })

    it("ReadonlyArray<unknown>", () => {
      const schema = S.array(S.unknown)
      const pretty = P.pretty(schema)
      expect(pretty([])).toEqual(`[]`)
      expect(pretty(["a", 1, true])).toEqual(`["a", 1, true]`)
    })

    it("ReadonlyArray<any>", () => {
      const schema = S.array(S.any)
      const pretty = P.pretty(schema)
      expect(pretty([])).toEqual(`[]`)
      expect(pretty(["a", 1, true])).toEqual(`["a", 1, true]`)
    })
  })

  describe.concurrent("struct", () => {
    it("should escape keys", () => {
      const schema = S.struct({ "-": S.number })
      const pretty = P.pretty(schema)
      expect(pretty({ "-": 1 })).toEqual(`{ "-": 1 }`)
    })

    it("required property signature", () => {
      const schema = S.struct({ a: S.number })
      const pretty = P.pretty(schema)
      expect(pretty({ a: 1 })).toEqual(`{ "a": 1 }`)
      const x = { a: 1, b: "b" }
      expect(pretty(x)).toEqual(`{ "a": 1 }`)
    })

    it("required property signature with undefined", () => {
      const schema = S.struct({ a: S.union(S.number, S.undefined) })
      const pretty = P.pretty(schema)
      expect(pretty({ a: 1 })).toEqual(`{ "a": 1 }`)
      expect(pretty({ a: undefined })).toEqual(`{ "a": undefined }`)
      const x = { a: 1, b: "b" }
      expect(pretty(x)).toEqual(`{ "a": 1 }`)
    })

    it("optional property signature", () => {
      const schema = S.struct({ a: S.optional(S.number) })
      const pretty = P.pretty(schema)
      expect(pretty({})).toEqual(`{}`)
      expect(pretty({ a: 1 })).toEqual(`{ "a": 1 }`)
      const x = { a: 1, b: "b" }
      expect(pretty(x)).toEqual(`{ "a": 1 }`)
    })

    it("optional property signature with undefined", () => {
      const schema = S.struct({ a: S.optional(S.union(S.number, S.undefined)) })
      const pretty = P.pretty(schema)
      expect(pretty({})).toEqual(`{}`)
      expect(pretty({ a: 1 })).toEqual(`{ "a": 1 }`)
      const x = { a: 1, b: "b" }
      expect(pretty(x)).toEqual(`{ "a": 1 }`)
      expect(pretty({ a: undefined })).toEqual(`{ "a": undefined }`)
    })
  })

  it("union", () => {
    const schema = S.union(S.string, S.number)
    const pretty = P.pretty(schema)
    expect(pretty("a")).toEqual(
      `"a"`
    )
    expect(pretty(1)).toEqual(
      "1"
    )
  })

  it("recursive", () => {
    interface A {
      readonly a: string
      readonly as: ReadonlyArray<A>
    }
    const A: S.Schema<A> = S.lazy<A>(() =>
      S.struct({
        a: S.string,
        as: S.array(A)
      })
    )
    const pretty = P.pretty(A)
    expect(pretty({ a: "a", as: [] })).toEqual(
      `{ "a": "a", "as": [] }`
    )
  })

  describe.concurrent("partial", () => {
    it("struct", () => {
      const schema = pipe(S.struct({ a: S.number }), S.partial)
      const pretty = P.pretty(schema)
      expect(pretty({})).toEqual("{}")
      expect(pretty({ a: 1 })).toEqual(`{ "a": 1 }`)
    })

    it("tuple", () => {
      const schema = pipe(S.tuple(S.string, S.number), S.partial)
      const pretty = P.pretty(schema)
      expect(pretty([])).toEqual("[]")
      expect(pretty(["a"])).toEqual(`["a"]`)
    })

    it("array", () => {
      const schema = pipe(S.array(S.number), S.partial)
      const pretty = P.pretty(schema)
      expect(pretty([])).toEqual("[]")
      expect(pretty([1])).toEqual("[1]")
      expect(pretty([1])).toEqual("[1]")
      expect(pretty([undefined])).toEqual("[undefined]")
    })

    it("union", () => {
      const schema = pipe(S.union(S.string, S.array(S.number)), S.partial)
      const pretty = P.pretty(schema)
      expect(pretty("a")).toEqual(`"a"`)
      expect(pretty([])).toEqual("[]")
      expect(pretty([1])).toEqual("[1]")
      expect(pretty([undefined])).toEqual("[undefined]")
    })
  })
})
