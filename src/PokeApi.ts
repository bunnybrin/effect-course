import { FetchError, JsonError } from './errors.ts'
import { Pokemon } from './schemas.ts'
import { Array, Config, Context, Effect, Layer, Schema } from 'effect'


export class PokemonCollection extends Context.Service<
  PokemonCollection
>()('PokemonCollection', {
  make: Effect.succeed(['staryu', 'perrserker', 'flaaffy']),
}) {
  static readonly Live = Layer.effect(this, this.make)
}

export class PokeApiUrl extends Context.Service<
  PokeApiUrl
>()('PokeApiUrl', {
  make: Effect.gen(function* () {
    const baseUrl = yield* Config.NonEmptyString('BASE_URL')
    return `${baseUrl}/api/v2/pokemon`
  }),
}) {
  static readonly Live = Layer.effect(this, this.make)
}

export class BuildPokeApiUrl extends Context.Service<
  BuildPokeApiUrl
>()('BuildPokeApiUrl', {
  make: Effect.gen(function* () {
    const pokeApiUrl = yield* PokeApiUrl
    return ({ name }: { name: string }) => `${pokeApiUrl}/${name}`
  }),
}) {
  static readonly Live = Layer.effect(this, this.make).pipe(Layer.provide(PokeApiUrl.Live))
}

export class PokeApi extends Context.Service<
  PokeApi
>()('PokeApi', {
  make: Effect.gen(function* () {
    const pokemonCollection = yield* PokemonCollection
    const buildPokeApiUrl = yield* BuildPokeApiUrl

    return {
      getPokemon: Effect.gen(function* () {

        const requestUrl = buildPokeApiUrl({ name: pokemonCollection[0] })

        const response = yield* Effect.tryPromise({
          try: () => fetch(requestUrl),
          catch: () => new FetchError(),
        })

        if (!response.ok) {
          return yield* new FetchError()
        }

        const json = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new JsonError(),
        })

        return Schema.decodeUnknownSync(Pokemon)(json)
      }),
    }
  })
}) {

  static readonly Live = Layer.effect(this, this.make).pipe(
    Layer.provide(Layer.mergeAll(PokemonCollection.Live, BuildPokeApiUrl.Live)),
  )

  static readonly Mock = Layer.succeed(
    this,
    PokeApi.of({
      getPokemon: Effect.succeed({
        id: 1,
        height: 10,
        weight: 10,
        name: 'my-name',
        order: 1,
      }),
    }),
  )
}

