import { afterAll, afterEach, beforeAll, it, expect } from 'vitest'
import { server } from './node.ts'
import { ConfigProvider, Effect, Layer } from 'effect'
import { PokeApi } from '../PokeApi.ts'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


const TestConfigProvider = ConfigProvider.fromUnknown({
  BASE_URL: "http://localhost:3000",
});

const ConfigProviderLayer = ConfigProvider.layer(TestConfigProvider);
const MainLayer = PokeApi.Live.pipe(Layer.provide(ConfigProviderLayer));

const program = Effect.gen(function* () {
  const pokeApi = yield* PokeApi;
  return yield* pokeApi.getPokemon;
});

const main = program.pipe(Effect.provide(MainLayer));

it("returns a valid pokemon", async () => {
  const response = await Effect.runPromise(main);
  expect(response).toEqual({
    id: 1,
    height: 10,
    weight: 10,
    order: 1,
    name: "myname",
  });
});










