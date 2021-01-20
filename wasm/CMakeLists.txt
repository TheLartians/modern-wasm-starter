cmake_minimum_required(VERSION 3.5 FATAL_ERROR)

project(TypeScriptXX
  LANGUAGES CXX
)

# ---- Setup ----

set(CMAKE_CXX_FLAGS_RELEASE "-Oz -g0")

# ---- Dependencies ----
# Add C++ dependencies through CPM.cmake.
# See https://github.com/TheLartians/CPM.cmake for more info.
include(cmake/CPM.cmake)

# exact package versions are defined in package-lock.cmake
# this helps us specify exact versions of transitive dependencies
CPMUsePackageLock(package-lock.cmake)

# using the ModernCppStarter as an example project
# replace this with your library
CPMAddPackage(
  NAME Greeter
  GITHUB_REPOSITORY TheLartians/ModernCppStarter
  VERSION 0.16.1
)

# EmGlue is used to create the TypeScript declarations and the JavaScript bindings
CPMAddPackage(
  NAME EmGlue
  VERSION 0.6.1
  GITHUB_REPOSITORY TheLartians/EmGlue
)

# Format.cmake is used to run clang-format
CPMAddPackage(
  NAME Format.cmake
  GITHUB_REPOSITORY TheLartians/Format.cmake
  VERSION 1.6
)

# ---- Create wams glue library ----

add_library(wasmGlue source/wasmGlue.cpp)
set_target_properties(wasmGlue PROPERTIES CXX_STANDARD 17)

# link dependencies, replace `Greeter::Greeter` with your library
target_link_libraries(wasmGlue PUBLIC Glue Greeter::Greeter)

# ---- Create main library ----

set(EMSCRIPTEN_FLAGS "-s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s \"EXTRA_EXPORTED_RUNTIME_METHODS=['addOnPostRun','callMain']\" -s MODULARIZE=1 -s SINGLE_FILE=1 -s INVOKE_RUN=0")

add_executable(WasmModule source/main.cpp)
target_link_libraries(WasmModule wasmGlue EmGlue ${EMSCRIPTEN_FLAGS})
set_target_properties(WasmModule PROPERTIES
  CXX_STANDARD 17 
  OUTPUT_NAME WasmModule
  COMPILE_FLAGS ${EMSCRIPTEN_FLAGS}
)

# ---- Create declarations printer ----

add_executable(WasmModuleDeclarations source/declarations.cpp)
set_target_properties(WasmModuleDeclarations PROPERTIES CXX_STANDARD 17)
target_link_libraries(WasmModuleDeclarations wasmGlue)

# ---- Move library and declarations into place ----

add_custom_command(TARGET WasmModule POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_BINARY_DIR}/WasmModule.js ${CMAKE_CURRENT_LIST_DIR}/../source/WasmModule.js
)

add_custom_command(TARGET WasmModuleDeclarations POST_BUILD
  COMMAND node ${CMAKE_CURRENT_BINARY_DIR}/WasmModuleDeclarations.js > ${CMAKE_CURRENT_LIST_DIR}/../source/WasmModule.d.ts
)
