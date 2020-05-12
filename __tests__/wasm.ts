import {
  withGreeter,
  withGreeterScope,
  Greeter,
  persistGreeterValue,
  LanguageCode,
  deleteGreeterValue,
} from "../source";

test("Calling wasm methods", async () => {
  await withGreeter((greeterModule) => {
    const greeter = new greeterModule.Greeter("Wasm");
    expect(greeter.greet(greeterModule.LanguageCode.EN)).toBe("Hello, Wasm!");
  });
});

// non-public helper functions for testing
import {
  __getCurrentWasmScope,
  __getCurrentWasmScopeStackSize,
} from "../source/wasmWrapper";

test("Scoping", async () => {
  expect(__getCurrentWasmScopeStackSize()).toBe(0);
  await withGreeter((greeterModule) => {
    expect(__getCurrentWasmScopeStackSize()).toBe(1);
    expect(__getCurrentWasmScope().length).toBe(0);
    new greeterModule.Greeter("Outer");
    expect(__getCurrentWasmScope().length).toBe(1);
    withGreeterScope(() => {
      expect(__getCurrentWasmScopeStackSize()).toBe(2);
      expect(__getCurrentWasmScope().length).toBe(0);
      new greeterModule.Greeter("Inner 1");
      expect(__getCurrentWasmScope().length).toBe(1);
      new greeterModule.Greeter("Inner 2");
      expect(__getCurrentWasmScope().length).toBe(2);
    });
    expect(__getCurrentWasmScopeStackSize()).toBe(1);
  });
  expect(__getCurrentWasmScopeStackSize()).toBe(0);
});

test("Persisting values", async () => {
  let greeter: Greeter;
  let language: LanguageCode;

  await withGreeter((greeterModule) => {
    greeter = persistGreeterValue(new greeterModule.Greeter("Global"));
    language = greeterModule.LanguageCode.EN;
    expect(__getCurrentWasmScope().length).toBe(0);
  }).then(() => {
    expect(greeter.greet(language)).toBe("Hello, Global!");
    deleteGreeterValue(greeter);
  });
});
