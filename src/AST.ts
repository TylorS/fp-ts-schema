/**
 * @since 1.0.0
 */

import * as Order from "@fp-ts/core/typeclass/Order"
import { pipe } from "@fp-ts/data/Function"
import * as Number from "@fp-ts/data/Number"
import { isNumber } from "@fp-ts/data/Number"
import type { Option } from "@fp-ts/data/Option"
import * as O from "@fp-ts/data/Option"
import type { Predicate } from "@fp-ts/data/Predicate"
import * as RA from "@fp-ts/data/ReadonlyArray"
import { isString } from "@fp-ts/data/String"
import { TitleId } from "@fp-ts/schema/annotation/AST"
import type { Parser } from "@fp-ts/schema/Parser"

/**
 * @category model
 * @since 1.0.0
 */
export type AST =
  | TypeAlias
  | Literal
  | UniqueSymbol
  | UndefinedKeyword
  | VoidKeyword
  | NeverKeyword
  | UnknownKeyword
  | AnyKeyword
  | StringKeyword
  | NumberKeyword
  | BooleanKeyword
  | BigIntKeyword
  | SymbolKeyword
  | ObjectKeyword
  | Enums
  | TemplateLiteral
  | Tuple
  | TypeLiteral
  | Union
  | Lazy
  | Refinement
  | Transform

/**
 * @since 1.0.0
 */
export interface Annotated {
  readonly annotations: Record<string | symbol, unknown>
}

/**
 * @since 1.0.0
 */
export const getAnnotation = <A>(key: PropertyKey) =>
  (annotated: Annotated): O.Option<A> =>
    Object.prototype.hasOwnProperty.call(annotated.annotations, key) ?
      O.some(annotated.annotations[key] as any) :
      O.none

/**
 * @category model
 * @since 1.0.0
 */
export interface TypeAlias extends Annotated {
  readonly _tag: "TypeAlias"
  readonly typeParameters: ReadonlyArray<AST>
  readonly type: AST
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const typeAlias = (
  typeParameters: ReadonlyArray<AST>,
  type: AST,
  annotations: Annotated["annotations"] = {}
): TypeAlias => ({ _tag: "TypeAlias", typeParameters, type, annotations })

/**
 * @category guards
 * @since 1.0.0
 */
export const isTypeAlias = (ast: AST): ast is TypeAlias => ast._tag === "TypeAlias"

/**
 * @since 1.0.0
 */
export type LiteralValue = string | number | boolean | null | bigint

/**
 * @category model
 * @since 1.0.0
 */
export interface Literal extends Annotated {
  readonly _tag: "Literal"
  readonly literal: LiteralValue
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const literal = (
  literal: LiteralValue
): Literal => ({ _tag: "Literal", literal, annotations: {} })

/**
 * @category guards
 * @since 1.0.0
 */
export const isLiteral = (ast: AST): ast is Literal => ast._tag === "Literal"

/**
 * @category model
 * @since 1.0.0
 */
export interface UniqueSymbol extends Annotated {
  readonly _tag: "UniqueSymbol"
  readonly symbol: symbol
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const uniqueSymbol = (
  symbol: symbol,
  annotations: Annotated["annotations"] = {}
): UniqueSymbol => ({ _tag: "UniqueSymbol", symbol, annotations })

/**
 * @category guards
 * @since 1.0.0
 */
export const isUniqueSymbol = (ast: AST): ast is UniqueSymbol => ast._tag === "UniqueSymbol"

/**
 * @category model
 * @since 1.0.0
 */
export interface UndefinedKeyword extends Annotated {
  readonly _tag: "UndefinedKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const undefinedKeyword: UndefinedKeyword = {
  _tag: "UndefinedKeyword",
  annotations: {
    [TitleId]: "undefined"
  }
}

/**
 * @category model
 * @since 1.0.0
 */
export interface VoidKeyword extends Annotated {
  readonly _tag: "VoidKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const voidKeyword: VoidKeyword = {
  _tag: "VoidKeyword",
  annotations: {
    [TitleId]: "void"
  }
}

/**
 * @category model
 * @since 1.0.0
 */
export interface NeverKeyword extends Annotated {
  readonly _tag: "NeverKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const neverKeyword: NeverKeyword = {
  _tag: "NeverKeyword",
  annotations: {
    [TitleId]: "never"
  }
}

/**
 * @category model
 * @since 1.0.0
 */
export interface UnknownKeyword extends Annotated {
  readonly _tag: "UnknownKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const unknownKeyword: UnknownKeyword = {
  _tag: "UnknownKeyword",
  annotations: {
    [TitleId]: "unknown"
  }
}

/**
 * @category model
 * @since 1.0.0
 */
export interface AnyKeyword extends Annotated {
  readonly _tag: "AnyKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const anyKeyword: AnyKeyword = {
  _tag: "AnyKeyword",
  annotations: {
    [TitleId]: "any"
  }
}

/**
 * @category model
 * @since 1.0.0
 */
export interface StringKeyword extends Annotated {
  readonly _tag: "StringKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const stringKeyword: StringKeyword = {
  _tag: "StringKeyword",
  annotations: {
    [TitleId]: "string"
  }
}

/**
 * @category guards
 * @since 1.0.0
 */
export const isStringKeyword = (ast: AST): ast is StringKeyword => ast._tag === "StringKeyword"

/**
 * @category model
 * @since 1.0.0
 */
export interface NumberKeyword extends Annotated {
  readonly _tag: "NumberKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const numberKeyword: NumberKeyword = {
  _tag: "NumberKeyword",
  annotations: {
    [TitleId]: "number"
  }
}

/**
 * @category guards
 * @since 1.0.0
 */
export const isNumberKeyword = (ast: AST): ast is NumberKeyword => ast._tag === "NumberKeyword"

/**
 * @category model
 * @since 1.0.0
 */
export interface BooleanKeyword extends Annotated {
  readonly _tag: "BooleanKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const booleanKeyword: BooleanKeyword = {
  _tag: "BooleanKeyword",
  annotations: {
    [TitleId]: "boolean"
  }
}

/**
 * @category model
 * @since 1.0.0
 */
export interface BigIntKeyword extends Annotated {
  readonly _tag: "BigIntKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const bigIntKeyword: BigIntKeyword = {
  _tag: "BigIntKeyword",
  annotations: {
    [TitleId]: "bigint"
  }
}

/**
 * @category model
 * @since 1.0.0
 */
export interface SymbolKeyword extends Annotated {
  readonly _tag: "SymbolKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const symbolKeyword: SymbolKeyword = {
  _tag: "SymbolKeyword",
  annotations: {
    [TitleId]: "symbol"
  }
}

/**
 * @category guards
 * @since 1.0.0
 */
export const isSymbolKeyword = (ast: AST): ast is SymbolKeyword => ast._tag === "SymbolKeyword"

/**
 * @category model
 * @since 1.0.0
 */
export interface ObjectKeyword extends Annotated {
  readonly _tag: "ObjectKeyword"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const objectKeyword: ObjectKeyword = {
  _tag: "ObjectKeyword",
  annotations: {
    [TitleId]: "object"
  }
}

/**
 * @category model
 * @since 1.0.0
 */
export interface Enums extends Annotated {
  readonly _tag: "Enums"
  readonly enums: ReadonlyArray<readonly [string, string | number]>
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const enums = (
  enums: ReadonlyArray<readonly [string, string | number]>
): Enums => ({ _tag: "Enums", enums, annotations: {} })

/**
 * @since 1.0.0
 */
export interface TemplateLiteralSpan {
  readonly type: StringKeyword | NumberKeyword
  readonly literal: string
}

/**
 * @category model
 * @since 1.0.0
 */
export interface TemplateLiteral extends Annotated {
  readonly _tag: "TemplateLiteral"
  readonly head: string
  readonly spans: RA.NonEmptyReadonlyArray<TemplateLiteralSpan>
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const templateLiteral = (
  head: string,
  spans: ReadonlyArray<TemplateLiteralSpan>
): TemplateLiteral | Literal =>
  RA.isNonEmpty(spans) ? { _tag: "TemplateLiteral", head, spans, annotations: {} } : literal(head)

/**
 * @category guards
 * @since 1.0.0
 */
export const isTemplateLiteral = (ast: AST): ast is TemplateLiteral =>
  ast._tag === "TemplateLiteral"

/**
 * @since 1.0.0
 */
export interface Element {
  readonly type: AST
  readonly isOptional: boolean
}

/**
 * @since 1.0.0
 */
export const element = (
  type: AST,
  isOptional: boolean
): Element => ({ type, isOptional })

/**
 * @category model
 * @since 1.0.0
 */
export interface Tuple extends Annotated {
  readonly _tag: "Tuple"
  readonly elements: ReadonlyArray<Element>
  readonly rest: Option<RA.NonEmptyReadonlyArray<AST>>
  readonly isReadonly: boolean
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const tuple = (
  elements: ReadonlyArray<Element>,
  rest: Option<RA.NonEmptyReadonlyArray<AST>>,
  isReadonly: boolean,
  annotations: Annotated["annotations"] = {}
): Tuple => ({
  _tag: "Tuple",
  elements,
  rest,
  isReadonly,
  annotations
})

/**
 * @category guards
 * @since 1.0.0
 */
export const isTuple = (ast: AST): ast is Tuple => ast._tag === "Tuple"

/**
 * @since 1.0.0
 */
export interface PropertySignature extends Annotated {
  readonly name: PropertyKey
  readonly type: AST
  readonly isOptional: boolean
  readonly isReadonly: boolean
}

/**
 * @since 1.0.0
 */
export const propertySignature = (
  name: PropertyKey,
  type: AST,
  isOptional: boolean,
  isReadonly: boolean,
  annotations: Annotated["annotations"] = {}
): PropertySignature => ({ name, type, isOptional, isReadonly, annotations })

/**
 * @since 1.0.0
 */
export interface IndexSignature {
  readonly parameter: StringKeyword | SymbolKeyword | TemplateLiteral | Refinement
  readonly type: AST
  readonly isReadonly: boolean
}

/**
 * @since 1.0.0
 */
export const indexSignature = (
  parameter: StringKeyword | SymbolKeyword | TemplateLiteral | Refinement,
  type: AST,
  isReadonly: boolean
): IndexSignature => ({ parameter, type, isReadonly })

/**
 * @category model
 * @since 1.0.0
 */
export interface TypeLiteral extends Annotated {
  readonly _tag: "TypeLiteral"
  readonly propertySignatures: ReadonlyArray<PropertySignature>
  readonly indexSignatures: ReadonlyArray<IndexSignature>
}

const getCardinality = (ast: AST): number => {
  switch (ast._tag) {
    case "TypeAlias":
      return getCardinality(ast.type)
    case "NeverKeyword":
      return 0
    case "Literal":
    case "UndefinedKeyword":
    case "VoidKeyword":
    case "UniqueSymbol":
      return 1
    case "BooleanKeyword":
      return 2
    case "StringKeyword":
    case "NumberKeyword":
    case "BigIntKeyword":
    case "SymbolKeyword":
      return 3
    case "ObjectKeyword":
      return 4
    case "UnknownKeyword":
    case "AnyKeyword":
      return 6
    case "Refinement":
      return getCardinality(ast.from)
    case "Transform":
      return getCardinality(ast.to)
    default:
      return 5
  }
}

const sortByCardinalityAsc = RA.sort(
  pipe(Number.Order, Order.contramap(({ type }: { readonly type: AST }) => getCardinality(type)))
)

/**
 * @category constructors
 * @since 1.0.0
 */
export const typeLiteral = (
  propertySignatures: ReadonlyArray<PropertySignature>,
  indexSignatures: ReadonlyArray<IndexSignature>,
  annotations: Annotated["annotations"] = {}
): TypeLiteral => ({
  _tag: "TypeLiteral",
  propertySignatures: sortByCardinalityAsc(propertySignatures),
  indexSignatures: sortByCardinalityAsc(indexSignatures),
  annotations
})

/**
 * @category guards
 * @since 1.0.0
 */
export const isTypeLiteral = (ast: AST): ast is TypeLiteral => ast._tag === "TypeLiteral"

/**
 * @category model
 * @since 1.0.0
 */
export interface Union extends Annotated {
  readonly _tag: "Union"
  readonly types: readonly [AST, AST, ...Array<AST>]
}

const getWeight = (ast: AST): number => {
  switch (ast._tag) {
    case "TypeAlias":
      return getWeight(ast.type)
    case "Tuple":
      return ast.elements.length + (O.isSome(ast.rest) ? 1 : 0)
    case "TypeLiteral":
      return ast.propertySignatures.length + ast.indexSignatures.length
    case "Union":
      return ast.types.reduce((n, member) => n + getWeight(member), 0)
    case "Lazy":
      return 10
    default:
      return 0
  }
}

const sortByWeightDesc = RA.sort(
  Order.reverse(pipe(Number.Order, Order.contramap(getWeight)))
)

const unify = (candidates: ReadonlyArray<AST>): ReadonlyArray<AST> => {
  let out = RA.uniq(pipe(
    candidates,
    RA.flatMap((ast: AST): ReadonlyArray<AST> => isUnion(ast) ? ast.types : [ast])
  ))
  if (out.some(isStringKeyword)) {
    out = out.filter((m) => !(isLiteral(m) && typeof m.literal === "string"))
  }
  if (out.some(isNumberKeyword)) {
    out = out.filter((m) => !(isLiteral(m) && typeof m.literal === "number"))
  }
  if (out.some(isSymbolKeyword)) {
    out = out.filter((m) => !isUniqueSymbol(m))
  }
  return out
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const union = (
  candidates: ReadonlyArray<AST>,
  annotations: Annotated["annotations"] = {}
): AST => {
  const types = unify(candidates)
  switch (types.length) {
    case 0:
      return neverKeyword
    case 1:
      return types[0]
    default: {
      // @ts-expect-error (TypeScript doesn't know that `types` has >= 2 elements after sorting)
      return { _tag: "Union", types: sortByWeightDesc(types), annotations }
    }
  }
}

/**
 * @category guards
 * @since 1.0.0
 */
export const isUnion = (ast: AST): ast is Union => ast._tag === "Union"

/**
 * @category model
 * @since 1.0.0
 */
export interface Lazy extends Annotated {
  readonly _tag: "Lazy"
  readonly f: () => AST
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const lazy = (
  f: () => AST,
  annotations: Annotated["annotations"] = {}
): Lazy => ({ _tag: "Lazy", f, annotations })

/**
 * @category guards
 * @since 1.0.0
 */
export const isLazy = (ast: AST): ast is Lazy => ast._tag === "Lazy"

/**
 * @category model
 * @since 1.0.0
 */
export interface Refinement extends Annotated {
  readonly _tag: "Refinement"
  readonly from: AST
  readonly refinement: Predicate<any>
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const refinement = (
  from: AST,
  refinement: Predicate<any>,
  annotations: Annotated["annotations"] = {}
): Refinement => ({ _tag: "Refinement", from, refinement, annotations })

/**
 * @category model
 * @since 1.0.0
 */
export interface Transform extends Annotated {
  readonly _tag: "Transform"
  readonly from: AST
  readonly to: AST
  readonly decode: Parser<any, any>["parse"]
  readonly encode: Parser<any, any>["parse"]
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const transform = (
  from: AST,
  to: AST,
  decode: Transform["decode"],
  encode: Transform["encode"]
): Transform => ({ _tag: "Transform", from, to, decode, encode, annotations: {} })

/**
 * @category guards
 * @since 1.0.0
 */
export const isTransform = (ast: AST): ast is Transform => ast._tag === "Transform"

// ---------------------------------------------
// API
// ---------------------------------------------

/**
 * @since 1.0.0
 */
export const annotations = (ast: AST, annotations: Annotated["annotations"]) => ({
  ...ast,
  annotations: { ...ast.annotations, ...annotations }
})

/**
 * @since 1.0.0
 */
export const annotation = (ast: AST, id: PropertyKey, value: unknown) => ({
  ...ast,
  annotations: { ...ast.annotations, [id]: value }
})

/**
 * @since 1.0.0
 */
export const appendRestElement = (
  ast: Tuple,
  restElement: AST
): Tuple => {
  if (O.isSome(ast.rest)) {
    // example: `type A = [...string[], ...number[]]` is illegal
    throw new Error("A rest element cannot follow another rest element. ts(1265)")
  }
  return tuple(ast.elements, O.some([restElement]), ast.isReadonly)
}

/**
 * @since 1.0.0
 */
export const appendElement = (
  ast: Tuple,
  newElement: Element
): Tuple => {
  if (ast.elements.some((e) => e.isOptional) && !newElement.isOptional) {
    throw new Error("A required element cannot follow an optional element. ts(1257)")
  }
  return pipe(
    ast.rest,
    O.match(
      () => tuple([...ast.elements, newElement], O.none, ast.isReadonly),
      (rest) => {
        if (newElement.isOptional) {
          throw new Error("An optional element cannot follow a rest element. ts(1266)")
        }
        return tuple(ast.elements, O.some([...rest, newElement.type]), ast.isReadonly)
      }
    )
  )
}

const _keyof = (ast: AST): ReadonlyArray<AST> => {
  switch (ast._tag) {
    case "TypeAlias":
      return _keyof(ast.type)
    case "NeverKeyword":
    case "AnyKeyword":
      return [stringKeyword, numberKeyword, symbolKeyword]
    case "StringKeyword":
      return [literal("length")]
    case "TypeLiteral":
      return ast.propertySignatures.map((f): AST =>
        typeof f.name === "symbol" ? uniqueSymbol(f.name) : literal(f.name)
      ).concat(ast.indexSignatures.map((is) => is.parameter))
    case "Union": {
      let out: ReadonlyArray<AST> = _keyof(ast.types[0])
      for (let i = 1; i < ast.types.length; i++) {
        out = RA.intersection(_keyof(ast.types[i]))(out)
      }
      return out
    }
    case "Lazy":
      return _keyof(ast.f())
    case "Refinement":
      return _keyof(ast.from)
    case "Transform":
      return _keyof(ast.to)
    case "Literal":
    case "TemplateLiteral":
    case "Tuple":
      throw new Error("cannot compute `keyof`")
    default:
      return [neverKeyword]
  }
}

/**
 * @since 1.0.0
 */
export const keyof = (ast: AST): AST => union(_keyof(ast))

/**
 * @since 1.0.0
 */
export const record = (key: AST, value: AST, isReadonly: boolean): TypeLiteral => {
  const propertySignatures: Array<PropertySignature> = []
  const indexSignatures: Array<IndexSignature> = []
  const go = (key: AST): void => {
    switch (key._tag) {
      case "TypeAlias":
        go(key.type)
        break
      case "NeverKeyword":
        break
      case "StringKeyword":
      case "SymbolKeyword":
      case "TemplateLiteral":
      case "Refinement":
        indexSignatures.push(indexSignature(key, value, isReadonly))
        break
      case "Literal":
        if (isString(key.literal) || isNumber(key.literal)) {
          propertySignatures.push(propertySignature(key.literal, value, false, isReadonly))
        }
        break
      case "UniqueSymbol":
        propertySignatures.push(propertySignature(key.symbol, value, false, isReadonly))
        break
      case "Union":
        key.types.forEach(go)
        break
      default:
        throw new Error("cannot compute `record`")
    }
  }
  go(key)
  return typeLiteral(propertySignatures, indexSignatures)
}

/**
 * @since 1.0.0
 */
export const pick = (ast: AST, keys: ReadonlyArray<PropertyKey>): TypeLiteral => {
  return typeLiteral(getPropertySignatures(ast).filter((ps) => keys.includes(ps.name)), [])
}

/**
 * @since 1.0.0
 */
export const omit = (ast: AST, keys: ReadonlyArray<PropertyKey>): TypeLiteral => {
  return typeLiteral(getPropertySignatures(ast).filter((ps) => !keys.includes(ps.name)), [])
}

/** @internal */
export const propertyKeys = (ast: AST): ReadonlyArray<PropertyKey> => {
  switch (ast._tag) {
    case "TypeAlias":
      return propertyKeys(ast.type)
    case "Tuple":
      return ast.elements.map((_, i) => String(i))
    case "TypeLiteral":
      return ast.propertySignatures.map((ps) => ps.name)
    case "Union": {
      let out: ReadonlyArray<PropertyKey> = propertyKeys(ast.types[0])
      for (let i = 1; i < ast.types.length; i++) {
        out = RA.intersection(propertyKeys(ast.types[i]))(out)
      }
      return out
    }
    case "Lazy":
      return propertyKeys(ast.f())
    case "Refinement":
      return propertyKeys(ast.from)
    case "Transform":
      return propertyKeys(ast.to)
    default:
      return []
  }
}

/**
 * @since 1.0.0
 */
export const getPropertySignatures = (
  ast: AST
): ReadonlyArray<PropertySignature> => {
  switch (ast._tag) {
    case "TypeAlias":
      return getPropertySignatures(ast.type)
    case "Tuple":
      return ast.elements.map((element, i) =>
        propertySignature(String(i), element.type, element.isOptional, ast.isReadonly)
      )
    case "TypeLiteral":
      return ast.propertySignatures
    case "Union": {
      const propertySignatures = pipe(ast.types, RA.flatMap(getPropertySignatures))
      return propertyKeys(ast).map((key) => {
        let isOptional = false
        let isReadonly = false
        const type = union(
          propertySignatures.filter((ps) => ps.name === key).map((ps) => {
            if (ps.isReadonly) {
              isReadonly = true
            }
            if (ps.isOptional) {
              isOptional = true
            }
            return ps.type
          })
        )
        return propertySignature(key, type, isOptional, isReadonly)
      })
    }
    case "Lazy":
      return getPropertySignatures(ast.f())
    case "Refinement":
      return getPropertySignatures(ast.from)
    case "Transform":
      return getPropertySignatures(ast.to)
    default:
      return []
  }
}

/**
 * @since 1.0.0
 */
export const partial = (ast: AST): AST => {
  switch (ast._tag) {
    case "TypeAlias":
      return partial(ast.type)
    case "Tuple":
      return tuple(
        ast.elements.map((e) => element(e.type, true)),
        pipe(
          ast.rest,
          O.map((rest) => [union([...rest, undefinedKeyword])])
        ),
        ast.isReadonly
      )
    case "TypeLiteral":
      return typeLiteral(
        ast.propertySignatures.map((f) =>
          propertySignature(f.name, f.type, true, f.isReadonly, f.annotations)
        ),
        ast.indexSignatures
      )
    case "Union":
      return union(ast.types.map((member) => partial(member)))
    case "Lazy":
      return lazy(() => partial(ast.f()))
    case "Refinement":
      return partial(ast.from)
    case "Transform":
      return partial(ast.to)
    default:
      return ast
  }
}
