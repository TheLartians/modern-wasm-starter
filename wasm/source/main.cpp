#include <glue/emscripten/state.h>

#include <exception>

#include "wasmGlue.h"

int main() {
  auto element = wasmGlue();
  glue::emscripten::State state;

  // EmGlue internal funcions
  element["setConstructCallback"] = state.getConstructCallbackSetter();

  element["getExceptionMessage"] = [](size_t exceptionPtr) {
    // C++ exceptions in emscripten are captured as pointers. This method extracts the message.
    return std::string(reinterpret_cast<std::exception *>(exceptionPtr)->what());
  };

  state.addModule(element);
  return 0;
}