cmake_minimum_required(VERSION 3.5 FATAL_ERROR)

project(TypeScriptXX LANGUAGES CXX)

# ---- Setup ----

set(CMAKE_CXX_FLAGS_RELEASE "-Oz -g0")

# ---- Dependencies ----
# Add C++ dependencies through CPM.cmake. See
# https://github.com/TheLartians/CPM.cmake for more info.
include(cmake/CPM.cmake)

# Update transitive dependencies to more recent versions (this has to be done
# before adding derived projects)
cpmaddpackage("gh:TheLartians/PackageProject.cmake@1.6.0")
cpmaddpackage("gh:TheLartians/Glue@1.5.1")

# Format.cmake is used to run clang-format
cpmaddpackage("gh:TheLartians/Format.cmake@1.7.2")

# EmGlue is used to create the TypeScript declarations and the JavaScript
# bindings
cpmaddpackage("gh:TheLartians/EmGlue@0.6.1")

# using the ModernCppStarter as an example project for JS bindings replace this
# with the library you want to use
cpmaddpackage(NAME Greeter GITHUB_REPOSITORY TheLartians/ModernCppStarter
              VERSION 0.17.3)

# ---- Create wams glue library ----

add_library(wasmGlue source/wasmGlue.cpp)
set_target_properties(wasmGlue PROPERTIES CXX_STANDARD 17)

# link dependencies, replace `Greeter::Greeter` with your library
target_link_libraries(wasmGlue PUBLIC Glue Greeter::Greeter)

# ---- Create main library ----

set(EMSCRIPTEN_FLAGS
    "-s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s \"EXPORTED_RUNTIME_METHODS=['addOnPostRun','callMain']\" -s MODULARIZE=1 -s SINGLE_FILE=1 -s INVOKE_RUN=0"
)

add_executable(WasmModule source/main.cpp)
target_link_libraries(WasmModule wasmGlue EmGlue ${EMSCRIPTEN_FLAGS})

set_target_properties(WasmModule PROPERTIES CXX_STANDARD 17 OUTPUT_NAME
                                                            WasmModule)

# ---- Create declarations printer ----

add_executable(WasmModuleDeclarations source/declarations.cpp)
set_target_properties(WasmModuleDeclarations PROPERTIES CXX_STANDARD 17)
target_link_libraries(WasmModuleDeclarations wasmGlue)

# ---- Move library and declarations into place ----

add_custom_command(
  TARGET WasmModule
  POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_BINARY_DIR}/WasmModule.js
          ${CMAKE_CURRENT_LIST_DIR}/../source/WasmModule.js)

add_custom_command(
  TARGET WasmModuleDeclarations
  POST_BUILD
  COMMAND node ${CMAKE_CURRENT_BINARY_DIR}/WasmModuleDeclarations.js >
          ${CMAKE_CURRENT_LIST_DIR}/../source/WasmModule.d.ts)
