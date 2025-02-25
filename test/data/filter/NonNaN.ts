import { pipe } from "@fp-ts/data/Function"
import * as _ from "@fp-ts/schema/data/filter"
import * as P from "@fp-ts/schema/Parser"
import * as Pretty from "@fp-ts/schema/Pretty"
import * as S from "@fp-ts/schema/Schema"
import * as Util from "@fp-ts/schema/test/util"

const schema = pipe(S.number, _.nonNaN())

describe.concurrent("nonNaN", () => {
  it("property tests", () => {
    Util.property(schema)
  })

  it("Guard", () => {
    const is = P.is(schema)
    expect(is(1)).toEqual(true)
    expect(is(NaN)).toEqual(false)
  })

  it("Decoder", () => {
    Util.expectDecodingSuccess(schema, 1)
    Util.expectDecodingFailure(schema, NaN, `Expected a number NaN excluded, actual NaN`)
  })

  it("Pretty", () => {
    const pretty = Pretty.pretty(schema)
    expect(pretty(1)).toEqual("1")
    expect(pretty(NaN)).toEqual("NaN")
  })
})
