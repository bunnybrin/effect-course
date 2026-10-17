import { Effect } from 'effect'
import { PokeApi, PokeApiLive } from './PokeApi.ts'


const program = Effect.gen(function* () {
  const pokeApi = yield* PokeApi
  return yield* pokeApi.getPokemon
})

const runnable = program.pipe(Effect.provideService(PokeApi, PokeApiLive))

const main = runnable.pipe(
  Effect.catchTags({
    FetchError: () => Effect.succeed('Fetch error'),
    JsonError: () => Effect.succeed('Json error'),
    ConfigError: () => Effect.succeed('ConfigError error'),
  }),
)

Effect.runPromise(main.pipe(Effect.tap((r) => Effect.sync(() => console.log(r)))),
)