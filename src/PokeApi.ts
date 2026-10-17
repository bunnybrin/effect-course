import { FetchError, JsonError } from './errors.ts'
import { Pokemon } from './schemas.ts'
import { Config, Context, Effect, Schema } from 'effect'
import type { ConfigError } from 'effect/Config'
import type { SchemaError } from 'effect/Schema'

interface PokeApiImpl {
  readonly getPokemon: Effect.Effect<
    Pokemon,
    FetchError | JsonError | SchemaError | ConfigError
  >;
}

export class PokeApi extends Context.Service<
  PokeApi,
  PokeApiImpl
>()('PokeApi') {

  static readonly Live = PokeApi.of({
    getPokemon: Effect.gen(function* () {
      const fetchRequest = (baseUrl: string) =>
        Effect.tryPromise({
          try: () => fetch(`${baseUrl}/api/v2/pokemon/garchomp/`),
          catch: () => new FetchError(),
        })

      const jsonResponse = (response: Response) =>
        Effect.tryPromise({
          try: () => response.json(),
          catch: () => new JsonError(),
        })

      const decodePokemon = Schema.decodeUnknownSync(Pokemon)


      const baseUrl = yield* Config.NonEmptyString('BASE_URL')
      const response = yield* fetchRequest(baseUrl)
      if (!response.ok) {
        return yield* new FetchError()
      }

      const json = yield* jsonResponse(response)

      return decodePokemon(json)
    }),
  })


  static readonly Test = PokeApi.of({
    getPokemon: Effect.succeed({
      id: 1,
      height: 10,
      weight: 10,
      order: 1,
      name: 'myname',
    }),
  })
}