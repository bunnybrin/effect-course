import { Schema } from 'effect'
import { Config, Effect } from 'effect'
import { FetchError, JsonError } from './errors.ts'
import { Pokemon } from './schemas.ts'

const config = Config.NonEmptyString('BASE_URL')

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

const getPokemon = Effect.gen(function* () {
  const baseUrl = yield* config
  const response = yield* fetchRequest(baseUrl)
  if (!response.ok) {
    return yield* new FetchError()
  }

  const json = yield* jsonResponse(response)

  return decodePokemon(json)
})


const main = getPokemon.pipe(
  Effect.catchTags({
    FetchError: () => Effect.succeed('Fetch error'),
    JsonError: () => Effect.succeed('Json error'),
    ConfigError: () => Effect.succeed('ConfigError error'),
  }),
)


Effect.runPromise(main.pipe(Effect.tap((r) => Effect.sync(() => console.log(r)))),
)