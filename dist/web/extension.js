/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(4);

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EIJEEditorProvider = void 0;
const vscode = __webpack_require__(1);
const _path = __webpack_require__(3);
const eije_filesystem_1 = __webpack_require__(5);
const eije_configuration_1 = __webpack_require__(6);
const eije_manager_1 = __webpack_require__(7);
const i18n_service_1 = __webpack_require__(10);
const notification_service_1 = __webpack_require__(17);
class EIJEEditorProvider {
    constructor(_context) {
        this._context = _context;
    }
    static isWebEnvironment() {
        return typeof process === 'undefined' || process.versions?.node === undefined;
    }
    static register(context) {
        const i18n = i18n_service_1.I18nService.getInstance(context);
        // Función para verificar si una carpeta es soportada (síncrona)
        const isSupportedFolder = (folderPath) => {
            if (!vscode.workspace.workspaceFolders) {
                return false;
            }
            for (const workspaceFolder of vscode.workspace.workspaceFolders) {
                const rootPath = workspaceFolder.uri.fsPath;
                for (const supportedFolder of eije_configuration_1.EIJEConfiguration.SUPPORTED_FOLDERS) {
                    // Verificar por nombre de carpeta - usar lógica más robusta para entorno web
                    let folderBaseName;
                    let relativePath;
                    if (this.isWebEnvironment()) {
                        // En entorno web, manejar las rutas manualmente
                        const normalizedFolderPath = folderPath.replace(/\\/g, '/');
                        const normalizedRootPath = rootPath.replace(/\\/g, '/');
                        // Extraer el nombre base de la carpeta
                        const pathParts = normalizedFolderPath.split('/');
                        folderBaseName = pathParts[pathParts.length - 1];
                        // Calcular la ruta relativa
                        if (normalizedFolderPath.startsWith(normalizedRootPath)) {
                            relativePath = normalizedFolderPath.substring(normalizedRootPath.length + 1);
                        }
                        else {
                            relativePath = normalizedFolderPath;
                        }
                    }
                    else {
                        // En entorno desktop, usar las funciones normales de path
                        folderBaseName = _path.basename(folderPath);
                        relativePath = _path.relative(rootPath, folderPath);
                    }
                    if (folderBaseName === supportedFolder) {
                        return true;
                    }
                    // Si la ruta relativa es exactamente el nombre de la carpeta soportada
                    if (relativePath === supportedFolder) {
                        return true;
                    }
                    // Verificar por ruta relativa
                    if (supportedFolder.includes('/') || supportedFolder.includes('\\')) {
                        const cleanPath = supportedFolder.replace(/^\.?[\/\\]/, ''); // Remover ./ o / inicial
                        const expectedPath = _path.join(rootPath, cleanPath);
                        if (_path.resolve(folderPath) === _path.resolve(expectedPath)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        // Función asíncrona para verificar si una carpeta es soportada (para entorno web)
        const isSupportedFolderAsync = async (folderPath) => {
            if (!vscode.workspace.workspaceFolders) {
                return false;
            }
            for (const workspaceFolder of vscode.workspace.workspaceFolders) {
                const rootPath = workspaceFolder.uri.fsPath;
                console.log('DEBUG ASYNC: Workspace root path:', rootPath);
                for (const supportedFolder of eije_configuration_1.EIJEConfiguration.SUPPORTED_FOLDERS) {
                    console.log('DEBUG ASYNC: Checking supported folder:', supportedFolder);
                    // Verificar por nombre de carpeta - usar lógica más robusta para entorno web
                    let folderBaseName;
                    let relativePath;
                    if (this.isWebEnvironment()) {
                        // En entorno web, manejar las rutas manualmente
                        const normalizedFolderPath = folderPath.replace(/\\/g, '/');
                        const normalizedRootPath = rootPath.replace(/\\/g, '/');
                        // Extraer el nombre base de la carpeta
                        const pathParts = normalizedFolderPath.split('/');
                        folderBaseName = pathParts[pathParts.length - 1];
                        // Calcular la ruta relativa
                        if (normalizedFolderPath.startsWith(normalizedRootPath)) {
                            relativePath = normalizedFolderPath.substring(normalizedRootPath.length + 1);
                        }
                        else {
                            relativePath = normalizedFolderPath;
                        }
                    }
                    else {
                        // En entorno desktop, usar las funciones normales de path
                        folderBaseName = _path.basename(folderPath);
                        relativePath = _path.relative(rootPath, folderPath);
                    }
                    console.log('DEBUG ASYNC: Folder basename:', folderBaseName);
                    console.log('DEBUG ASYNC: Relative path from workspace:', relativePath);
                    if (folderBaseName === supportedFolder) {
                        // Verificar que la carpeta realmente existe
                        const exists = await eije_filesystem_1.EIJEFileSystem.exists(folderPath);
                        console.log('DEBUG ASYNC: Folder exists:', exists);
                        if (exists) {
                            console.log('DEBUG ASYNC: Match found by basename!');
                            return true;
                        }
                    }
                    // Si la ruta relativa es exactamente el nombre de la carpeta soportada
                    if (relativePath === supportedFolder) {
                        const exists = await eije_filesystem_1.EIJEFileSystem.exists(folderPath);
                        console.log('DEBUG ASYNC: Folder exists (relative):', exists);
                        if (exists) {
                            console.log('DEBUG ASYNC: Match found by relative path!');
                            return true;
                        }
                    }
                    // Verificar por ruta relativa
                    if (supportedFolder.includes('/') || supportedFolder.includes('\\')) {
                        const cleanPath = supportedFolder.replace(/^\.?[\/\\]/, ''); // Remover ./ o / inicial
                        const expectedPath = _path.join(rootPath, cleanPath);
                        console.log('DEBUG ASYNC: Expected path:', expectedPath);
                        console.log('DEBUG ASYNC: Resolved folder path:', _path.resolve(folderPath));
                        console.log('DEBUG ASYNC: Resolved expected path:', _path.resolve(expectedPath));
                        if (_path.resolve(folderPath) === _path.resolve(expectedPath)) {
                            // Verificar que la carpeta realmente existe
                            const exists = await eije_filesystem_1.EIJEFileSystem.exists(folderPath);
                            console.log('DEBUG ASYNC: Folder exists (full path):', exists);
                            if (exists) {
                                console.log('DEBUG ASYNC: Match found by full path!');
                                return true;
                            }
                        }
                    }
                }
            }
            console.log('DEBUG ASYNC: No match found');
            return false;
        };
        // Listener para cambios en la selección del explorador
        const updateContextMenu = () => {
            // Por defecto, mostrar el menú contextual para todas las carpetas
            // La lógica de verificación se hará en el comando
            vscode.commands.executeCommand('setContext', 'ext:showContextMenu', true);
        };
        // Actualizar contexto inicialmente
        updateContextMenu();
        // Listener para cambios en la configuración
        const configListener = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('i18nJsonEditor.supportedFolders')) {
                updateContextMenu();
            }
        });
        context.subscriptions.push(configListener);
        return vscode.commands.registerCommand('ei18n-json-editor', async (uri) => {
            // Determinar la ruta de la carpeta
            let folderPath = null;
            if (!uri && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                // Buscar carpetas soportadas tanto por nombre como por ruta relativa
                for (const supportedFolder of eije_configuration_1.EIJEConfiguration.SUPPORTED_FOLDERS) {
                    let testPath;
                    if (supportedFolder.includes('/') || supportedFolder.includes('\\')) {
                        // Es una ruta relativa (ej: "src/i18n", "./src/i18n", "/src/i18n")
                        const cleanPath = supportedFolder.replace(/^\.?[\/\\]/, ''); // Remover ./ o / inicial
                        testPath = _path.join(rootPath, cleanPath);
                    }
                    else {
                        // Es solo un nombre de carpeta (ej: "i18n")
                        testPath = _path.join(rootPath, supportedFolder);
                    }
                    // Usar método apropiado según el entorno
                    const exists = this.isWebEnvironment()
                        ? await eije_filesystem_1.EIJEFileSystem.exists(testPath)
                        : eije_filesystem_1.EIJEFileSystem.existsSync(testPath);
                    if (exists) {
                        folderPath = testPath;
                        break;
                    }
                }
            }
            else if (uri) {
                // Verificar si la carpeta seleccionada es soportada
                const isSupported = this.isWebEnvironment()
                    ? await isSupportedFolderAsync(uri.fsPath)
                    : isSupportedFolder(uri.fsPath);
                if (isSupported) {
                    folderPath = uri.fsPath;
                }
                else {
                    // Si no es una carpeta soportada, mostrar mensaje de error
                    notification_service_1.NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.unsupportedFolder', _path.basename(uri.fsPath)));
                    return;
                }
            }
            // Si ya existe un panel, enfocarlo en lugar de crear uno nuevo
            if (EIJEEditorProvider.currentPanel) {
                EIJEEditorProvider.currentPanel.reveal(vscode.ViewColumn.One);
                // Opcionalmente, actualizar el contenido si la carpeta ha cambiado
                if (folderPath && folderPath !== EIJEEditorProvider.currentManager?.getFolderPath()) {
                    EIJEEditorProvider.currentManager?.updateFolderPath(folderPath);
                }
                return;
            }
            // Si no existe, crear un nuevo panel
            const panel = vscode.window.createWebviewPanel('ei18n-json-editor', i18n.t('extension.title'), vscode.ViewColumn.One, {
                retainContextWhenHidden: true,
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(_path.join(context.extensionPath, 'media'))]
            });
            // Crear y guardar el manager
            const manager = new eije_manager_1.EIJEManager(context, panel, folderPath);
            EIJEEditorProvider.currentPanel = panel;
            EIJEEditorProvider.currentManager = manager;
            // Cuando el panel se cierra, borrar las referencias
            panel.onDidDispose(() => {
                EIJEEditorProvider.currentPanel = undefined;
                EIJEEditorProvider.currentManager = undefined;
            });
        });
    }
}
exports.EIJEEditorProvider = EIJEEditorProvider;


/***/ }),
/* 3 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(4);
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;


/***/ }),
/* 4 */
/***/ ((module) => {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(4);

/**
 * Servicio de sistema de archivos que funciona tanto en Node.js como en entorno web
 * Autor: trystan4861
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EIJEFileSystem = void 0;
const vscode = __webpack_require__(1);
class EIJEFileSystem {
    static isWebEnvironment() {
        // Detectar si estamos en un entorno web usando múltiples métodos
        try {
            // Método 1: Verificar si process existe y tiene node
            const noNodeProcess = typeof process === 'undefined' || process.versions?.node === undefined;
            // Método 2: Verificar UIKind de VS Code
            const isVSCodeWeb = typeof vscode !== 'undefined' && vscode.env?.uiKind === vscode.UIKind.Web;
            // Método 3: Verificar si estamos en un dominio web conocido
            const isWebDomain = typeof globalThis !== 'undefined' &&
                typeof globalThis.location !== 'undefined' &&
                (globalThis.location.hostname?.includes('github.dev') ||
                    globalThis.location.hostname?.includes('vscode.dev'));
            return noNodeProcess || isVSCodeWeb || isWebDomain;
        }
        catch (error) {
            // En caso de error, asumir entorno web por seguridad
            return true;
        }
    }
    // Métodos síncronos para compatibilidad con código existente
    static readFileSync(filePath) {
        if (this.isWebEnvironment()) {
            // En entorno web, no podemos hacer operaciones síncronas
            // Retornamos una cadena vacía sin mostrar warning
            return '';
        }
        else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.readFileSync(filePath, 'utf8');
            }
            catch (error) {
                console.error('Error reading file:', error);
                return '';
            }
        }
    }
    static writeFileSync(filePath, content) {
        if (this.isWebEnvironment()) {
            // En entorno web, no podemos hacer operaciones síncronas
            // No hacemos nada sin mostrar warning
            return;
        }
        else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                fs.writeFileSync(filePath, content, 'utf8');
            }
            catch (error) {
                console.error('Error writing file:', error);
            }
        }
    }
    static existsSync(filePath) {
        if (this.isWebEnvironment()) {
            // En entorno web, no podemos hacer operaciones síncronas
            // Retornamos false sin mostrar warning
            return false;
        }
        else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.existsSync(filePath);
            }
            catch (error) {
                console.error('Error checking file existence:', error);
                return false;
            }
        }
    }
    static mkdirSync(dirPath, options) {
        if (this.isWebEnvironment()) {
            // En entorno web, no podemos hacer operaciones síncronas
            // No hacemos nada sin mostrar warning
            return;
        }
        else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                fs.mkdirSync(dirPath, options);
            }
            catch (error) {
                console.error('Error creating directory:', error);
            }
        }
    }
    static readdirSync(dirPath) {
        if (this.isWebEnvironment()) {
            // En entorno web, no podemos hacer operaciones síncronas
            // Retornamos array vacío sin mostrar warning
            return [];
        }
        else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.readdirSync(dirPath);
            }
            catch (error) {
                console.error('Error reading directory:', error);
                return [];
            }
        }
    }
    static async readFile(filePath) {
        if (this.isWebEnvironment()) {
            // Usar la API de VS Code para entorno web
            const uri = vscode.Uri.file(filePath);
            const data = await vscode.workspace.fs.readFile(uri);
            // Convertir Uint8Array a string sin usar Buffer
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(data);
        }
        else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.readFileSync(filePath, 'utf8');
            }
            catch (error) {
                console.error('Error reading file:', error);
                return '';
            }
        }
    }
    static async writeFile(filePath, content) {
        if (this.isWebEnvironment()) {
            // Usar la API de VS Code para entorno web
            const uri = vscode.Uri.file(filePath);
            // Convertir string a Uint8Array sin usar Buffer
            const encoder = new TextEncoder();
            const data = encoder.encode(content);
            await vscode.workspace.fs.writeFile(uri, data);
        }
        else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                fs.writeFileSync(filePath, content, 'utf8');
            }
            catch (error) {
                console.error('Error writing file:', error);
            }
        }
    }
    static async exists(filePath) {
        if (this.isWebEnvironment()) {
            // Usar la API de VS Code para entorno web
            try {
                const uri = vscode.Uri.file(filePath);
                await vscode.workspace.fs.stat(uri);
                return true;
            }
            catch {
                return false;
            }
        }
        else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.existsSync(filePath);
            }
            catch (error) {
                console.error('Error checking file existence:', error);
                return false;
            }
        }
    }
    static async readdir(dirPath) {
        if (this.isWebEnvironment()) {
            // Usar la API de VS Code para entorno web
            const uri = vscode.Uri.file(dirPath);
            const entries = await vscode.workspace.fs.readDirectory(uri);
            return entries.map(([name]) => name);
        }
        else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.readdirSync(dirPath);
            }
            catch (error) {
                console.error('Error reading directory:', error);
                return [];
            }
        }
    }
    static async mkdir(dirPath) {
        if (this.isWebEnvironment()) {
            // Usar la API de VS Code para entorno web
            const uri = vscode.Uri.file(dirPath);
            await vscode.workspace.fs.createDirectory(uri);
        }
        else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            }
            catch (error) {
                console.error('Error creating directory:', error);
            }
        }
    }
}
exports.EIJEFileSystem = EIJEFileSystem;


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(4);

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EIJEConfiguration = void 0;
const vscode = __webpack_require__(1);
const _path = __webpack_require__(3);
const eije_filesystem_1 = __webpack_require__(5);
class EIJEConfiguration {
    // Limpiar caché de configuración (solo para configuraciones específicas)
    static clearConfigCache(specificKey) {
        if (specificKey) {
            delete this._configCache[`config_${specificKey}`];
        }
        else {
            this._configCache = {};
        }
        // NO limpiar el caché de detección de entorno web para evitar re-detección
        // NO resetear _configFileCreated para evitar recreación
    }
    // Ruta del archivo de configuración dentro de .vscode
    static getConfigPath(workspaceFolder) {
        try {
            // Asegurar que el directorio .vscode existe
            const vscodePath = _path.join(workspaceFolder.uri.fsPath, '.vscode');
            if (!eije_filesystem_1.EIJEFileSystem.existsSync(vscodePath)) {
                eije_filesystem_1.EIJEFileSystem.mkdirSync(vscodePath, { recursive: true });
            }
            const configPath = _path.join(vscodePath, '.ei18n-editor-config.json');
            // Si el archivo no existe, crearlo con configuración por defecto SOLO UNA VEZ
            if (!eije_filesystem_1.EIJEFileSystem.existsSync(configPath) && !this._configFileCreated) {
                this.createDefaultConfigFile(configPath);
                this._configFileCreated = true;
            }
            return configPath;
        }
        catch (error) {
            console.error('Error getting config path:', error);
            return '';
        }
    }
    static createDefaultConfigFile(configPath) {
        try {
            const defaultConfig = {
                allowEmptyTranslations: false,
                defaultLanguage: "en",
                forceKeyUPPERCASE: true,
                jsonSpace: 2,
                keySeparator: ".",
                lineEnding: "\n",
                supportedFolders: ["i18n"],
                workspaceFolders: [],
                defaultWorkspaceFolder: "",
                translationService: "Coming soon",
                translationServiceApiKey: "Coming soon",
                visibleColumns: [],
                hiddenColumns: []
            };
            eije_filesystem_1.EIJEFileSystem.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        }
        catch (error) {
            console.error('Error creating default config file:', error);
        }
    }
    // Versión asíncrona para entorno web
    static async getConfigPathAsync(workspaceFolder) {
        const vscodePath = _path.join(workspaceFolder.uri.fsPath, '.vscode');
        if (!(await eije_filesystem_1.EIJEFileSystem.exists(vscodePath))) {
            await eije_filesystem_1.EIJEFileSystem.mkdir(vscodePath);
        }
        return _path.join(vscodePath, '.ei18n-editor-config.json');
    }
    static isWebEnvironment() {
        // Usar caché si ya se calculó
        if (this._isWebEnvironmentCache !== null) {
            return this._isWebEnvironmentCache;
        }
        // Usar la misma lógica que EIJEFileSystem para consistencia
        try {
            // Método 1: Verificar si process existe y tiene node
            const noNodeProcess = typeof process === 'undefined' || process.versions?.node === undefined;
            // Método 2: Verificar UIKind de VS Code
            const isVSCodeWeb = typeof vscode !== 'undefined' && vscode.env?.uiKind === vscode.UIKind.Web;
            // Método 3: Verificar si estamos en un dominio web conocido
            const isWebDomain = typeof globalThis !== 'undefined' &&
                typeof globalThis.location !== 'undefined' &&
                (globalThis.location.hostname?.includes('github.dev') ||
                    globalThis.location.hostname?.includes('vscode.dev'));
            const isWeb = noNodeProcess || isVSCodeWeb || isWebDomain;
            // Solo mostrar debug la primera vez
            if (this._isWebEnvironmentCache === null) {
                console.log('DEBUG Web Environment Detection:', {
                    uiKind: vscode.env.uiKind,
                    isVSCodeWeb,
                    workspaceScheme: vscode.workspace.workspaceFolders?.[0]?.uri.scheme,
                    hostname: globalThis.location?.hostname,
                    isWebDomain,
                    hasNodeProcess: typeof process !== 'undefined' && !!process.versions?.node,
                    noNodeProcess,
                    finalResult: isWeb
                });
            }
            // Guardar en caché
            this._isWebEnvironmentCache = isWeb;
            return isWeb;
        }
        catch (error) {
            console.log('DEBUG Web Environment Detection Error:', error);
            // En caso de error, asumir entorno web por seguridad
            this._isWebEnvironmentCache = true;
            return true;
        }
    }
    /**
     * Verifica si un idioma es RTL (Right-to-Left)
     * @param language Código de idioma (ej. 'ar', 'he')
     * @returns true si el idioma es RTL, false en caso contrario
     */
    static isRTL(language) {
        // Extraer código base del idioma (ej. 'ar-EG' -> 'ar')
        const baseLanguage = language.split('-')[0].toLowerCase();
        return this.RTL_LANGUAGES.includes(baseLanguage);
    }
    // Obtener una configuración específica del archivo local o global
    static getConfigValue(configName, globalSettingName, defaultValue) {
        const cacheKey = `config_${configName}`;
        // Verificar caché primero
        if (this._configCache[cacheKey] !== undefined) {
            return this._configCache[cacheKey];
        }
        let value = defaultValue;
        const isWeb = this.isWebEnvironment();
        if (isWeb) {
            // En entorno web, intentar leer archivo local usando métodos asíncronos
            // pero como este método es síncrono, usar configuración global como fallback
            const globalValue = vscode.workspace.getConfiguration().get(globalSettingName);
            value = globalValue !== undefined ? globalValue : defaultValue;
            // Intentar cargar configuración local de forma asíncrona en background
            this.loadConfigFromFileAsync(configName).then(fileValue => {
                if (fileValue !== undefined) {
                    this._configCache[cacheKey] = fileValue;
                }
            }).catch(() => {
                // Ignorar errores silenciosamente
            });
        }
        else {
            try {
                // Primero intentar leer del archivo de configuración local
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const configPath = this.getConfigPath(workspaceFolder);
                    if (configPath && eije_filesystem_1.EIJEFileSystem.existsSync(configPath)) {
                        const configContent = eije_filesystem_1.EIJEFileSystem.readFileSync(configPath);
                        if (configContent) {
                            const config = JSON.parse(configContent);
                            if (config[configName] !== undefined) {
                                value = config[configName];
                            }
                            else {
                                // Si no está en el archivo local, usar configuración global
                                const globalValue = vscode.workspace.getConfiguration().get(globalSettingName);
                                value = globalValue !== undefined ? globalValue : defaultValue;
                            }
                        }
                        else {
                            // Si el archivo está vacío, usar configuración global
                            const globalValue = vscode.workspace.getConfiguration().get(globalSettingName);
                            value = globalValue !== undefined ? globalValue : defaultValue;
                        }
                    }
                    else {
                        // Si no hay archivo local, usar configuración global
                        const globalValue = vscode.workspace.getConfiguration().get(globalSettingName);
                        value = globalValue !== undefined ? globalValue : defaultValue;
                    }
                }
            }
            catch (e) {
                console.error(`Error loading ${configName} from config file:`, e);
                // En caso de error, usar configuración global
                const globalValue = vscode.workspace.getConfiguration().get(globalSettingName);
                value = globalValue !== undefined ? globalValue : defaultValue;
            }
        }
        // Guardar en caché
        this._configCache[cacheKey] = value;
        return value;
    }
    // Método auxiliar para cargar configuración de archivo de forma asíncrona
    static async loadConfigFromFileAsync(configName) {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = await this.getConfigPathAsync(workspaceFolder);
                if (await eije_filesystem_1.EIJEFileSystem.exists(configPath)) {
                    const configContent = await eije_filesystem_1.EIJEFileSystem.readFile(configPath);
                    if (configContent) {
                        const config = JSON.parse(configContent);
                        return config[configName];
                    }
                }
            }
        }
        catch (e) {
            console.error(`Error loading ${configName} from config file async:`, e);
        }
        return undefined;
    }
    // Versión asíncrona para entorno web
    static async getConfigValueAsync(configName, globalSettingName, defaultValue) {
        if (this.isWebEnvironment()) {
            // En entorno web, solo usar configuración global
            const value = vscode.workspace.getConfiguration().get(globalSettingName);
            return value !== undefined ? value : defaultValue;
        }
        try {
            // Primero intentar leer del archivo de configuración local
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = await this.getConfigPathAsync(workspaceFolder);
                if (await eije_filesystem_1.EIJEFileSystem.exists(configPath)) {
                    const configContent = await eije_filesystem_1.EIJEFileSystem.readFile(configPath);
                    const config = JSON.parse(configContent);
                    if (config[configName] !== undefined) {
                        return config[configName];
                    }
                }
            }
        }
        catch (e) {
            console.error(`Error loading ${configName} from config file:`, e);
        }
        // Si no se encuentra en el archivo local, usar la configuración global
        const value = vscode.workspace.getConfiguration().get(globalSettingName);
        return value !== undefined ? value : defaultValue;
    }
    static get FORCE_KEY_UPPERCASE() {
        return this.getConfigValue('forceKeyUPPERCASE', 'i18nJsonEditor.forceKeyUPPERCASE', true);
    }
    static get JSON_SPACE() {
        return this.getConfigValue('jsonSpace', 'i18nJsonEditor.jsonSpace', 2);
    }
    static get KEY_SEPARATOR() {
        const value = this.getConfigValue('keySeparator', 'i18nJsonEditor.keySeparator', '.');
        return value !== undefined && value !== true ? value : '.';
    }
    static get LINE_ENDING() {
        return this.getConfigValue('lineEnding', 'i18nJsonEditor.lineEnding', '\n');
    }
    static get SUPPORTED_FOLDERS() {
        return this.getConfigValue('supportedFolders', 'i18nJsonEditor.supportedFolders', ['i18n']);
    }
    static get TRANSLATION_SERVICE() {
        return this.getConfigValue('translationService', 'i18nJsonEditor.translationService', 'Coming soon');
    }
    static get TRANSLATION_SERVICE_API_KEY() {
        return this.getConfigValue('translationServiceApiKey', 'i18nJsonEditor.translationServiceApiKey', 'Coming soon');
    }
    static get ALLOW_EMPTY_TRANSLATIONS() {
        return this.getConfigValue('allowEmptyTranslations', 'i18nJsonEditor.allowEmptyTranslations', false);
    }
    static get DEFAULT_LANGUAGE() {
        return this.getConfigValue('defaultLanguage', 'i18nJsonEditor.defaultLanguage', 'en');
    }
    static get VISIBLE_COLUMNS() {
        const result = this.getConfigValue('visibleColumns', 'i18nJsonEditor.visibleColumns', []);
        return result;
    }
    static get HIDDEN_COLUMNS() {
        const result = this.getConfigValue('hiddenColumns', 'i18nJsonEditor.hiddenColumns', []);
        return result;
    }
    // Guarda toda la configuración en el archivo local
    static saveFullConfiguration() {
        if (this.isWebEnvironment()) {
            // En entorno web, intentar guardar en archivo local usando métodos asíncronos
            this.saveFullConfigurationAsync().catch(() => {
                // Si falla, usar configuración global como fallback
                const config = vscode.workspace.getConfiguration();
                Promise.all([
                    config.update('i18nJsonEditor.forceKeyUPPERCASE', this.FORCE_KEY_UPPERCASE, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.jsonSpace', this.JSON_SPACE, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.keySeparator', this.KEY_SEPARATOR, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.lineEnding', this.LINE_ENDING, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.supportedFolders', this.SUPPORTED_FOLDERS, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.translationService', this.TRANSLATION_SERVICE, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.translationServiceApiKey', this.TRANSLATION_SERVICE_API_KEY, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.allowEmptyTranslations', this.ALLOW_EMPTY_TRANSLATIONS, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.defaultLanguage', this.DEFAULT_LANGUAGE, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.visibleColumns', this.VISIBLE_COLUMNS, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.hiddenColumns', this.HIDDEN_COLUMNS, vscode.ConfigurationTarget.Global)
                ]).catch(error => {
                    console.error('Error saving web configuration:', error);
                });
            });
            return;
        }
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                let config = {};
                // Load existing config if it exists
                if (eije_filesystem_1.EIJEFileSystem.existsSync(configPath)) {
                    const configContent = eije_filesystem_1.EIJEFileSystem.readFileSync(configPath);
                    config = JSON.parse(configContent);
                }
                // Update all configuration values
                config.forceKeyUPPERCASE = this.FORCE_KEY_UPPERCASE;
                config.jsonSpace = this.JSON_SPACE;
                config.keySeparator = this.KEY_SEPARATOR;
                config.lineEnding = this.LINE_ENDING;
                config.supportedFolders = this.SUPPORTED_FOLDERS;
                config.translationService = this.TRANSLATION_SERVICE;
                config.translationServiceApiKey = this.TRANSLATION_SERVICE_API_KEY;
                config.allowEmptyTranslations = this.ALLOW_EMPTY_TRANSLATIONS;
                config.defaultLanguage = this.DEFAULT_LANGUAGE;
                // Actualizar las columnas visibles y ocultas
                config.visibleColumns = this.VISIBLE_COLUMNS;
                config.hiddenColumns = this.HIDDEN_COLUMNS;
                config.defaultWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
                // Save config
                eije_filesystem_1.EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
            }
        }
        catch (e) {
            console.error('Error saving configuration:', e);
        }
    }
    // Versión asíncrona para entorno web
    static async saveFullConfigurationAsync() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = await this.getConfigPathAsync(workspaceFolder);
                let config = {};
                // Load existing config if it exists
                if (await eije_filesystem_1.EIJEFileSystem.exists(configPath)) {
                    const configContent = await eije_filesystem_1.EIJEFileSystem.readFile(configPath);
                    if (configContent) {
                        config = JSON.parse(configContent);
                    }
                }
                // Update all configuration values
                config.forceKeyUPPERCASE = this.FORCE_KEY_UPPERCASE;
                config.jsonSpace = this.JSON_SPACE;
                config.keySeparator = this.KEY_SEPARATOR;
                config.lineEnding = this.LINE_ENDING;
                config.supportedFolders = this.SUPPORTED_FOLDERS;
                config.translationService = this.TRANSLATION_SERVICE;
                config.translationServiceApiKey = this.TRANSLATION_SERVICE_API_KEY;
                config.allowEmptyTranslations = this.ALLOW_EMPTY_TRANSLATIONS;
                config.defaultLanguage = this.DEFAULT_LANGUAGE;
                // Actualizar las columnas visibles y ocultas
                config.visibleColumns = this.VISIBLE_COLUMNS;
                config.hiddenColumns = this.HIDDEN_COLUMNS;
                config.defaultWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
                // Save config
                await eije_filesystem_1.EIJEFileSystem.writeFile(configPath, JSON.stringify(config, null, 2));
            }
        }
        catch (e) {
            console.error('Error saving configuration async:', e);
            throw e; // Re-throw para que el catch en saveFullConfiguration funcione
        }
    }
    static async saveHiddenColumns(columns) {
        if (this.isWebEnvironment()) {
            // En entorno web, usar configuración global de VS Code
            const config = vscode.workspace.getConfiguration();
            await config.update('i18nJsonEditor.hiddenColumns', columns, vscode.ConfigurationTarget.Global);
            // También actualizar el caché inmediatamente
            this._configCache['config_hiddenColumns'] = columns;
            return;
        }
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                if (configPath) {
                    let config = {};
                    if (eije_filesystem_1.EIJEFileSystem.existsSync(configPath)) {
                        const configContent = eije_filesystem_1.EIJEFileSystem.readFileSync(configPath);
                        config = JSON.parse(configContent);
                    }
                    config.hiddenColumns = columns;
                    eije_filesystem_1.EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                }
            }
        }
        catch (e) {
            console.error('Error saving hidden columns:', e);
        }
    }
    static async saveVisibleColumns(columns) {
        if (this.isWebEnvironment()) {
            // En entorno web, usar configuración global de VS Code
            const config = vscode.workspace.getConfiguration();
            await config.update('i18nJsonEditor.visibleColumns', columns, vscode.ConfigurationTarget.Global);
            // También actualizar el caché inmediatamente
            this._configCache['config_visibleColumns'] = columns;
            return;
        }
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                if (configPath) {
                    let config = {};
                    if (eije_filesystem_1.EIJEFileSystem.existsSync(configPath)) {
                        const configContent = eije_filesystem_1.EIJEFileSystem.readFileSync(configPath);
                        config = JSON.parse(configContent);
                    }
                    config.visibleColumns = columns;
                    eije_filesystem_1.EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                }
            }
        }
        catch (e) {
            console.error('Error saving visible columns:', e);
        }
    }
    static async saveDefaultWorkspaceFolder(folderName) {
        if (this.isWebEnvironment()) {
            // En entorno web, usar configuración local de archivo
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const configPath = await this.getConfigPathAsync(workspaceFolder);
                    let config = {};
                    if (await eije_filesystem_1.EIJEFileSystem.exists(configPath)) {
                        const configContent = await eije_filesystem_1.EIJEFileSystem.readFile(configPath);
                        if (configContent) {
                            config = JSON.parse(configContent);
                        }
                    }
                    config.defaultWorkspaceFolder = folderName;
                    await eije_filesystem_1.EIJEFileSystem.writeFile(configPath, JSON.stringify(config, null, 2));
                    // Actualizar el caché inmediatamente
                    this._configCache['config_defaultWorkspaceFolder'] = folderName;
                }
            }
            catch (e) {
                console.error('Error saving default workspace folder in web environment:', e);
            }
            return;
        }
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                if (configPath) {
                    let config = {};
                    if (eije_filesystem_1.EIJEFileSystem.existsSync(configPath)) {
                        const configContent = eije_filesystem_1.EIJEFileSystem.readFileSync(configPath);
                        config = JSON.parse(configContent);
                    }
                    config.defaultWorkspaceFolder = folderName;
                    eije_filesystem_1.EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    // Actualizar el caché inmediatamente
                    this._configCache['config_defaultWorkspaceFolder'] = folderName;
                }
            }
        }
        catch (e) {
            console.error('Error saving default workspace folder:', e);
        }
    }
    static get DEFAULT_WORKSPACE_FOLDER() {
        return this.getConfigValue('defaultWorkspaceFolder', 'i18nJsonEditor.defaultWorkspaceFolder', '');
    }
    static get WORKSPACE_FOLDERS() {
        const folders = this.getConfigValue('workspaceFolders', 'i18nJsonEditor.workspaceFolders', []);
        let workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [];
        }
        const _folders = [];
        folders?.forEach(d => {
            var path = vscode.Uri.file(_path.join(workspaceFolder.uri.fsPath, d.path)).fsPath;
            if (eije_filesystem_1.EIJEFileSystem.existsSync(path)) {
                _folders.push({ name: d.name, path: path });
            }
        });
        return _folders !== undefined ? _folders : [];
    }
    // Método para inicializar configuración de forma asíncrona en entorno web
    static async initializeConfigurationAsync() {
        if (this.isWebEnvironment()) {
            try {
                // Intentar cargar configuración del archivo local
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const configPath = await this.getConfigPathAsync(workspaceFolder);
                    // Crear directorio .vscode si no existe
                    const vscodePath = _path.join(workspaceFolder.uri.fsPath, '.vscode');
                    if (!(await eije_filesystem_1.EIJEFileSystem.exists(vscodePath))) {
                        await eije_filesystem_1.EIJEFileSystem.mkdir(vscodePath);
                    }
                    // Si el archivo no existe, crearlo con configuración por defecto
                    if (!(await eije_filesystem_1.EIJEFileSystem.exists(configPath))) {
                        const defaultConfig = {
                            allowEmptyTranslations: false,
                            defaultLanguage: "en",
                            forceKeyUPPERCASE: true,
                            jsonSpace: 2,
                            keySeparator: ".",
                            lineEnding: "\n",
                            supportedFolders: ["i18n"],
                            workspaceFolders: [],
                            defaultWorkspaceFolder: "",
                            translationService: "Coming soon",
                            translationServiceApiKey: "Coming soon",
                            visibleColumns: [],
                            hiddenColumns: []
                        };
                        await eije_filesystem_1.EIJEFileSystem.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
                    }
                    // Cargar configuración del archivo
                    const configContent = await eije_filesystem_1.EIJEFileSystem.readFile(configPath);
                    if (configContent) {
                        const config = JSON.parse(configContent);
                        // Actualizar caché con valores del archivo
                        Object.keys(config).forEach(key => {
                            this._configCache[`config_${key}`] = config[key];
                        });
                    }
                }
            }
            catch (error) {
                console.error('Error initializing configuration async:', error);
            }
        }
    }
}
exports.EIJEConfiguration = EIJEConfiguration;
// Cache para configuración en memoria
EIJEConfiguration._configCache = {};
// Cache para detección de entorno web
EIJEConfiguration._isWebEnvironmentCache = null;
// Control para evitar creación repetitiva de archivo de configuración
EIJEConfiguration._configFileCreated = false;
// Lista de códigos de idioma RTL (Right-to-Left)
EIJEConfiguration.RTL_LANGUAGES = [
    'ar',
    'dv',
    'fa',
    'he',
    'ks',
    'ku',
    'ps',
    'sd',
    'ug',
    'ur',
    'yi' // Yiddish
];


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EIJEManager = void 0;
const vscode = __webpack_require__(1);
const _path = __webpack_require__(3);
const eije_filesystem_1 = __webpack_require__(5);
const eije_configuration_1 = __webpack_require__(6);
const eije_data_1 = __webpack_require__(8);
const i18n_service_1 = __webpack_require__(10);
const notification_service_1 = __webpack_require__(17);
class EIJEManager {
    constructor(_context, _panel, folderPath) {
        this._context = _context;
        this._panel = _panel;
        this.folderPath = folderPath;
        // Configurar el servicio de notificaciones con el panel webview
        notification_service_1.NotificationService.getInstance().setWebviewPanel(this._panel);
        // Inicializar configuración de forma asíncrona en entorno web
        eije_configuration_1.EIJEConfiguration.initializeConfigurationAsync().then(() => {
            // Después de cargar la configuración, enviar al frontend
            this._panel.webview.postMessage({
                command: 'configurationUpdate',
                allowEmptyTranslations: eije_configuration_1.EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS,
                defaultLanguage: eije_configuration_1.EIJEConfiguration.DEFAULT_LANGUAGE,
                forceKeyUPPERCASE: eije_configuration_1.EIJEConfiguration.FORCE_KEY_UPPERCASE
            });
        }).catch(error => {
            console.error('Error initializing configuration:', error);
        });
        // Guardar/inicializar el archivo de configuración (método síncrono para desktop)
        eije_configuration_1.EIJEConfiguration.saveFullConfiguration();
        // Almacenar el valor actual de allowEmptyTranslations
        this._previousAllowEmptyTranslations = eije_configuration_1.EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS;
        // Configurar un listener para cambios en la configuración
        this._context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('i18nJsonEditor.allowEmptyTranslations')) {
                // Si cambió la configuración de allowEmptyTranslations
                const newAllowEmptyValue = eije_configuration_1.EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS;
                // Solo actualizar si realmente cambió el valor
                if (this._previousAllowEmptyTranslations !== newAllowEmptyValue) {
                    this._previousAllowEmptyTranslations = newAllowEmptyValue;
                    // Revalidar todas las traducciones con la nueva configuración
                    this._data._revalidateAllTranslations();
                    // Actualizar UI con el nuevo estado
                    const currentPage = this._data.getCurrentPage();
                    this.checkEmptyTranslations(currentPage);
                    // Refrescar la tabla de datos para mostrar posibles nuevos errores
                    this.refreshDataTable();
                }
            }
        }));
        this._data = new eije_data_1.EIJEData(this);
        this._initEvents();
        this._initTemplate();
        // Inicializar el template de forma asíncrona
        this.initializeTemplate();
        // Inicializar datos de forma asíncrona
        this._initializeData();
        // Guardar la configuración cuando se cierra el panel
        this._panel.onDidDispose(() => {
            eije_configuration_1.EIJEConfiguration.saveFullConfiguration();
        });
    }
    get isWorkspace() {
        return this.folderPath === null;
    }
    async initializeTemplate() {
        try {
            const templateHtml = await this.getTemplateAsync();
            this._panel.webview.html = templateHtml;
        }
        catch (error) {
            console.error('Error initializing template:', error);
            this._panel.webview.html = '<html><body><h1>Error loading template</h1><p>' + error + '</p></body></html>';
        }
    }
    async _initializeData() {
        try {
            // Establecer la carpeta de trabajo inicial
            await this.setInitialWorkspaceFolder();
            await this._data.initialize();
            // Limpiar idiomas eliminados de las listas de visibles/ocultos
            await this.cleanupDeletedLanguages();
            // Inicializar el selector de carpetas de trabajo
            this.initializeWorkspaceFolderSelector();
            this.refreshDataTable();
        }
        catch (error) {
            console.error('Error initializing data:', error);
        }
    }
    // Método para obtener la ruta de la carpeta actual
    getFolderPath() {
        return this.folderPath;
    }
    // Método para actualizar la ruta de la carpeta y recargar los datos
    async updateFolderPath(folderPath) {
        this.folderPath = folderPath;
        await this.reloadData();
    }
    _initEvents() {
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'add':
                    this._data.add();
                    return;
                case 'mark':
                    this._data.mark(message.id);
                    return;
                case 'navigate':
                    this._data.navigate(message.page);
                    return;
                case 'pageSize':
                    this._data.pageSize(+message.value);
                    return;
                case 'refresh':
                    this.refreshDataTable();
                    return;
                case 'reload':
                    this.reloadData().catch(error => console.error('Error reloading data:', error));
                    return;
                case 'showNewLanguageInput':
                    this._showNewLanguageInput();
                    return;
                case 'newLanguage':
                    this.createNewLanguage(message.langCode);
                    return;
                case 'remove':
                    this._data.remove(message.id);
                    return;
                case 'save':
                    await this._data.save();
                    return;
                case 'switchWorkspaceFolder':
                    await this.switchWorkspaceFolder(message.folderName);
                    return;
                case 'saveAndSwitchWorkspaceFolder':
                    await this._data.save();
                    await this.switchWorkspaceFolder(message.folderName);
                    return;
                case 'discardAndSwitchWorkspaceFolder':
                    await this.discardChangesAndSwitchWorkspaceFolder(message.folderName);
                    return;
                case 'search':
                    this._data.search(message.value);
                    return;
                case 'select':
                    this._data.select(message.id);
                    return;
                case 'sort':
                    this._data.sort(message.column, message.ascending);
                    return;
                case 'switch-view':
                    this._data.switchView(message.view);
                    return;
                case 'update':
                    this._data.update(message.id, message.value, message.language);
                    return;
                case 'translate':
                    this._data.translate(message.id, message.language);
                    return;
                case 'toggleColumn':
                    this.toggleColumnVisibility(message.language, message.visible);
                    return;
                case 'updateColumnVisibility':
                    this.updateColumnVisibility(message.columnsToShow, message.columnsToHide);
                    return;
                case 'checkEmptyTranslations':
                    this.checkEmptyTranslations(message.currentPage);
                    return;
                case 'navigateToNextEmptyTranslation':
                    this.navigateToNextEmptyTranslation();
                    return;
            }
        });
    }
    toggleColumnVisibility(language, visible) {
        // No se permite ocultar la columna 'key' ni el idioma por defecto
        const defaultLanguage = eije_configuration_1.EIJEConfiguration.DEFAULT_LANGUAGE;
        if (language === 'key' || language === defaultLanguage) {
            return;
        }
        // Limpiar caché antes de leer la configuración actual
        eije_configuration_1.EIJEConfiguration.clearConfigCache();
        // Forzar recarga de configuración
        let visibleColumns = [...eije_configuration_1.EIJEConfiguration.VISIBLE_COLUMNS];
        let hiddenColumns = [...eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS];
        if (visible) {
            // Mostrar columna
            if (!visibleColumns.includes(language)) {
                visibleColumns.push(language);
            }
            // Eliminar de columnas ocultas si existe
            hiddenColumns = hiddenColumns.filter(col => col !== language);
        }
        else {
            // Ocultar columna
            visibleColumns = visibleColumns.filter(col => col !== language);
            // Añadir a columnas ocultas si no existe
            if (!hiddenColumns.includes(language)) {
                hiddenColumns.push(language);
            }
        }
        // Guardar configuración de forma asíncrona
        Promise.all([
            eije_configuration_1.EIJEConfiguration.saveVisibleColumns(visibleColumns),
            eije_configuration_1.EIJEConfiguration.saveHiddenColumns(hiddenColumns)
        ]).then(() => {
            // Guardar la configuración completa para mantener el archivo actualizado
            eije_configuration_1.EIJEConfiguration.saveFullConfiguration();
            // Limpiar caché específico para forzar recarga
            eije_configuration_1.EIJEConfiguration.clearConfigCache('visibleColumns');
            eije_configuration_1.EIJEConfiguration.clearConfigCache('hiddenColumns');
            // Actualizar la tabla después de un pequeño delay
            setTimeout(() => {
                this.refreshDataTable();
            }, 100);
        });
    }
    updateColumnVisibility(columnsToShow, columnsToHide) {
        const allLanguages = this._data.getLanguages();
        let newVisibleColumns = [];
        let newHiddenColumns = [];
        const defaultLanguage = eije_configuration_1.EIJEConfiguration.DEFAULT_LANGUAGE;
        allLanguages.forEach(language => {
            if (language === defaultLanguage) {
                return;
            }
            if (columnsToShow.includes(language)) {
                newVisibleColumns.push(language);
            }
            else if (columnsToHide.includes(language)) {
                newHiddenColumns.push(language);
            }
            else {
                const currentVisible = eije_configuration_1.EIJEConfiguration.VISIBLE_COLUMNS;
                const currentHidden = eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS;
                if (currentVisible.includes(language)) {
                    newVisibleColumns.push(language);
                }
                else if (currentHidden.includes(language)) {
                    newHiddenColumns.push(language);
                }
                else {
                    newVisibleColumns.push(language);
                }
            }
        });
        // Guardar configuración de forma asíncrona
        Promise.all([
            eije_configuration_1.EIJEConfiguration.saveVisibleColumns(newVisibleColumns),
            eije_configuration_1.EIJEConfiguration.saveHiddenColumns(newHiddenColumns)
        ]).then(() => {
            // Limpiar caché específico para forzar recarga
            eije_configuration_1.EIJEConfiguration.clearConfigCache('visibleColumns');
            eije_configuration_1.EIJEConfiguration.clearConfigCache('hiddenColumns');
            // Forzar actualización completa de la configuración
            eije_configuration_1.EIJEConfiguration.saveFullConfiguration();
            // Esperar un momento antes de actualizar la tabla para asegurar que la configuración se guarde
            setTimeout(() => {
                this.refreshDataTable();
            }, 100);
        });
    }
    async reloadData() {
        // Guardar la configuración completa
        eije_configuration_1.EIJEConfiguration.saveFullConfiguration();
        this._data = new eije_data_1.EIJEData(this);
        await this._data.initialize();
        this.refreshDataTable();
        const i18n = i18n_service_1.I18nService.getInstance();
        notification_service_1.NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.reloaded'));
    }
    async _showNewLanguageInput() {
        const i18n = i18n_service_1.I18nService.getInstance();
        // Show VS Code input box to get language code
        const langCode = await vscode.window.showInputBox({
            prompt: i18n.t('ui.prompts.enterLanguageCode'),
            placeHolder: i18n.t('ui.prompts.languageCodePlaceholder'),
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return i18n.t('ui.messages.languageCodeEmpty');
                }
                if (value.length > 5) {
                    return i18n.t('ui.messages.languageCodeTooLong');
                }
                return null; // Input is valid
            }
        });
        // If user provided a language code, create the language file
        if (langCode) {
            this.createNewLanguage(langCode).catch(error => console.error('Error creating new language:', error));
        }
    }
    async createNewLanguage(langCode) {
        const i18n = i18n_service_1.I18nService.getInstance();
        if (!langCode || langCode.length > 5) {
            notification_service_1.NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.languageCodeInvalid'));
            return;
        }
        try {
            let targetPath;
            if (this.folderPath) {
                // Use the current folder if opened from a specific folder
                targetPath = this.folderPath;
            }
            else if (eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS && eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS.length > 0) {
                // Use the first workspace folder if opened from workspace
                targetPath = eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS[0].path;
            }
            else {
                notification_service_1.NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.noTargetFolder'));
                return;
            }
            const filePath = _path.join(targetPath, `${langCode}.json`);
            // Check if file already exists
            if (await eije_filesystem_1.EIJEFileSystem.exists(filePath)) {
                notification_service_1.NotificationService.getInstance().showWarningMessage(i18n.t('ui.messages.languageFileExists', `${langCode}.json`));
                return;
            }
            // Check if English template file exists
            const englishFilePath = _path.join(targetPath, 'en.json');
            let jsonContent = {};
            if (await eije_filesystem_1.EIJEFileSystem.exists(englishFilePath)) {
                try {
                    // Use English file as template
                    const englishContent = await eije_filesystem_1.EIJEFileSystem.readFile(englishFilePath);
                    jsonContent = JSON.parse(englishContent);
                    notification_service_1.NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.createdWithTemplate', `${langCode}.json`));
                }
                catch (err) {
                    // If there's an error reading/parsing the English file, use empty object
                    notification_service_1.NotificationService.getInstance().showWarningMessage(i18n.t('ui.messages.templateReadError'));
                }
            }
            else {
                notification_service_1.NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.templateNotFound'));
            }
            // Create new language file
            const fileContent = JSON.stringify(jsonContent, null, eije_configuration_1.EIJEConfiguration.JSON_SPACE);
            await eije_filesystem_1.EIJEFileSystem.writeFile(filePath, fileContent);
            notification_service_1.NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.languageFileCreated', `${langCode}.json`));
            // Agregar el nuevo idioma como visible por defecto
            await this.addLanguageAsVisible(langCode);
            // Guardar la configuración completa
            eije_configuration_1.EIJEConfiguration.saveFullConfiguration();
            // Reload the editor to show the new language
            await this.reloadData();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            notification_service_1.NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.fileCreationError', errorMessage));
        }
    }
    /**
     * Agregar un idioma como visible por defecto
     */
    async addLanguageAsVisible(langCode) {
        try {
            // Limpiar caché antes de leer la configuración actual
            eije_configuration_1.EIJEConfiguration.clearConfigCache();
            // Obtener las columnas actuales
            let visibleColumns = [...eije_configuration_1.EIJEConfiguration.VISIBLE_COLUMNS];
            let hiddenColumns = [...eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS];
            // Remover el idioma de ocultos si estaba ahí
            hiddenColumns = hiddenColumns.filter(col => col !== langCode);
            // Agregar a visibles si no está ya
            if (!visibleColumns.includes(langCode)) {
                visibleColumns.push(langCode);
            }
            // Guardar la configuración actualizada
            await eije_configuration_1.EIJEConfiguration.saveVisibleColumns(visibleColumns);
            await eije_configuration_1.EIJEConfiguration.saveHiddenColumns(hiddenColumns);
        }
        catch (error) {
            console.error('Error adding language as visible:', error);
        }
    }
    /**
     * Limpiar idiomas eliminados de las listas de visibles/ocultos
     */
    async cleanupDeletedLanguages() {
        try {
            // Obtener idiomas disponibles actualmente
            const availableLanguages = this._data.getLanguages();
            // Limpiar caché antes de leer la configuración actual
            eije_configuration_1.EIJEConfiguration.clearConfigCache();
            // Obtener las columnas actuales
            let visibleColumns = [...eije_configuration_1.EIJEConfiguration.VISIBLE_COLUMNS];
            let hiddenColumns = [...eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS];
            // Filtrar columnas visibles para mantener solo idiomas que existen
            const originalVisibleCount = visibleColumns.length;
            visibleColumns = visibleColumns.filter(col => col === 'key' || availableLanguages.includes(col));
            // Filtrar columnas ocultas para mantener solo idiomas que existen
            const originalHiddenCount = hiddenColumns.length;
            hiddenColumns = hiddenColumns.filter(col => availableLanguages.includes(col));
            // Solo guardar si hubo cambios
            if (visibleColumns.length !== originalVisibleCount ||
                hiddenColumns.length !== originalHiddenCount) {
                await eije_configuration_1.EIJEConfiguration.saveVisibleColumns(visibleColumns);
                await eije_configuration_1.EIJEConfiguration.saveHiddenColumns(hiddenColumns);
                console.log('Cleaned up deleted languages from visibility configuration');
            }
        }
        catch (error) {
            console.error('Error cleaning up deleted languages:', error);
        }
    }
    checkEmptyTranslations(currentPage) {
        // Check for empty translations on the current page
        const emptyTranslations = this._data.findEmptyTranslations(currentPage);
        // Count all empty translations in the entire dataset
        const emptyTranslationsCount = this._data.countEmptyTranslations();
        // Solo considerar las traducciones vacías como error si no están permitidas
        const allowEmptyTranslations = eije_configuration_1.EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS;
        const hasError = !allowEmptyTranslations && emptyTranslationsCount.hasEmpty;
        this._panel.webview.postMessage({
            command: 'emptyTranslationsFound',
            emptyTranslations: emptyTranslations,
            hasEmptyTranslations: hasError,
            allowEmptyTranslations: eije_configuration_1.EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS,
            hasAnyEmptyTranslations: emptyTranslationsCount.hasEmpty,
            totalEmptyCount: emptyTranslationsCount.count
        });
    }
    navigateToNextEmptyTranslation() {
        // Find and navigate to the next empty translation
        const nextEmptyTranslation = this._data.findNextEmptyTranslation();
        if (nextEmptyTranslation) {
            // If an empty translation is found, navigate to its page and select it
            this._data.navigate(nextEmptyTranslation.page, true); // Skip refresh
            this._data.select(nextEmptyTranslation.id, true); // Skip refresh
            // Luego actualizamos la interfaz una sola vez
            this.refreshDataTable();
            // También debemos enviar un mensaje para actualizar la información de traducciones vacías
            this.checkEmptyTranslations(nextEmptyTranslation.page);
        }
        else {
            // If no empty translation is found, show a message
            const i18n = i18n_service_1.I18nService.getInstance();
            notification_service_1.NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.noEmptyTranslations'));
        }
    }
    _initTemplate() {
        if (this.isWorkspace) {
            this._panel.webview.postMessage({ command: 'folders', folders: eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS });
        }
        // Enviar configuración inicial al frontend, especialmente importante en entorno web
        this._panel.webview.postMessage({
            command: 'configurationUpdate',
            allowEmptyTranslations: eije_configuration_1.EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS,
            defaultLanguage: eije_configuration_1.EIJEConfiguration.DEFAULT_LANGUAGE,
            forceKeyUPPERCASE: eije_configuration_1.EIJEConfiguration.FORCE_KEY_UPPERCASE
        });
    }
    refreshDataTable() {
        this._panel.webview.postMessage({ command: 'content', render: this._data.render() });
    }
    /**
     * Update the translation and refresh the empty translations count
     * @param translation The translation to update
     */
    updateTranslation(translation) {
        this._panel.webview.postMessage({ command: 'update', translation: translation });
        // Actualizar el contador de traducciones faltantes después de cada modificación
        const currentPage = this._data.getCurrentPage();
        this.checkEmptyTranslations(currentPage);
    }
    /**
     * Envía un mensaje al frontend con el resultado del guardado
     * @param success Indica si el guardado fue exitoso
     */
    sendSaveResult(success) {
        // Contar traducciones vacías para actualizar el estado de la UI
        const emptyTranslationsCount = this._data.countEmptyTranslations();
        const hasEmptyTranslations = emptyTranslationsCount.hasEmpty;
        this._panel.webview.postMessage({
            command: 'saveResult',
            success: success,
            allowEmptyTranslations: eije_configuration_1.EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS,
            hasEmptyTranslations: hasEmptyTranslations
        });
        // Actualizar el estado de la UI después de guardar
        const currentPage = this._data.getCurrentPage();
        this.checkEmptyTranslations(currentPage);
    }
    async getTemplateAsync() {
        const template = vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'template.html'));
        const linksPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'bootstrap.min.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'template.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'tippy.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'font-awesome.min.css'))
        ];
        const scriptsPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'jquery.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'bootstrap.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'popper.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'tippy.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'flashy.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'template.js'))
        ];
        // Get i18n translations
        const i18n = i18n_service_1.I18nService.getInstance();
        // Helper function to replace i18n template tags
        const replaceI18nTags = (html) => {
            return html.replace(/\{\{i18n\.([^}]+)\}\}/g, (match, key) => {
                return i18n.t(key) || match;
            });
        };
        try {
            const templateContent = await eije_filesystem_1.EIJEFileSystem.readFile(template.fsPath);
            const linksHtml = linksPath
                .map(l => {
                const uri = this._panel.webview.asWebviewUri ? this._panel.webview.asWebviewUri(l) : l.with({ scheme: 'vscode-resource' });
                return `<link rel="stylesheet" href="${uri}">`;
            })
                .join('\n');
            const scriptsHtml = scriptsPath
                .map(l => {
                const uri = this._panel.webview.asWebviewUri ? this._panel.webview.asWebviewUri(l) : l.with({ scheme: 'vscode-resource' });
                return `<script src="${uri}"></script>`;
            })
                .join('\n');
            const finalHtml = replaceI18nTags(templateContent
                .replace('{{LINKS}}', linksHtml)
                .replace('{{SCRIPTS}}', scriptsHtml));
            return finalHtml;
        }
        catch (error) {
            console.error('Error generating template:', error);
            return '<html><body><h1>Error loading template</h1><p>' + error + '</p></body></html>';
        }
    }
    getTemplate() {
        const template = vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'template.html'));
        const linksPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'bootstrap.min.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'template.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'tippy.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'font-awesome.min.css'))
        ];
        const scriptsPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'jquery.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'bootstrap.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'popper.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'tippy.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'flashy.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'template.js'))
        ];
        // Get i18n translations
        const i18n = i18n_service_1.I18nService.getInstance();
        // Helper function to replace i18n template tags
        const replaceI18nTags = (html) => {
            return html.replace(/\{\{i18n\.([^}]+)\}\}/g, (match, key) => {
                return i18n.t(key) || match;
            });
        };
        try {
            const templateContent = eije_filesystem_1.EIJEFileSystem.readFileSync(template.fsPath).toString();
            const linksHtml = linksPath
                .map(l => {
                const uri = this._panel.webview.asWebviewUri ? this._panel.webview.asWebviewUri(l) : l.with({ scheme: 'vscode-resource' });
                return `<link rel="stylesheet" href="${uri}">`;
            })
                .join('\n');
            const scriptsHtml = scriptsPath
                .map(l => {
                const uri = this._panel.webview.asWebviewUri ? this._panel.webview.asWebviewUri(l) : l.with({ scheme: 'vscode-resource' });
                return `<script src="${uri}"></script>`;
            })
                .join('\n');
            const finalHtml = replaceI18nTags(templateContent
                .replace('{{LINKS}}', linksHtml)
                .replace('{{SCRIPTS}}', scriptsHtml));
            return finalHtml;
        }
        catch (error) {
            console.error('Error generating template:', error);
            return '<html><body><h1>Error loading template</h1><p>' + error + '</p></body></html>';
        }
    }
    // Método para cambiar la carpeta de trabajo
    async switchWorkspaceFolder(folderName) {
        try {
            // Guardar la carpeta seleccionada como predeterminada
            await eije_configuration_1.EIJEConfiguration.saveDefaultWorkspaceFolder(folderName);
            // Buscar la carpeta en la configuración
            const workspaceFolders = eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS;
            const selectedFolder = workspaceFolders.find(f => f.name === folderName);
            if (selectedFolder) {
                // Crear nueva instancia de EIJEData para la nueva carpeta
                this._data = new eije_data_1.EIJEData(this);
                // Cambiar la ruta de la carpeta
                this.folderPath = selectedFolder.path;
                // Reinicializar los datos
                await this._data.initialize();
                // Limpiar idiomas eliminados de las listas de visibles/ocultos
                await this.cleanupDeletedLanguages();
                // Actualizar la interfaz
                this.refreshDataTable();
                // Enviar confirmación al frontend
                this._panel.webview.postMessage({
                    command: 'workspaceFolderChanged',
                    folderName: folderName
                });
                // Inicializar el selector de carpetas con la nueva carpeta activa
                this.initializeWorkspaceFolderSelector(folderName);
            }
            else {
                console.error('Workspace folder not found:', folderName);
            }
        }
        catch (error) {
            console.error('Error switching workspace folder:', error);
        }
    }
    // Método para descartar cambios y cambiar de carpeta
    async discardChangesAndSwitchWorkspaceFolder(folderName) {
        try {
            // Simplemente recargar los datos originales y cambiar de carpeta
            await this.switchWorkspaceFolder(folderName);
        }
        catch (error) {
            console.error('Error discarding changes and switching workspace folder:', error);
        }
    }
    // Método para establecer la carpeta de trabajo inicial
    async setInitialWorkspaceFolder() {
        const workspaceFolders = eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS;
        if (workspaceFolders.length === 0) {
            return;
        }
        // Si no hay folderPath específico, determinar cuál usar
        if (!this.folderPath) {
            const defaultFolder = eije_configuration_1.EIJEConfiguration.DEFAULT_WORKSPACE_FOLDER;
            let selectedFolder;
            if (defaultFolder && workspaceFolders.some(f => f.name === defaultFolder)) {
                selectedFolder = workspaceFolders.find(f => f.name === defaultFolder);
            }
            else {
                // Si no hay carpeta por defecto, usar la primera
                selectedFolder = workspaceFolders[0];
            }
            if (selectedFolder) {
                this.folderPath = selectedFolder.path;
            }
        }
    }
    // Método para inicializar el selector de carpetas de trabajo
    initializeWorkspaceFolderSelector(currentFolder) {
        const workspaceFolders = eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS;
        console.log('Initializing workspace folder selector:', { workspaceFolders, currentFolder, folderPath: this.folderPath });
        if (workspaceFolders.length === 0) {
            console.log('No workspace folders found');
            return;
        }
        // Determinar la carpeta actual
        let activeFolder = currentFolder;
        if (!activeFolder) {
            // Buscar la carpeta que corresponde al folderPath actual
            const currentFolderObj = workspaceFolders.find(f => f.path === this.folderPath);
            if (currentFolderObj) {
                activeFolder = currentFolderObj.name;
            }
            else {
                const defaultFolder = eije_configuration_1.EIJEConfiguration.DEFAULT_WORKSPACE_FOLDER;
                if (defaultFolder && workspaceFolders.some(f => f.name === defaultFolder)) {
                    activeFolder = defaultFolder;
                }
                else {
                    // Si no hay carpeta por defecto, usar la primera
                    activeFolder = workspaceFolders[0].name;
                }
            }
        }
        console.log('Sending initWorkspaceFolders message:', { folders: workspaceFolders, currentFolder: activeFolder });
        // Enviar datos al frontend con un pequeño delay para asegurar que el webview esté listo
        setTimeout(() => {
            this._panel.webview.postMessage({
                command: 'initWorkspaceFolders',
                folders: workspaceFolders,
                currentFolder: activeFolder
            });
        }, 100);
    }
}
exports.EIJEManager = EIJEManager;


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EIJEData = void 0;
const _path = __webpack_require__(3);
const eije_filesystem_1 = __webpack_require__(5);
const eije_configuration_1 = __webpack_require__(6);
const eije_data_render_service_1 = __webpack_require__(9);
const eije_data_translation_1 = __webpack_require__(12);
const eije_translation_service_1 = __webpack_require__(13);
const eije_view_1 = __webpack_require__(16);
const i18n_service_1 = __webpack_require__(10);
const notification_service_1 = __webpack_require__(17);
class EIJEData {
    constructor(_manager) {
        this._manager = _manager;
        this._currentID = 1;
        this._languages = [];
        this._translations = [];
        this._searchPattern = '';
        this._defaultValues();
        // La carga de archivos ahora debe ser llamada explícitamente de forma asíncrona
    }
    // Métodos para obtener datos necesarios para las funciones de traducciones vacías
    getAllTranslations() {
        return this._translations;
    }
    getLanguages() {
        return this._languages;
    }
    getPageSize() {
        return this._page.pageSize;
    }
    getCurrentPage() {
        return this._page.pageNumber;
    }
    async initialize() {
        await this._loadFiles();
    }
    _defaultValues() {
        this._view = {
            type: eije_view_1.EIJEViewType.TABLE,
            selectionId: 1
        };
        this._sort = {
            column: i18n_service_1.I18nService.getInstance().t('ui.labels.keyColumn'),
            ascending: true
        };
        this._page = {
            pageSize: 10,
            pageNumber: 1
        };
    }
    /**
     * Actions from the view
     */
    add() {
        const translation = this._createFactoryIJEDataTranslation();
        // Marcar explícitamente como inválido y mostrar el mensaje de error
        translation.valid = false;
        translation.error = (0, eije_data_translation_1.getTranslatedError)(eije_data_translation_1.EIJEDataTranslationError.KEY_NOT_EMPTY);
        this._insert(translation);
        this._view.selectionId = translation.id;
        this._manager.refreshDataTable();
    }
    mark(id) {
        const translation = this._get(id);
        if (translation) {
            this._view.selectionId = id;
        }
    }
    navigate(page, skipRefresh = false) {
        this._page.pageNumber = page;
        if (!skipRefresh) {
            this._manager.refreshDataTable();
        }
    }
    pageSize(pageSize) {
        if (pageSize > 0 && pageSize % 10 === 0) {
            this._page.pageSize = pageSize;
            this._manager.refreshDataTable();
        }
    }
    _hasTranslationService() {
        return !!eije_configuration_1.EIJEConfiguration.TRANSLATION_SERVICE &&
            !!eije_configuration_1.EIJEConfiguration.TRANSLATION_SERVICE_API_KEY &&
            eije_configuration_1.EIJEConfiguration.TRANSLATION_SERVICE !== 'Coming soon' &&
            eije_configuration_1.EIJEConfiguration.TRANSLATION_SERVICE_API_KEY !== 'Coming soon';
    }
    render() {
        let render = '';
        let translations = this._getDisplayedTranslations();
        const hasTranslateService = this._hasTranslationService();
        switch (this._view.type) {
            case eije_view_1.EIJEViewType.LIST:
                render += eije_data_render_service_1.EIJEDataRenderService.renderList(translations, this._get(this._view.selectionId), this._languages, this._page, this._sort, false, // No mostrar columna de carpeta ya que trabajamos con carpeta específica
                hasTranslateService);
                break;
            case eije_view_1.EIJEViewType.TABLE:
                render += eije_data_render_service_1.EIJEDataRenderService.renderTable(translations, this._languages, this._page, this._sort, false, // No mostrar columna de carpeta ya que trabajamos con carpeta específica
                hasTranslateService);
                break;
        }
        return render;
    }
    remove(id) {
        const index = this._getIndex(id);
        if (index > -1) {
            this._validateImpacted(this._get(id));
            this._translations.splice(index, 1);
            this._manager.refreshDataTable();
        }
    }
    /**
     * Revalida todas las traducciones con la configuración actual
     * Este método es público para poder ser llamado cuando cambia la configuración
     */
    _revalidateAllTranslations() {
        this._translations.forEach(translation => {
            this._validate(translation, false);
        });
    }
    async save() {
        // Revalidar todas las traducciones para asegurar que cumplen con la configuración actual
        this._revalidateAllTranslations();
        // Verificar si hay traducciones con claves vacías o inválidas
        const invalidTranslations = this._translations.filter(t => !t.valid);
        if (invalidTranslations.length > 0) {
            // Si hay traducciones inválidas, mostrar un mensaje de error y no guardar
            const i18n = i18n_service_1.I18nService.getInstance();
            notification_service_1.NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.cannotSaveInvalidTranslations'));
            // Seleccionar y mostrar la primera traducción inválida para facilitar la corrección
            const firstInvalidTranslation = invalidTranslations[0];
            this.select(firstInvalidTranslation.id);
            this._manager.refreshDataTable();
            // Informar al frontend que el guardado falló
            this._manager.sendSaveResult(false);
            return;
        }
        try {
            // Obtener idiomas ocultos para excluirlos del guardado
            const hiddenLanguages = eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS;
            // Limpiar JSONs existentes (solo de idiomas visibles)
            let existingFolders = [];
            if (this._manager.folderPath) {
                existingFolders.push(this._manager.folderPath);
            }
            else {
                existingFolders = eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS.map(d => d.path);
            }
            for (const d of existingFolders) {
                for (const language of this._languages) {
                    // Saltar idiomas ocultos - no deben limpiarse ni guardarse
                    if (hiddenLanguages.includes(language)) {
                        continue;
                    }
                    const json = JSON.stringify({}, null, eije_configuration_1.EIJEConfiguration.JSON_SPACE);
                    const f = _path.join(d, language + '.json');
                    await eije_filesystem_1.EIJEFileSystem.writeFile(f, json);
                }
            }
            // Agrupar traducciones por carpeta
            let folders = this._translations.reduce((r, a) => {
                r[a.folder] = r[a.folder] || [];
                r[a.folder].push(a);
                return r;
            }, {});
            // Guardar traducciones válidas
            for (const [key, value] of Object.entries(folders)) {
                for (const language of this._languages) {
                    // Saltar idiomas ocultos - no deben guardarse
                    if (hiddenLanguages.includes(language)) {
                        continue;
                    }
                    let o = {};
                    value
                        .filter(translation => translation.valid)
                        .sort((a, b) => (a.key > b.key ? 1 : -1))
                        .forEach(translation => {
                        // Si se permiten traducciones vacías, incluir todas las traducciones
                        // Si no se permiten, solo incluir las que tienen contenido
                        const hasContent = translation.languages[language] && translation.languages[language].trim() !== '';
                        const shouldInclude = hasContent || eije_configuration_1.EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS;
                        if (shouldInclude) {
                            const value = translation.languages[language] || '';
                            this._transformKeysValues(translation.key, value, o);
                        }
                    });
                    var json = JSON.stringify(o, null, eije_configuration_1.EIJEConfiguration.JSON_SPACE);
                    json = json.replace(/\n/g, eije_configuration_1.EIJEConfiguration.LINE_ENDING);
                    const f = _path.join(key, language + '.json');
                    await eije_filesystem_1.EIJEFileSystem.writeFile(f, json);
                }
            }
            // Mostrar mensaje de éxito en VS Code
            notification_service_1.NotificationService.getInstance().showInformationMessage(i18n_service_1.I18nService.getInstance().t('ui.messages.saved'), true);
            // Informar al frontend que el guardado fue exitoso
            this._manager.sendSaveResult(true);
        }
        catch (error) {
            // En caso de cualquier error durante el guardado
            notification_service_1.NotificationService.getInstance().showErrorMessage(i18n_service_1.I18nService.getInstance().t('ui.messages.saveError') + ': ' + String(error));
            // Informar al frontend que el guardado falló
            this._manager.sendSaveResult(false);
        }
    }
    search(value) {
        this._searchPattern = value;
        this._manager.refreshDataTable();
    }
    select(id, skipRefresh = false) {
        const translation = this._get(id);
        if (translation) {
            this._view.selectionId = translation.id;
            if (!skipRefresh) {
                this._manager.refreshDataTable();
            }
        }
    }
    sort(column, ascending, firstPage = false) {
        this._sort.ascending = this._sort.column !== column ? true : ascending;
        this._sort.column = column;
        if (firstPage) {
            this.navigate(1);
        }
        else {
            this._manager.refreshDataTable();
        }
    }
    switchView(view) {
        this._view.type = view;
        this._manager.refreshDataTable();
    }
    async translate(id, language = '') {
        const translation = this._get(id);
        if (translation && language) {
            await eije_translation_service_1.EIJETranslationService.translate(translation, language, this._languages);
            this._manager.refreshDataTable();
        }
    }
    update(id, value, language = '') {
        const translation = this._get(id);
        if (translation) {
            this._view.selectionId = id;
            if (language) {
                translation.languages[language] = value.replace(/\\n/g, '\n');
                this._validate(translation);
            }
            else {
                const newKey = eije_configuration_1.EIJEConfiguration.FORCE_KEY_UPPERCASE ? value.toUpperCase() : value;
                const oldKey = translation.key;
                translation.key = newKey;
                if (oldKey !== newKey) {
                    this._validateImpacted(translation, oldKey);
                }
                this._validate(translation, true);
                this._manager.updateTranslation(translation);
            }
        }
        return translation;
    }
    /**
     * Counts all empty translations in the entire dataset
     * @returns Object with count of empty translations and whether any exist
     */
    countEmptyTranslations() {
        // Get hidden languages to ignore
        const hiddenLanguages = eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS;
        // Get all translations (no folder filtering needed since we work with specific folders now)
        let filteredTranslations = this._translations;
        // Apply search filter if there is one
        if (this._searchPattern) {
            const regex = new RegExp(`${this._searchPattern}`, 'gmi');
            filteredTranslations = filteredTranslations.filter(t => {
                let match = t.key === '' || regex.test(t.key);
                if (!match) {
                    // Check translations in each language
                    for (const language of this._languages) {
                        if (regex.test(t.languages[language])) {
                            match = true;
                            break;
                        }
                    }
                }
                return match;
            });
        }
        // Count all empty translations
        let totalCount = 0;
        for (const translation of filteredTranslations) {
            for (const language of this._languages) {
                // Skip the key column and hidden languages
                if (language !== 'key' && !hiddenLanguages.includes(language)) {
                    // If translation is empty for this language
                    if (!translation.languages[language]) {
                        totalCount++;
                    }
                }
            }
        }
        return {
            count: totalCount,
            hasEmpty: totalCount > 0
        };
    }
    /**
     * Checks if there are any empty translations in the entire dataset
     * @returns True if there's at least one empty translation in any visible language
     */
    hasEmptyTranslations() {
        return this.countEmptyTranslations().hasEmpty;
    }
    /**
     * Find empty translations on the current page
     * @param currentPage The current page number
     * @returns Array of translation IDs with empty values
     */
    findEmptyTranslations(currentPage) {
        // Si se permiten traducciones vacías, devolver array vacío
        if (eije_configuration_1.EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS) {
            return [];
        }
        const emptyTranslations = [];
        // Get hidden languages to ignore
        const hiddenLanguages = eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS;
        // Get all filtered and sorted translations
        let filteredTranslations = this._getDisplayedTranslations();
        // Calculate pagination indexes
        const startIndex = (currentPage - 1) * this._page.pageSize;
        const endIndex = Math.min(startIndex + this._page.pageSize, filteredTranslations.length);
        // Get only translations for the current page
        const pageTranslations = filteredTranslations.slice(startIndex, endIndex);
        // Find empty translations on this page
        pageTranslations.forEach(translation => {
            this._languages.forEach(language => {
                // Skip the key column and hidden languages
                if (language !== 'key' && !hiddenLanguages.includes(language)) {
                    // Check if the translation for this language is empty
                    if (!translation.languages[language]) {
                        emptyTranslations.push({
                            id: translation.id,
                            language: language
                        });
                    }
                }
            });
        });
        return emptyTranslations;
    }
    /**
     * Find the next empty translation in the entire dataset
     * @returns Object with page number and translation ID of the next empty translation
     */
    findNextEmptyTranslation() {
        // Start from the current page and then check all other pages
        const currentPage = this._page.pageNumber;
        const pageSize = this._page.pageSize;
        // Get hidden languages to ignore
        const hiddenLanguages = eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS;
        // Get filtered translations (using the same filtering logic as _getDisplayedTranslations)
        let filteredTranslations = this._translations;
        // Apply search filter if there is one
        if (this._searchPattern) {
            const regex = new RegExp(`${this._searchPattern}`, 'gmi');
            filteredTranslations = filteredTranslations.filter(t => {
                let match = t.key === '' || regex.test(t.key);
                if (!match) {
                    // Check translations in each language
                    for (const language of this._languages) {
                        if (regex.test(t.languages[language])) {
                            match = true;
                            break;
                        }
                    }
                }
                return match;
            });
        }
        const totalPages = Math.ceil(filteredTranslations.length / pageSize);
        // Check all pages starting from the current one
        for (let p = currentPage; p <= totalPages; p++) {
            const startIndex = (p - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, filteredTranslations.length);
            const pageTranslations = filteredTranslations.slice(startIndex, endIndex);
            for (const translation of pageTranslations) {
                for (const language of this._languages) {
                    // Skip the key column and hidden languages
                    if (language !== 'key' && !hiddenLanguages.includes(language)) {
                        // If translation is empty for this language
                        if (!translation.languages[language]) {
                            return {
                                page: p,
                                id: translation.id,
                                language: language
                            };
                        }
                    }
                }
            }
        }
        // If we've reached the last page and found nothing, start from the beginning
        if (currentPage > 1) {
            for (let p = 1; p < currentPage; p++) {
                const startIndex = (p - 1) * pageSize;
                const endIndex = Math.min(startIndex + pageSize, filteredTranslations.length);
                const pageTranslations = filteredTranslations.slice(startIndex, endIndex);
                for (const translation of pageTranslations) {
                    for (const language of this._languages) {
                        // Skip the key column and hidden languages
                        if (language !== 'key' && !hiddenLanguages.includes(language)) {
                            // If translation is empty for this language
                            if (!translation.languages[language]) {
                                return {
                                    page: p,
                                    id: translation.id,
                                    language: language
                                };
                            }
                        }
                    }
                }
            }
        }
        // No empty translations found
        return null;
    }
    /**
     * Create the hierachy based on the key
     */
    _transformKeysValues(key, value, o = {}) {
        let separator = eije_configuration_1.EIJEConfiguration.KEY_SEPARATOR ? key.indexOf(eije_configuration_1.EIJEConfiguration.KEY_SEPARATOR) : -1;
        if (separator > 0) {
            const _key = key.substring(0, separator);
            if (!o[_key]) {
                o[_key] = {};
            }
            this._transformKeysValues(key.substring(separator + 1), value, o[_key]);
        }
        else if (!o[key] && typeof o !== 'string') {
            o[key] = value;
        }
    }
    /**
     *  Load methods
     */
    async _loadFiles() {
        // Almacenar los idiomas antes de cargar los nuevos archivos
        const previousLanguages = [...this._languages];
        // Cargar archivos de idioma
        if (!this._manager.isWorkspace) {
            await this._loadFolder(this._manager.folderPath);
        }
        else {
            const directories = eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS;
            for (const d of directories) {
                await this._loadFolder(d.path);
            }
        }
        // Detectar idiomas nuevos (no existían antes de cargar los archivos)
        const newlyAddedLanguages = this._languages.filter(lang => !previousLanguages.includes(lang));
        // Obtener configuración actual
        const currentVisibleColumns = eije_configuration_1.EIJEConfiguration.VISIBLE_COLUMNS;
        const currentHiddenColumns = eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS;
        if (this._languages.length > 0) {
            // Verificar si es la primera vez que se ejecuta (no hay configuración previa)
            const isFirstRun = currentVisibleColumns.length === 0 && currentHiddenColumns.length === 0;
            if (isFirstRun) {
                // Primera ejecución: mostrar todos los idiomas excepto 'en'
                const columnsToShow = this._languages.filter(lang => lang !== 'en');
                eije_configuration_1.EIJEConfiguration.saveVisibleColumns(columnsToShow);
            }
            else {
                // Ejecuciones posteriores: solo agregar idiomas completamente nuevos
                const completelyNewLanguages = this._languages.filter(lang => lang !== 'en' &&
                    !currentVisibleColumns.includes(lang) &&
                    !currentHiddenColumns.includes(lang));
                if (completelyNewLanguages.length > 0) {
                    const updatedColumns = [...currentVisibleColumns, ...completelyNewLanguages];
                    eije_configuration_1.EIJEConfiguration.saveVisibleColumns(updatedColumns);
                }
            }
        }
    }
    async _loadFolder(folderPath) {
        const files = await eije_filesystem_1.EIJEFileSystem.readdir(folderPath);
        const translate = {};
        const keys = [];
        for (const file of files.filter(f => f.endsWith('.json'))) {
            var language = file.split('.')[0];
            if (this._languages.indexOf(language) === -1) {
                this._languages.push(language);
            }
            try {
                let rawdata = await eije_filesystem_1.EIJEFileSystem.readFile(_path.join(folderPath, file));
                let jsonData = this._stripBOM(rawdata.toString());
                let content = JSON.parse(jsonData);
                let keysValues = this._getKeysValues(content);
                for (let key in keysValues) {
                    if (keys.indexOf(key) === -1) {
                        keys.push(key);
                    }
                }
                translate[language] = keysValues;
            }
            catch (e) {
                translate[language] = {};
            }
        }
        keys.forEach((key) => {
            const languages = {};
            this._languages.forEach((language) => {
                const value = translate[language][key];
                languages[language] = value ? value : '';
            });
            const t = this._createFactoryIJEDataTranslation();
            t.folder = folderPath;
            t.key = key;
            t.languages = languages;
            this._insert(t);
        });
    }
    /**
     * For each values get the unique key with hierachy separate by a separator
     */
    _getKeysValues(obj, _key = '') {
        let kv = {};
        for (let key in obj) {
            if (typeof obj[key] !== 'string') {
                kv = { ...kv, ...this._getKeysValues(obj[key], _key + key + (eije_configuration_1.EIJEConfiguration.KEY_SEPARATOR || '')) };
            }
            else {
                kv[_key + key] = obj[key];
            }
        }
        return kv;
    }
    /**
     * Get all translation displayed on the view based on the active filters and paging options
     */
    _getDisplayedTranslations() {
        var o = this._translations;
        o = o
            .filter(t => {
            let match = false;
            var regex = new RegExp(`${this._searchPattern}`, 'gmi');
            match = t.key === '' || regex.test(t.key);
            if (!match) {
                this._languages.forEach(language => {
                    var content = t.languages[language] ? t.languages[language] : '';
                    if (!match) {
                        match = regex.test(content);
                    }
                });
            }
            return match;
        })
            .sort((a, b) => {
            let _a, _b;
            if (this._view.type === eije_view_1.EIJEViewType.LIST || this._sort.column === i18n_service_1.I18nService.getInstance().t('ui.labels.keyColumn')) {
                _a = a.key.toLowerCase();
                _b = b.key.toLowerCase();
            }
            else if (this._sort.column === i18n_service_1.I18nService.getInstance().t('ui.labels.folder')) {
                _a = a.folder + a.key.toLowerCase();
                _b = b.folder + b.key.toLowerCase();
            }
            else {
                _a = a.languages[this._sort.column] ? a.languages[this._sort.column].toLowerCase() : '';
                _b = b.languages[this._sort.column] ? b.languages[this._sort.column].toLowerCase() : '';
            }
            return ((this._view.type === eije_view_1.EIJEViewType.LIST ? true : this._sort.ascending) ? _a > _b : _a < _b) ? 1 : -1;
        });
        this._page.count = o.length;
        this._page.pageSize = this._view.type === eije_view_1.EIJEViewType.LIST ? 15 : this._page.pageSize;
        this._page.totalPages = Math.ceil(this._page.count / this._page.pageSize);
        if (this._page.pageNumber < 1) {
            this._page.pageNumber = 1;
        }
        if (this._page.pageNumber > this._page.totalPages) {
            this._page.pageNumber = this._page.totalPages;
        }
        return o.slice((this._page.pageNumber - 1) * this._page.pageSize, this._page.pageNumber * this._page.pageSize);
    }
    /**
     * Validations
     */
    _validateImpacted(translation, key = undefined) {
        if (key === '') {
            return;
        }
        const impacted = this._validatePath(translation, false, key);
        impacted.forEach(i => {
            if (key === undefined || (!this._comparePath(this._split(translation.key), this._split(i.key)) && this._validatePath(i, true).length === 0)) {
                i.valid = true;
                i.error = '';
                this._manager.updateTranslation(i);
            }
        });
    }
    _validate(translation, keyChanged = false) {
        var t = this._validatePath(translation);
        if (translation.key === '') {
            translation.valid = false;
            translation.error = (0, eije_data_translation_1.getTranslatedError)(eije_data_translation_1.EIJEDataTranslationError.KEY_NOT_EMPTY);
        }
        else if (keyChanged) {
            let separator = eije_configuration_1.EIJEConfiguration.KEY_SEPARATOR ? this.escapeRegExp(eije_configuration_1.EIJEConfiguration.KEY_SEPARATOR) : false;
            //does not start or end with the separator or two consecutive separators
            if (separator && new RegExp(`^${separator}|${separator}{2,}|${separator}$`).test(translation.key)) {
                translation.valid = false;
                translation.error = (0, eije_data_translation_1.getTranslatedError)(eije_data_translation_1.EIJEDataTranslationError.INVALID_KEY);
            }
            else if (this._validatePath(translation).length > 0) {
                translation.valid = false;
                // Encontrar la clave conflictiva para mostrar un mensaje más descriptivo
                const conflictingTranslations = this._validatePath(translation);
                const conflictingKey = conflictingTranslations[0]?.key || '';
                const currentKey = translation.key;
                // Determinar cuál es la clave base y cuál es la que se está intentando crear
                const splitCurrent = this._split(currentKey);
                const splitConflicting = this._split(conflictingKey);
                let baseKey = '';
                let attemptedKey = '';
                if (splitCurrent.length > splitConflicting.length) {
                    // Se está intentando crear una sub-clave de una clave existente
                    baseKey = conflictingKey;
                    attemptedKey = currentKey;
                }
                else {
                    // Se está intentando crear una clave que entraría en conflicto con sub-claves existentes
                    baseKey = currentKey;
                    attemptedKey = conflictingKey;
                }
                translation.error = (0, eije_data_translation_1.getTranslatedError)(eije_data_translation_1.EIJEDataTranslationError.DUPLICATE_PATH, baseKey, attemptedKey);
            }
            else {
                translation.valid = true;
                translation.error = '';
            }
        }
        // Si no se permiten traducciones vacías, validar que no haya ninguna
        if (translation.valid && !eije_configuration_1.EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS) {
            // Comprobar si hay algún idioma con traducción vacía
            for (const language of this._languages) {
                if (language !== 'key' &&
                    !eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS.includes(language) &&
                    (!translation.languages[language] || translation.languages[language].trim() === '')) {
                    translation.valid = false;
                    translation.error = (0, eije_data_translation_1.getTranslatedError)(eije_data_translation_1.EIJEDataTranslationError.EMPTY_TRANSLATION);
                    break;
                }
            }
        }
    }
    _validatePath(translation, valid = true, key = undefined) {
        const splitKey = this._split(key !== undefined ? key : translation.key);
        return this._translations.filter(t => {
            if (translation.id === t.id || translation.folder !== t.folder || t.valid !== valid) {
                return false;
            }
            return this._comparePath(splitKey, t.key.split('.'));
        });
    }
    _comparePath(a, b) {
        const _a = a.length >= b.length ? b : a;
        const _b = a.length < b.length ? b : a;
        return _a.every((v, i) => v === _b[i]);
    }
    /**
     * Factories
     */
    _createFactoryIJEDataTranslation() {
        return {
            id: this._currentID++,
            folder: this._manager.folderPath || (eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS.length > 0 ? eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS[0].path : ''),
            valid: true,
            error: '',
            key: '',
            languages: {}
        };
    }
    /**
     * Helpers
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
    _get(id) {
        return this._translations.find(t => t.id === id);
    }
    _getIndex(id) {
        return this._translations.findIndex(t => t.id === id);
    }
    _insert(translation) {
        this._translations.push(translation);
    }
    _split(key) {
        if (eije_configuration_1.EIJEConfiguration.KEY_SEPARATOR) {
            return key.split(eije_configuration_1.EIJEConfiguration.KEY_SEPARATOR);
        }
        return [key];
    }
    _stripBOM(content) {
        if (!content.startsWith('\uFEFF')) {
            return content;
        }
        return content.replace('\uFEFF', '');
    }
}
exports.EIJEData = EIJEData;


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EIJEDataRenderService = void 0;
const eije_configuration_1 = __webpack_require__(6);
const i18n_service_1 = __webpack_require__(10);
class EIJEDataRenderService {
    static renderPagination(translations, page, withPageSizeSelector = true) {
        let render = '<div>';
        render += '<div class="row">';
        render += '<div class="col-4">';
        render += '<div class="mt-3">';
        if (page.count === 0) {
            render += '0 ';
        }
        else {
            var firstEl = (page.pageNumber - 1) * page.pageSize + 1;
            render += `${firstEl}-${firstEl + (translations.length - 1)} `;
        }
        render += `${i18n_service_1.I18nService.getInstance().t('ui.labels.of')} ${page.count}`;
        render += '</div>';
        render += '</div>';
        render += '<div class="col-8">';
        render += '<div class="float-right">';
        render += '<div class="form-inline">';
        if (withPageSizeSelector) {
            render += '<select class="form-control form-control-sm mr-4" style="height: 32px;" onchange="pageSize(this)">';
            [10, 20, 50, 100].forEach(i => {
                render += `<option value="${i}" ${i === page.pageSize ? 'selected="selected"' : ''}>${i}</option>`;
            });
            render += ' </select>';
        }
        render += '<nav class="mt-3">';
        render += '<ul class="pagination justify-content-center">';
        render += `<li class="page-item ${page.pageNumber <= 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="navigate(1)">|<</a></li>`;
        render += `<li class="page-item ${page.pageNumber - 1 < 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="navigate(${page.pageNumber - 1})"><</a></li>`;
        render += `<li class="page-item ${page.pageNumber + 1 > page.totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="navigate(${page.pageNumber + 1})">></a></li>`;
        render += `<li class="page-item ${page.pageNumber >= page.totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="navigate(${page.totalPages})">>|</a></li>`;
        render += '</ul>';
        render += '</nav>';
        render += '</div>';
        render += '</div>';
        render += '</div>';
        render += '</div>';
        render += '</div>';
        return render;
    }
    static _getTableHeader(column, sort) {
        const isRTL = eije_configuration_1.EIJEConfiguration.isRTL(column);
        const rtlClass = isRTL ? 'rtl-header' : '';
        return `<th class="text-center ${rtlClass}" style="cursor: pointer;" onclick="sort('${column}',${sort.column === column ? !sort.ascending : true})" ${isRTL ? 'dir="rtl"' : ''}>
            <div class="th">
           ${column}             
           ${sort.column === column ? (sort.ascending ? '<i class="fa-solid fa-chevron-up"></i>' : '<i class="fa-solid fa-chevron-down"></i>') : ''}
            </div>
        </th>`;
    }
    /**
     * Ordena los idiomas poniendo el idioma por defecto primero, luego el resto alfabéticamente
     */
    static sortLanguages(languages) {
        const defaultLanguage = eije_configuration_1.EIJEConfiguration.DEFAULT_LANGUAGE;
        const sortedLanguages = [...languages];
        return sortedLanguages.sort((a, b) => {
            // El idioma por defecto siempre va primero
            if (a === defaultLanguage) {
                return -1;
            }
            if (b === defaultLanguage) {
                return 1;
            }
            // El resto alfabéticamente
            return a.localeCompare(b);
        });
    }
    static renderColumnSelector(languages) {
        const i18n = i18n_service_1.I18nService.getInstance();
        const visibleColumns = eije_configuration_1.EIJEConfiguration.VISIBLE_COLUMNS;
        const hiddenColumns = eije_configuration_1.EIJEConfiguration.HIDDEN_COLUMNS;
        // Ordenar idiomas con el idioma por defecto primero
        const sortedLanguages = this.sortLanguages(languages);
        let render = '<div class="column-selector">';
        render += '<div id="columnSelectorContent" class="column-selector-panel" style="display:none;">';
        render += '<div class="card card-body">';
        render += '<div class="column-selector-grid">';
        // Siempre mostrar la columna "key" (deshabilitada)
        render += '<div class="column-selector-item">';
        render += '<div class="form-check">';
        render += `<input type="checkbox" class="form-check-input" id="column-key" checked disabled>`;
        render += `<label class="form-check-label" for="column-key">${i18n.t('ui.labels.keyColumn')}</label>`;
        render += '</div>';
        render += '</div>';
        // Mostrar idiomas ordenados
        const defaultLanguage = eije_configuration_1.EIJEConfiguration.DEFAULT_LANGUAGE;
        sortedLanguages.forEach(language => {
            const isChecked = language === defaultLanguage || visibleColumns.includes(language);
            const isDisabled = language === defaultLanguage; // No se puede ocultar el idioma por defecto
            render += '<div class="column-selector-item">';
            render += '<div class="form-check">';
            render += `<input type="checkbox" class="form-check-input" id="column-${language}" `;
            render += isChecked ? 'checked ' : '';
            render += isDisabled ? 'disabled ' : '';
            render += `onchange="document.getElementById('apply-columns-btn').disabled = false">`;
            render += `<label class="form-check-label" for="column-${language}">${language}</label>`;
            render += '</div>';
            render += '</div>';
        });
        render += '</div>';
        render += '<div class="text-right mt-3">';
        render += `<button type="button" id="apply-columns-btn" class="btn btn-vscode" onclick="applyColumnChanges()" disabled>${i18n.t('ui.buttons.apply')}</button>`;
        render += '</div>';
        render += '</div>';
        render += '</div>';
        render += '</div>';
        return render;
    }
    static renderTable(translations, languages, page, sort, showFolder = true, hasTranslateService = false) {
        // Get visible columns
        const visibleColumns = eije_configuration_1.EIJEConfiguration.VISIBLE_COLUMNS;
        const allLanguages = [...languages]; // Copia para no modificar el original
        // Filtrar idiomas según visibilidad y ordenar con el idioma por defecto primero
        const defaultLanguage = eije_configuration_1.EIJEConfiguration.DEFAULT_LANGUAGE;
        const filteredLanguages = this.sortLanguages(allLanguages.filter(lang => lang === defaultLanguage || visibleColumns.includes(lang)));
        // Crear selector de columnas
        let render = this.renderColumnSelector(languages);
        render += '<table class="table table-borderless">';
        render += '<tr>';
        render += '<th></th>';
        if (showFolder) {
            render += this._getTableHeader(i18n_service_1.I18nService.getInstance().t('ui.labels.folder'), sort);
        }
        render += this._getTableHeader(i18n_service_1.I18nService.getInstance().t('ui.labels.keyColumn'), sort);
        // Solo mostrar los encabezados de las columnas visibles
        filteredLanguages.forEach((language) => {
            render += `${this._getTableHeader(language, sort)}`;
        });
        render += '</tr>';
        translations.forEach(t => {
            render += '<tr>';
            render += `<td class="td-remove"><button type="button" class="btn p-0 px-1" onclick="remove(${t.id})"><i class="error-vscode fa-duotone fa-regular fa-circle-minus"></i></button></td>`;
            if (showFolder) {
                render += `<td><select id="select-folder-${t.id}" class="form-control" onchange="updateFolder(this,${t.id})">`;
                const folders = eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS;
                folders.forEach(d => {
                    render += `<option value='${d.path.replace(/"/g, '&quot;')}' ${d.path === t.folder ? 'selected' : ''}>${d.name}</option>`;
                });
                render += ' </select></td>';
            }
            render += `
                <td>
                    <input id="input-key-${t.id}" class="form-control ${t.valid ? '' : 'is-invalid'}" type="text" placeholder="${i18n_service_1.I18nService.getInstance().t('ui.placeholders.key')}" value="${t.key.replace(/"/g, '&quot;')}" onfocus="mark(${t.id})" oninput="updateInput(this,${t.id});" onchange="updateInput(this,${t.id});" />
                    <div id="input-key-${t.id}-feedback" class="invalid-feedback error-vscode">${t.error}</div>
                </td>
            `;
            // Solo mostrar las celdas de las columnas visibles
            filteredLanguages.forEach((language) => {
                const isRTL = eije_configuration_1.EIJEConfiguration.isRTL(language);
                const rtlClass = isRTL ? 'rtl-text' : '';
                render += '<td>';
                if (hasTranslateService) {
                    render += `<div class="input-group">`;
                }
                const isEmpty = !t.languages[language] || t.languages[language].trim() === '';
                render += `<input class="form-control ${rtlClass} ${isEmpty ? 'empty-translation' : ''}" type="text" placeholder="${i18n_service_1.I18nService.getInstance().t('ui.placeholders.translation')}" 
                    onfocus="mark(${t.id})" 
                    oninput="updateInput(this,${t.id},'${language}');" 
                    onchange="updateInput(this,${t.id},'${language}');" 
                    ${isRTL ? 'dir="rtl"' : ''} `;
                if (t.languages[language]) {
                    render += `value="${t.languages[language].replace(/\n/g, '\\n').replace(/"/g, '&quot;')}" `;
                }
                render += '/>';
                if (hasTranslateService) {
                    render += `<div class="input-group-append">
                               <button type="button" class="btn btn-vscode" onclick="translateInput(this,${t.id}, '${language}');"><i class="icon-language"></i></button>
                           </div>`;
                    render += '</div>';
                }
                render += '</td>';
            });
            render += '</tr>';
        });
        render += '</table>';
        render += this.renderPagination(translations, page);
        return render;
    }
    static renderList(translations, selectTranslation, languages, page, sort, showFolder = true, hasTranslateService = false) {
        // Get visible columns
        const visibleColumns = eije_configuration_1.EIJEConfiguration.VISIBLE_COLUMNS;
        const allLanguages = [...languages]; // Copia para no modificar el original
        // Filtrar idiomas según visibilidad y ordenar con el idioma por defecto primero
        const defaultLanguage = eije_configuration_1.EIJEConfiguration.DEFAULT_LANGUAGE;
        const filteredLanguages = this.sortLanguages(allLanguages.filter(lang => lang === defaultLanguage || visibleColumns.includes(lang)));
        let render = this.renderColumnSelector(languages);
        render += '<div>';
        render += '<div class="row">';
        render += '<div class="col-5 pt-15px">';
        render += this.renderPagination(translations, page, false);
        render += '<div style="word-wrap: break-word;" class="list-group">';
        translations.forEach(t => {
            render += `<a href="#" id="select-key-${t.id}" onclick="select(${t.id})" class="btn-vscode-secondary list-group-item list-group-item-action ${selectTranslation && selectTranslation.id === t.id ? 'active' : ''}">${t.key === '' ? '&nbsp;' : t.key}</a>`;
        });
        render += '</div>';
        render += '</div>';
        render += '<div class="col-7">';
        if (selectTranslation) {
            if (showFolder) {
                render += ` 
                  <div class="form-group">
                    <label>${i18n_service_1.I18nService.getInstance().t('ui.labels.directory')}</label>
                    <div class="row">
                      <div class="col-12">
                        <select id="select-folder-${selectTranslation.id}" class="form-control" onchange="updateFolder(this,${selectTranslation.id})">`;
                const folders = eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS;
                folders.forEach(d => {
                    render += `<option value='${d.path}' ${d.path === selectTranslation.folder ? 'selected' : ''}>${d.name}</option>`;
                });
                render += `
                        </select>               
                      </div>
                    </div>
                  </div>`;
            }
            render += `
                <div class="form-group">
                    <label>${i18n_service_1.I18nService.getInstance().t('ui.labels.key')}</label>
                    <div class="row ml--30 mr--18">
                        <div class="col-1 p-0 align-content-center div-remove">
                            <button type="button" class="btn p-0 px-1" onclick="remove(${selectTranslation.id})"><i class="error-vscode fa-duotone fa-regular fa-circle-minus"></i></button>
                        </div>
                        <div class="col-11 p-0">
                            <input id="input-key-${selectTranslation.id}" class="form-control ${selectTranslation.valid ? '' : 'is-invalid'}" type="text" placeholder="${i18n_service_1.I18nService.getInstance().t('ui.placeholders.key')}" value="${selectTranslation.key}" oninput="updateInput(this,${selectTranslation.id});" onchange="updateInput(this,${selectTranslation.id});" />
                            <div id="input-key-${selectTranslation.id}-feedback" class="invalid-feedback error-vscode">${selectTranslation.error}</div>
                        </div>
                    </div>
                </div>`;
            // Solo mostrar los campos de texto de los idiomas visibles
            filteredLanguages.forEach((language) => {
                const isRTL = eije_configuration_1.EIJEConfiguration.isRTL(language);
                const rtlClass = isRTL ? 'rtl-text' : '';
                render += `<label>${language}</label>`;
                if (hasTranslateService) {
                    render += `<div class="row">
                                    <div class="col-10">`;
                }
                render += `<textarea class="form-control mb-2 ${rtlClass}" rows="6" 
                    placeholder="${i18n_service_1.I18nService.getInstance().t('ui.placeholders.translation')}" 
                    oninput="updateInput(this,${selectTranslation.id},'${language}');" 
                    onchange="updateInput(this,${selectTranslation.id},'${language}');" 
                    ${isRTL ? 'dir="rtl"' : ''}>`;
                if (selectTranslation.languages[language]) {
                    render += selectTranslation.languages[language];
                }
                render += '</textarea>';
                if (hasTranslateService) {
                    render += `</div>
                                    <div class="col-2">
                                        <button type="button" class="btn btn-vscode" onclick="translateInput(this,${selectTranslation.id}, '${language}');"><i class="icon-language"></i></button>
                                    </div>
                                </div>
                            `;
                }
            });
        }
        render += '</div>';
        render += '</div>';
        render += '</div>';
        return render;
    }
}
exports.EIJEDataRenderService = EIJEDataRenderService;


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(4);

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.I18nService = void 0;
const path = __webpack_require__(3);
const eije_filesystem_1 = __webpack_require__(5);
const translations_1 = __webpack_require__(11);
class I18nService {
    constructor(context) {
        this.context = context;
        this.translations = {};
        this.currentLanguage = 'en';
        this.isLoaded = false;
        this.loadPromise = null;
        this.loadPromise = this.loadTranslations();
    }
    static getInstance(context) {
        if (!I18nService.instance && context) {
            I18nService.instance = new I18nService(context);
        }
        return I18nService.instance;
    }
    isWebEnvironment() {
        return typeof process === 'undefined' || process.versions?.node === undefined;
    }
    async loadTranslations() {
        try {
            if (this.isWebEnvironment()) {
                // En entorno web, usar las traducciones embebidas
                this.translations = translations_1.translations;
                this.isLoaded = true;
            }
            else {
                // En entorno Node.js, cargar desde archivos
                const langFiles = ['en.json', 'es.json'];
                const i18nDir = path.join(this.context.extensionPath, 'src', 'i18n');
                for (const file of langFiles) {
                    try {
                        const lang = file.split('.')[0];
                        const filePath = path.join(i18nDir, file);
                        if (await eije_filesystem_1.EIJEFileSystem.exists(filePath)) {
                            const content = await eije_filesystem_1.EIJEFileSystem.readFile(filePath);
                            this.translations[lang] = JSON.parse(content);
                        }
                    }
                    catch (error) {
                        console.error(`Failed to load translation file ${file}:`, error);
                    }
                }
                this.isLoaded = true;
            }
        }
        catch (error) {
            console.error('Failed to load translations:', error);
            // Fallback a traducciones embebidas
            this.translations = translations_1.translations;
            this.isLoaded = true;
        }
    }
    async waitForLoad() {
        if (this.loadPromise) {
            await this.loadPromise;
        }
    }
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
        }
        else {
            console.warn(`Language ${lang} not available, using default language`);
        }
    }
    getLanguage() {
        return this.currentLanguage;
    }
    t(key, ...args) {
        try {
            // Si las traducciones no están cargadas, usar fallback
            if (!this.isLoaded || !this.translations[this.currentLanguage]) {
                // Intentar usar traducciones embebidas como fallback
                const fallbackTranslations = translations_1.translations[this.currentLanguage] || translations_1.translations.en;
                const keyParts = key.split('.');
                let value = fallbackTranslations;
                for (const part of keyParts) {
                    value = value?.[part];
                    if (value === undefined) {
                        return key; // Return the key if the translation is not found
                    }
                }
                // Replace {0}, {1}, etc. with the corresponding arguments
                if (args.length > 0 && typeof value === 'string') {
                    return value.replace(/{(\d+)}/g, (match, index) => {
                        const argIndex = parseInt(index, 10);
                        return argIndex < args.length ? args[argIndex] : match;
                    });
                }
                return typeof value === 'string' ? value : key;
            }
            const keyParts = key.split('.');
            let value = this.translations[this.currentLanguage];
            for (const part of keyParts) {
                value = value?.[part];
                if (value === undefined) {
                    return key; // Return the key if the translation is not found
                }
            }
            // Replace {0}, {1}, etc. with the corresponding arguments
            if (args.length > 0 && typeof value === 'string') {
                return value.replace(/{(\d+)}/g, (match, index) => {
                    const argIndex = parseInt(index, 10);
                    return argIndex < args.length ? args[argIndex] : match;
                });
            }
            return typeof value === 'string' ? value : key;
        }
        catch (error) {
            console.error(`Translation error for key ${key}:`, error);
            return key;
        }
    }
}
exports.I18nService = I18nService;


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/**
 * Traducciones embebidas para el entorno web
 * Autor: trystan4861
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.translations = void 0;
exports.translations = {
    en: {
        "extension": {
            "statusBar": "i18n editor",
            "title": "ei18n-json-editor",
            "openEditor": "Open Editor",
            "openingEditor": "Opening Editor..."
        },
        "ui": {
            "buttons": {
                "translate": "Translate",
                "remove": "Remove",
                "reload": "Reload",
                "columnSelector": "Languages",
                "apply": "Apply"
            },
            "errors": {
                "invalidKey": "The key is invalid.",
                "keyNotEmpty": "The Key must be filled.",
                "duplicatePath": "Key path conflict: '{0}' already exists as a simple key. To create '{1}', you must first delete or rename the existing '{0}' key.",
                "emptyTranslation": "Translations cannot be empty when allowEmptyTranslations is set to false."
            },
            "prompts": {
                "enterLanguageCode": "Enter language code (max 5 characters)",
                "languageCodePlaceholder": "e.g. es_ES or de"
            },
            "labels": {
                "search": "Search...",
                "loading": "Loading...",
                "key": "Key",
                "directory": "Directory",
                "translation": "Translation...",
                "of": "of",
                "folder": "FOLDER",
                "keyColumn": "KEY",
                "toggle_search": "Toggle search",
                "save": "Save",
                "add_translation": "Add translation",
                "reload": "Reload",
                "add_language": "Add language",
                "toggle_column_selector": "Toggle column selector",
                "chage_view_mode": "Change view mode",
                "error_translations": "There are some translation errors"
            },
            "pagination": {
                "itemsPerPage": "Items per page"
            },
            "messages": {
                "saved": "i18n files saved",
                "reloaded": "i18n editor reloaded",
                "cannotSaveInvalidTranslations": "Cannot save: There are invalid translations. Please fix all errors before saving.",
                "saveError": "Error while saving files",
                "languageCodeEmpty": "Language code cannot be empty",
                "languageCodeTooLong": "Language code must be maximum 5 characters",
                "languageCodeInvalid": "Language code must be maximum 5 characters!",
                "noTargetFolder": "No target folder available to create language file",
                "languageFileExists": "Language file {0} already exists",
                "createdWithTemplate": "Created {0} using English template",
                "templateReadError": "Could not read English template. Creating empty file.",
                "templateNotFound": "English template not found. Creating empty file.",
                "languageFileCreated": "New language file {0} created",
                "fileCreationError": "Error creating language file: {0}",
                "unsupportedFolder": "The folder '{0}' is not supported. Please configure supported folders in settings.",
                "noEmptyTranslations": "No empty translations found."
            },
            "placeholders": {
                "key": "Key...",
                "translation": "Translation..."
            }
        }
    },
    es: {
        "extension": {
            "statusBar": "Editor i18n",
            "title": "Editor de JSON i18n",
            "openEditor": "Abrir Editor",
            "openingEditor": "Abriendo Editor..."
        },
        "ui": {
            "buttons": {
                "translate": "Traducir",
                "remove": "Eliminar",
                "reload": "Recargar",
                "columnSelector": "Idiomas",
                "apply": "Aplicar"
            },
            "errors": {
                "invalidKey": "La clave no es válida.",
                "keyNotEmpty": "La clave debe completarse.",
                "duplicatePath": "Conflicto de ruta de clave: '{0}' ya existe como clave simple. Para crear '{1}', primero debe eliminar o renombrar la clave existente '{0}'.",
                "emptyTranslation": "Las traducciones no pueden estar vacías cuando allowEmptyTranslations está configurado como false."
            },
            "prompts": {
                "enterLanguageCode": "Ingrese el código de idioma (máx. 5 caracteres)",
                "languageCodePlaceholder": "ej. es_ES o de"
            },
            "labels": {
                "search": "Buscar...",
                "loading": "Cargando...",
                "key": "Clave",
                "directory": "Directorio",
                "translation": "Traducción...",
                "of": "de",
                "folder": "CARPETA",
                "keyColumn": "CLAVE",
                "toggle_search": "Mostrar/ocultar búsqueda",
                "save": "Guardar",
                "add_translation": "Agregar traducción",
                "reload": "Recargar",
                "add_language": "Agregar idioma",
                "toggle_column_selector": "Mostrar/ocultar selector de columnas",
                "chage_view_mode": "Cambiar modo de vista",
                "error_translations": "Hay algunos errores de traducción"
            },
            "pagination": {
                "itemsPerPage": "Elementos por página"
            },
            "messages": {
                "saved": "Archivos i18n guardados",
                "reloaded": "Editor i18n recargado",
                "cannotSaveInvalidTranslations": "No se puede guardar: Hay traducciones inválidas.",
                "saveError": "Error al guardar los archivos",
                "languageCodeEmpty": "El código de idioma no puede estar vacío",
                "languageCodeTooLong": "El código de idioma debe tener máximo 5 caracteres",
                "languageCodeInvalid": "¡El código de idioma debe tener máximo 5 caracteres!",
                "noTargetFolder": "No hay carpeta disponible para crear el archivo de idioma",
                "languageFileExists": "El archivo de idioma {0} ya existe",
                "createdWithTemplate": "Se creó {0} usando la plantilla en inglés",
                "templateReadError": "No se pudo leer la plantilla en inglés. Creando archivo vacío.",
                "templateNotFound": "Plantilla en inglés no encontrada. Creando archivo vacío.",
                "languageFileCreated": "Nuevo archivo de idioma {0} creado",
                "fileCreationError": "Error al crear el archivo de idioma: {0}",
                "unsupportedFolder": "La carpeta '{0}' no está soportada. Por favor configure las carpetas soportadas en la configuración.",
                "noEmptyTranslations": "No se encontraron traducciones vacías."
            },
            "placeholders": {
                "key": "Clave...",
                "translation": "Traducción..."
            }
        }
    }
};


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getTranslatedError = exports.EIJEDataTranslationError = void 0;
const i18n_service_1 = __webpack_require__(10);
var EIJEDataTranslationError;
(function (EIJEDataTranslationError) {
    EIJEDataTranslationError["INVALID_KEY"] = "ui.errors.invalidKey";
    EIJEDataTranslationError["KEY_NOT_EMPTY"] = "ui.errors.keyNotEmpty";
    EIJEDataTranslationError["DUPLICATE_PATH"] = "ui.errors.duplicatePath";
    EIJEDataTranslationError["EMPTY_TRANSLATION"] = "ui.errors.emptyTranslation";
})(EIJEDataTranslationError = exports.EIJEDataTranslationError || (exports.EIJEDataTranslationError = {}));
// Helper function to get translated error message
function getTranslatedError(error, ...params) {
    return i18n_service_1.I18nService.getInstance().t(error, ...params);
}
exports.getTranslatedError = getTranslatedError;


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TranslationServiceEnum = exports.EIJETranslationService = void 0;
const eije_configuration_1 = __webpack_require__(6);
const eije_microsoft_translator_1 = __webpack_require__(14);
class EIJETranslationService {
    static async translate(translation, language, languages) {
        const tranlsationService = eije_configuration_1.EIJEConfiguration.TRANSLATION_SERVICE;
        // Return early if translation service is not available yet
        if (!tranlsationService ||
            !eije_configuration_1.EIJEConfiguration.TRANSLATION_SERVICE_API_KEY ||
            tranlsationService === TranslationServiceEnum.ComingSoon ||
            eije_configuration_1.EIJEConfiguration.TRANSLATION_SERVICE_API_KEY === 'Coming soon') {
            return;
        }
        let service;
        if (eije_configuration_1.EIJEConfiguration.TRANSLATION_SERVICE === TranslationServiceEnum.MicrosoftTranslator) {
            service = new eije_microsoft_translator_1.EIJEMicrosoftTranslator();
        }
        if (!service) {
            return;
        }
        const data = await service.translate(translation.languages[language], language, languages);
        languages
            .filter(l => l !== language)
            .forEach(l => {
            if (data[l]) {
                translation.languages[l] = data[l];
            }
        });
    }
}
exports.EIJETranslationService = EIJETranslationService;
var TranslationServiceEnum;
(function (TranslationServiceEnum) {
    TranslationServiceEnum["MicrosoftTranslator"] = "MicrosoftTranslator";
    TranslationServiceEnum["ComingSoon"] = "Coming soon";
})(TranslationServiceEnum = exports.TranslationServiceEnum || (exports.TranslationServiceEnum = {}));


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EIJEMicrosoftTranslator = void 0;
const axios_1 = __webpack_require__(15);
const eije_configuration_1 = __webpack_require__(6);
class EIJEMicrosoftTranslator {
    async translate(text, language, languages) {
        const endpoint = 'https://api.cognitive.microsofttranslator.com';
        var response = await (0, axios_1.default)({
            baseURL: endpoint,
            url: '/translate',
            method: 'post',
            headers: {
                'Ocp-Apim-Subscription-Key': eije_configuration_1.EIJEConfiguration.TRANSLATION_SERVICE_API_KEY,
                'Content-type': 'application/json'
            },
            params: {
                'api-version': '3.0',
                from: language,
                to: languages.filter(l => l !== language)
            },
            data: [
                {
                    text: text
                }
            ],
            responseType: 'json'
        });
        const data = response.data;
        if (data.length === 0) {
            return {};
        }
        return Object.assign({}, ...languages
            .filter(l => l !== language)
            .map(l => ({
            [l]: data[0].translations.filter(t => t.to === l)[0].text
        })));
    }
}
exports.EIJEMicrosoftTranslator = EIJEMicrosoftTranslator;


/***/ }),
/* 15 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(4);
/*! Axios v1.9.0 Copyright (c) 2025 Matt Zabriskie and contributors */


function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}

// utils is a library of generic helper functions non-specific to axios

const {toString} = Object.prototype;
const {getPrototypeOf} = Object;
const {iterator, toStringTag} = Symbol;

const kindOf = (cache => thing => {
    const str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));

const kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type
};

const typeOfTest = type => thing => typeof thing === type;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is an Array, otherwise false
 */
const {isArray} = Array;

/**
 * Determine if a value is undefined
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if the value is undefined, otherwise false
 */
const isUndefined = typeOfTest('undefined');

/**
 * Determine if a value is a Buffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
const isArrayBuffer = kindOfTest('ArrayBuffer');


/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  let result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a String, otherwise false
 */
const isString = typeOfTest('string');

/**
 * Determine if a value is a Function
 *
 * @param {*} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
const isFunction = typeOfTest('function');

/**
 * Determine if a value is a Number
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Number, otherwise false
 */
const isNumber = typeOfTest('number');

/**
 * Determine if a value is an Object
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an Object, otherwise false
 */
const isObject = (thing) => thing !== null && typeof thing === 'object';

/**
 * Determine if a value is a Boolean
 *
 * @param {*} thing The value to test
 * @returns {boolean} True if value is a Boolean, otherwise false
 */
const isBoolean = thing => thing === true || thing === false;

/**
 * Determine if a value is a plain Object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a plain Object, otherwise false
 */
const isPlainObject = (val) => {
  if (kindOf(val) !== 'object') {
    return false;
  }

  const prototype = getPrototypeOf(val);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(toStringTag in val) && !(iterator in val);
};

/**
 * Determine if a value is a Date
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Date, otherwise false
 */
const isDate = kindOfTest('Date');

/**
 * Determine if a value is a File
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
const isFile = kindOfTest('File');

/**
 * Determine if a value is a Blob
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Blob, otherwise false
 */
const isBlob = kindOfTest('Blob');

/**
 * Determine if a value is a FileList
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
const isFileList = kindOfTest('FileList');

/**
 * Determine if a value is a Stream
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Stream, otherwise false
 */
const isStream = (val) => isObject(val) && isFunction(val.pipe);

/**
 * Determine if a value is a FormData
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an FormData, otherwise false
 */
const isFormData = (thing) => {
  let kind;
  return thing && (
    (typeof FormData === 'function' && thing instanceof FormData) || (
      isFunction(thing.append) && (
        (kind = kindOf(thing)) === 'formdata' ||
        // detect form-data instance
        (kind === 'object' && isFunction(thing.toString) && thing.toString() === '[object FormData]')
      )
    )
  )
};

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
const isURLSearchParams = kindOfTest('URLSearchParams');

const [isReadableStream, isRequest, isResponse, isHeaders] = ['ReadableStream', 'Request', 'Response', 'Headers'].map(kindOfTest);

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 *
 * @returns {String} The String freed of excess whitespace
 */
const trim = (str) => str.trim ?
  str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 *
 * @param {Boolean} [allOwnKeys = false]
 * @returns {any}
 */
function forEach(obj, fn, {allOwnKeys = false} = {}) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  let i;
  let l;

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;

    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}

function findKey(obj, key) {
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}

const _global = (() => {
  /*eslint no-undef:0*/
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : __webpack_require__.g)
})();

const isContextDefined = (context) => !isUndefined(context) && context !== _global;

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 *
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  const {caseless} = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    const targetKey = caseless && findKey(result, key) || key;
    if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
      result[targetKey] = merge(result[targetKey], val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else {
      result[targetKey] = val;
    }
  };

  for (let i = 0, l = arguments.length; i < l; i++) {
    arguments[i] && forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 *
 * @param {Boolean} [allOwnKeys]
 * @returns {Object} The resulting value of object a
 */
const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
  forEach(b, (val, key) => {
    if (thisArg && isFunction(val)) {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  }, {allOwnKeys});
  return a;
};

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 *
 * @returns {string} content value without BOM
 */
const stripBOM = (content) => {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
};

/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 *
 * @returns {void}
 */
const inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  constructor.prototype.constructor = constructor;
  Object.defineProperty(constructor, 'super', {
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};

/**
 * Resolve object with deep prototype chain to a flat object
 * @param {Object} sourceObj source object
 * @param {Object} [destObj]
 * @param {Function|Boolean} [filter]
 * @param {Function} [propFilter]
 *
 * @returns {Object}
 */
const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};

  destObj = destObj || {};
  // eslint-disable-next-line no-eq-null,eqeqeq
  if (sourceObj == null) return destObj;

  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

  return destObj;
};

/**
 * Determines whether a string ends with the characters of a specified string
 *
 * @param {String} str
 * @param {String} searchString
 * @param {Number} [position= 0]
 *
 * @returns {boolean}
 */
const endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === undefined || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};


/**
 * Returns new array from array like object or null if failed
 *
 * @param {*} [thing]
 *
 * @returns {?Array}
 */
const toArray = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
};

/**
 * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
 * thing passed in is an instance of Uint8Array
 *
 * @param {TypedArray}
 *
 * @returns {Array}
 */
// eslint-disable-next-line func-names
const isTypedArray = (TypedArray => {
  // eslint-disable-next-line func-names
  return thing => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));

/**
 * For each entry in the object, call the function with the key and value.
 *
 * @param {Object<any, any>} obj - The object to iterate over.
 * @param {Function} fn - The function to call for each entry.
 *
 * @returns {void}
 */
const forEachEntry = (obj, fn) => {
  const generator = obj && obj[iterator];

  const _iterator = generator.call(obj);

  let result;

  while ((result = _iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};

/**
 * It takes a regular expression and a string, and returns an array of all the matches
 *
 * @param {string} regExp - The regular expression to match against.
 * @param {string} str - The string to search.
 *
 * @returns {Array<boolean>}
 */
const matchAll = (regExp, str) => {
  let matches;
  const arr = [];

  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }

  return arr;
};

/* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
const isHTMLForm = kindOfTest('HTMLFormElement');

const toCamelCase = str => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,
    function replacer(m, p1, p2) {
      return p1.toUpperCase() + p2;
    }
  );
};

/* Creating a function that will check if an object has a property. */
const hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

/**
 * Determine if a value is a RegExp object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a RegExp object, otherwise false
 */
const isRegExp = kindOfTest('RegExp');

const reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};

  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });

  Object.defineProperties(obj, reducedDescriptors);
};

/**
 * Makes all methods read-only
 * @param {Object} obj
 */

const freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    // skip restricted props in strict mode
    if (isFunction(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
      return false;
    }

    const value = obj[name];

    if (!isFunction(value)) return;

    descriptor.enumerable = false;

    if ('writable' in descriptor) {
      descriptor.writable = false;
      return;
    }

    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error('Can not rewrite read-only method \'' + name + '\'');
      };
    }
  });
};

const toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};

  const define = (arr) => {
    arr.forEach(value => {
      obj[value] = true;
    });
  };

  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));

  return obj;
};

const noop = () => {};

const toFiniteNumber = (value, defaultValue) => {
  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
};

/**
 * If the thing is a FormData object, return true, otherwise return false.
 *
 * @param {unknown} thing - The thing to check.
 *
 * @returns {boolean}
 */
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction(thing.append) && thing[toStringTag] === 'FormData' && thing[iterator]);
}

const toJSONObject = (obj) => {
  const stack = new Array(10);

  const visit = (source, i) => {

    if (isObject(source)) {
      if (stack.indexOf(source) >= 0) {
        return;
      }

      if(!('toJSON' in source)) {
        stack[i] = source;
        const target = isArray(source) ? [] : {};

        forEach(source, (value, key) => {
          const reducedValue = visit(value, i + 1);
          !isUndefined(reducedValue) && (target[key] = reducedValue);
        });

        stack[i] = undefined;

        return target;
      }
    }

    return source;
  };

  return visit(obj, 0);
};

const isAsyncFn = kindOfTest('AsyncFunction');

const isThenable = (thing) =>
  thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);

// original code
// https://github.com/DigitalBrainJS/AxiosPromise/blob/16deab13710ec09779922131f3fa5954320f83ab/lib/utils.js#L11-L34

const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }

  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener("message", ({source, data}) => {
      if (source === _global && data === token) {
        callbacks.length && callbacks.shift()();
      }
    }, false);

    return (cb) => {
      callbacks.push(cb);
      _global.postMessage(token, "*");
    }
  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(
  typeof setImmediate === 'function',
  isFunction(_global.postMessage)
);

const asap = typeof queueMicrotask !== 'undefined' ?
  queueMicrotask.bind(_global) : ( typeof process !== 'undefined' && process.nextTick || _setImmediate);

// *********************


const isIterable = (thing) => thing != null && isFunction(thing[iterator]);


var utils$1 = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isBlob,
  isRegExp,
  isFunction,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap,
  isIterable
};

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 *
 * @returns {Error} The created error.
 */
function AxiosError(message, code, config, request, response) {
  Error.call(this);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = (new Error()).stack;
  }

  this.message = message;
  this.name = 'AxiosError';
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  if (response) {
    this.response = response;
    this.status = response.status ? response.status : null;
  }
}

utils$1.inherits(AxiosError, Error, {
  toJSON: function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: utils$1.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
});

const prototype$1 = AxiosError.prototype;
const descriptors = {};

[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED',
  'ERR_NOT_SUPPORT',
  'ERR_INVALID_URL'
// eslint-disable-next-line func-names
].forEach(code => {
  descriptors[code] = {value: code};
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype$1, 'isAxiosError', {value: true});

// eslint-disable-next-line func-names
AxiosError.from = (error, code, config, request, response, customProps) => {
  const axiosError = Object.create(prototype$1);

  utils$1.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  }, prop => {
    return prop !== 'isAxiosError';
  });

  AxiosError.call(axiosError, error.message, code, config, request, response);

  axiosError.cause = error;

  axiosError.name = error.name;

  customProps && Object.assign(axiosError, customProps);

  return axiosError;
};

// eslint-disable-next-line strict
var httpAdapter = null;

/**
 * Determines if the given thing is a array or js object.
 *
 * @param {string} thing - The object or array to be visited.
 *
 * @returns {boolean}
 */
function isVisitable(thing) {
  return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
}

/**
 * It removes the brackets from the end of a string
 *
 * @param {string} key - The key of the parameter.
 *
 * @returns {string} the key without the brackets.
 */
function removeBrackets(key) {
  return utils$1.endsWith(key, '[]') ? key.slice(0, -2) : key;
}

/**
 * It takes a path, a key, and a boolean, and returns a string
 *
 * @param {string} path - The path to the current key.
 * @param {string} key - The key of the current object being iterated over.
 * @param {string} dots - If true, the key will be rendered with dots instead of brackets.
 *
 * @returns {string} The path to the current key.
 */
function renderKey(path, key, dots) {
  if (!path) return key;
  return path.concat(key).map(function each(token, i) {
    // eslint-disable-next-line no-param-reassign
    token = removeBrackets(token);
    return !dots && i ? '[' + token + ']' : token;
  }).join(dots ? '.' : '');
}

/**
 * If the array is an array and none of its elements are visitable, then it's a flat array.
 *
 * @param {Array<any>} arr - The array to check
 *
 * @returns {boolean}
 */
function isFlatArray(arr) {
  return utils$1.isArray(arr) && !arr.some(isVisitable);
}

const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});

/**
 * Convert a data object to FormData
 *
 * @param {Object} obj
 * @param {?Object} [formData]
 * @param {?Object} [options]
 * @param {Function} [options.visitor]
 * @param {Boolean} [options.metaTokens = true]
 * @param {Boolean} [options.dots = false]
 * @param {?Boolean} [options.indexes = false]
 *
 * @returns {Object}
 **/

/**
 * It converts an object into a FormData object
 *
 * @param {Object<any, any>} obj - The object to convert to form data.
 * @param {string} formData - The FormData object to append to.
 * @param {Object<string, any>} options
 *
 * @returns
 */
function toFormData(obj, formData, options) {
  if (!utils$1.isObject(obj)) {
    throw new TypeError('target must be an object');
  }

  // eslint-disable-next-line no-param-reassign
  formData = formData || new (FormData)();

  // eslint-disable-next-line no-param-reassign
  options = utils$1.toFlatObject(options, {
    metaTokens: true,
    dots: false,
    indexes: false
  }, false, function defined(option, source) {
    // eslint-disable-next-line no-eq-null,eqeqeq
    return !utils$1.isUndefined(source[option]);
  });

  const metaTokens = options.metaTokens;
  // eslint-disable-next-line no-use-before-define
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
  const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);

  if (!utils$1.isFunction(visitor)) {
    throw new TypeError('visitor must be a function');
  }

  function convertValue(value) {
    if (value === null) return '';

    if (utils$1.isDate(value)) {
      return value.toISOString();
    }

    if (!useBlob && utils$1.isBlob(value)) {
      throw new AxiosError('Blob is not supported. Use a Buffer instead.');
    }

    if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
      return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
    }

    return value;
  }

  /**
   * Default visitor.
   *
   * @param {*} value
   * @param {String|Number} key
   * @param {Array<String|Number>} path
   * @this {FormData}
   *
   * @returns {boolean} return true to visit the each prop of the value recursively
   */
  function defaultVisitor(value, key, path) {
    let arr = value;

    if (value && !path && typeof value === 'object') {
      if (utils$1.endsWith(key, '{}')) {
        // eslint-disable-next-line no-param-reassign
        key = metaTokens ? key : key.slice(0, -2);
        // eslint-disable-next-line no-param-reassign
        value = JSON.stringify(value);
      } else if (
        (utils$1.isArray(value) && isFlatArray(value)) ||
        ((utils$1.isFileList(value) || utils$1.endsWith(key, '[]')) && (arr = utils$1.toArray(value))
        )) {
        // eslint-disable-next-line no-param-reassign
        key = removeBrackets(key);

        arr.forEach(function each(el, index) {
          !(utils$1.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
            convertValue(el)
          );
        });
        return false;
      }
    }

    if (isVisitable(value)) {
      return true;
    }

    formData.append(renderKey(path, key, dots), convertValue(value));

    return false;
  }

  const stack = [];

  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });

  function build(value, path) {
    if (utils$1.isUndefined(value)) return;

    if (stack.indexOf(value) !== -1) {
      throw Error('Circular reference detected in ' + path.join('.'));
    }

    stack.push(value);

    utils$1.forEach(value, function each(el, key) {
      const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(
        formData, el, utils$1.isString(key) ? key.trim() : key, path, exposedHelpers
      );

      if (result === true) {
        build(el, path ? path.concat(key) : [key]);
      }
    });

    stack.pop();
  }

  if (!utils$1.isObject(obj)) {
    throw new TypeError('data must be an object');
  }

  build(obj);

  return formData;
}

/**
 * It encodes a string by replacing all characters that are not in the unreserved set with
 * their percent-encoded equivalents
 *
 * @param {string} str - The string to encode.
 *
 * @returns {string} The encoded string.
 */
function encode$1(str) {
  const charMap = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '~': '%7E',
    '%20': '+',
    '%00': '\x00'
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
    return charMap[match];
  });
}

/**
 * It takes a params object and converts it to a FormData object
 *
 * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
 * @param {Object<string, any>} options - The options object passed to the Axios constructor.
 *
 * @returns {void}
 */
function AxiosURLSearchParams(params, options) {
  this._pairs = [];

  params && toFormData(params, this, options);
}

const prototype = AxiosURLSearchParams.prototype;

prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};

prototype.toString = function toString(encoder) {
  const _encode = encoder ? function(value) {
    return encoder.call(this, value, encode$1);
  } : encode$1;

  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + '=' + _encode(pair[1]);
  }, '').join('&');
};

/**
 * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
 * URI encoded counterparts
 *
 * @param {string} val The value to be encoded.
 *
 * @returns {string} The encoded value.
 */
function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @param {?(object|Function)} options
 *
 * @returns {string} The formatted url
 */
function buildURL(url, params, options) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }
  
  const _encode = options && options.encode || encode;

  if (utils$1.isFunction(options)) {
    options = {
      serialize: options
    };
  } 

  const serializeFn = options && options.serialize;

  let serializedParams;

  if (serializeFn) {
    serializedParams = serializeFn(params, options);
  } else {
    serializedParams = utils$1.isURLSearchParams(params) ?
      params.toString() :
      new AxiosURLSearchParams(params, options).toString(_encode);
  }

  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");

    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
}

class InterceptorManager {
  constructor() {
    this.handlers = [];
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    utils$1.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
}

var InterceptorManager$1 = InterceptorManager;

var transitionalDefaults = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
};

var URLSearchParams$1 = typeof URLSearchParams !== 'undefined' ? URLSearchParams : AxiosURLSearchParams;

var FormData$1 = typeof FormData !== 'undefined' ? FormData : null;

var Blob$1 = typeof Blob !== 'undefined' ? Blob : null;

var platform$1 = {
  isBrowser: true,
  classes: {
    URLSearchParams: URLSearchParams$1,
    FormData: FormData$1,
    Blob: Blob$1
  },
  protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
};

const hasBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined';

const _navigator = typeof navigator === 'object' && navigator || undefined;

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 *
 * @returns {boolean}
 */
const hasStandardBrowserEnv = hasBrowserEnv &&
  (!_navigator || ['ReactNative', 'NativeScript', 'NS'].indexOf(_navigator.product) < 0);

/**
 * Determine if we're running in a standard browser webWorker environment
 *
 * Although the `isStandardBrowserEnv` method indicates that
 * `allows axios to run in a web worker`, the WebWorker will still be
 * filtered out due to its judgment standard
 * `typeof window !== 'undefined' && typeof document !== 'undefined'`.
 * This leads to a problem when axios post `FormData` in webWorker
 */
const hasStandardBrowserWebWorkerEnv = (() => {
  return (
    typeof WorkerGlobalScope !== 'undefined' &&
    // eslint-disable-next-line no-undef
    self instanceof WorkerGlobalScope &&
    typeof self.importScripts === 'function'
  );
})();

const origin = hasBrowserEnv && window.location.href || 'http://localhost';

var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  hasBrowserEnv: hasBrowserEnv,
  hasStandardBrowserWebWorkerEnv: hasStandardBrowserWebWorkerEnv,
  hasStandardBrowserEnv: hasStandardBrowserEnv,
  navigator: _navigator,
  origin: origin
});

var platform = {
  ...utils,
  ...platform$1
};

function toURLEncodedForm(data, options) {
  return toFormData(data, new platform.classes.URLSearchParams(), Object.assign({
    visitor: function(value, key, path, helpers) {
      if (platform.isNode && utils$1.isBuffer(value)) {
        this.append(key, value.toString('base64'));
        return false;
      }

      return helpers.defaultVisitor.apply(this, arguments);
    }
  }, options));
}

/**
 * It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
 *
 * @param {string} name - The name of the property to get.
 *
 * @returns An array of strings.
 */
function parsePropPath(name) {
  // foo[x][y][z]
  // foo.x.y.z
  // foo-x-y-z
  // foo x y z
  return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map(match => {
    return match[0] === '[]' ? '' : match[1] || match[0];
  });
}

/**
 * Convert an array to an object.
 *
 * @param {Array<any>} arr - The array to convert to an object.
 *
 * @returns An object with the same keys and values as the array.
 */
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}

/**
 * It takes a FormData object and returns a JavaScript object
 *
 * @param {string} formData The FormData object to convert to JSON.
 *
 * @returns {Object<string, any> | null} The converted object.
 */
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    let name = path[index++];

    if (name === '__proto__') return true;

    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils$1.isArray(target) ? target.length : name;

    if (isLast) {
      if (utils$1.hasOwnProp(target, name)) {
        target[name] = [target[name], value];
      } else {
        target[name] = value;
      }

      return !isNumericKey;
    }

    if (!target[name] || !utils$1.isObject(target[name])) {
      target[name] = [];
    }

    const result = buildPath(path, value, target[name], index);

    if (result && utils$1.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }

    return !isNumericKey;
  }

  if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
    const obj = {};

    utils$1.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });

    return obj;
  }

  return null;
}

/**
 * It takes a string, tries to parse it, and if it fails, it returns the stringified version
 * of the input
 *
 * @param {any} rawValue - The value to be stringified.
 * @param {Function} parser - A function that parses a string into a JavaScript object.
 * @param {Function} encoder - A function that takes a value and returns a string.
 *
 * @returns {string} A stringified version of the rawValue.
 */
function stringifySafely(rawValue, parser, encoder) {
  if (utils$1.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils$1.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

const defaults = {

  transitional: transitionalDefaults,

  adapter: ['xhr', 'http', 'fetch'],

  transformRequest: [function transformRequest(data, headers) {
    const contentType = headers.getContentType() || '';
    const hasJSONContentType = contentType.indexOf('application/json') > -1;
    const isObjectPayload = utils$1.isObject(data);

    if (isObjectPayload && utils$1.isHTMLForm(data)) {
      data = new FormData(data);
    }

    const isFormData = utils$1.isFormData(data);

    if (isFormData) {
      return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
    }

    if (utils$1.isArrayBuffer(data) ||
      utils$1.isBuffer(data) ||
      utils$1.isStream(data) ||
      utils$1.isFile(data) ||
      utils$1.isBlob(data) ||
      utils$1.isReadableStream(data)
    ) {
      return data;
    }
    if (utils$1.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils$1.isURLSearchParams(data)) {
      headers.setContentType('application/x-www-form-urlencoded;charset=utf-8', false);
      return data.toString();
    }

    let isFileList;

    if (isObjectPayload) {
      if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
        return toURLEncodedForm(data, this.formSerializer).toString();
      }

      if ((isFileList = utils$1.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
        const _FormData = this.env && this.env.FormData;

        return toFormData(
          isFileList ? {'files[]': data} : data,
          _FormData && new _FormData(),
          this.formSerializer
        );
      }
    }

    if (isObjectPayload || hasJSONContentType ) {
      headers.setContentType('application/json', false);
      return stringifySafely(data);
    }

    return data;
  }],

  transformResponse: [function transformResponse(data) {
    const transitional = this.transitional || defaults.transitional;
    const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    const JSONRequested = this.responseType === 'json';

    if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
      return data;
    }

    if (data && utils$1.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
      const silentJSONParsing = transitional && transitional.silentJSONParsing;
      const strictJSONParsing = !silentJSONParsing && JSONRequested;

      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  env: {
    FormData: platform.classes.FormData,
    Blob: platform.classes.Blob
  },

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': undefined
    }
  }
};

utils$1.forEach(['delete', 'get', 'head', 'post', 'put', 'patch'], (method) => {
  defaults.headers[method] = {};
});

var defaults$1 = defaults;

// RawAxiosHeaders whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
const ignoreDuplicateOf = utils$1.toObjectSet([
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
]);

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} rawHeaders Headers needing to be parsed
 *
 * @returns {Object} Headers parsed into an object
 */
var parseHeaders = rawHeaders => {
  const parsed = {};
  let key;
  let val;
  let i;

  rawHeaders && rawHeaders.split('\n').forEach(function parser(line) {
    i = line.indexOf(':');
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();

    if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
      return;
    }

    if (key === 'set-cookie') {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
    }
  });

  return parsed;
};

const $internals = Symbol('internals');

function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}

function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }

  return utils$1.isArray(value) ? value.map(normalizeValue) : String(value);
}

function parseTokens(str) {
  const tokens = Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;

  while ((match = tokensRE.exec(str))) {
    tokens[match[1]] = match[2];
  }

  return tokens;
}

const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());

function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
  if (utils$1.isFunction(filter)) {
    return filter.call(this, value, header);
  }

  if (isHeaderNameFilter) {
    value = header;
  }

  if (!utils$1.isString(value)) return;

  if (utils$1.isString(filter)) {
    return value.indexOf(filter) !== -1;
  }

  if (utils$1.isRegExp(filter)) {
    return filter.test(value);
  }
}

function formatHeader(header) {
  return header.trim()
    .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
      return char.toUpperCase() + str;
    });
}

function buildAccessors(obj, header) {
  const accessorName = utils$1.toCamelCase(' ' + header);

  ['get', 'set', 'has'].forEach(methodName => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}

class AxiosHeaders {
  constructor(headers) {
    headers && this.set(headers);
  }

  set(header, valueOrRewrite, rewrite) {
    const self = this;

    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);

      if (!lHeader) {
        throw new Error('header name must be a non-empty string');
      }

      const key = utils$1.findKey(self, lHeader);

      if(!key || self[key] === undefined || _rewrite === true || (_rewrite === undefined && self[key] !== false)) {
        self[key || _header] = normalizeValue(_value);
      }
    }

    const setHeaders = (headers, _rewrite) =>
      utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

    if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if(utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders(header), valueOrRewrite);
    } else if (utils$1.isObject(header) && utils$1.isIterable(header)) {
      let obj = {}, dest, key;
      for (const entry of header) {
        if (!utils$1.isArray(entry)) {
          throw TypeError('Object iterator must return a key-value pair');
        }

        obj[key = entry[0]] = (dest = obj[key]) ?
          (utils$1.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]]) : entry[1];
      }

      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }

    return this;
  }

  get(header, parser) {
    header = normalizeHeader(header);

    if (header) {
      const key = utils$1.findKey(this, header);

      if (key) {
        const value = this[key];

        if (!parser) {
          return value;
        }

        if (parser === true) {
          return parseTokens(value);
        }

        if (utils$1.isFunction(parser)) {
          return parser.call(this, value, key);
        }

        if (utils$1.isRegExp(parser)) {
          return parser.exec(value);
        }

        throw new TypeError('parser must be boolean|regexp|function');
      }
    }
  }

  has(header, matcher) {
    header = normalizeHeader(header);

    if (header) {
      const key = utils$1.findKey(this, header);

      return !!(key && this[key] !== undefined && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }

    return false;
  }

  delete(header, matcher) {
    const self = this;
    let deleted = false;

    function deleteHeader(_header) {
      _header = normalizeHeader(_header);

      if (_header) {
        const key = utils$1.findKey(self, _header);

        if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
          delete self[key];

          deleted = true;
        }
      }
    }

    if (utils$1.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }

    return deleted;
  }

  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;

    while (i--) {
      const key = keys[i];
      if(!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }

    return deleted;
  }

  normalize(format) {
    const self = this;
    const headers = {};

    utils$1.forEach(this, (value, header) => {
      const key = utils$1.findKey(headers, header);

      if (key) {
        self[key] = normalizeValue(value);
        delete self[header];
        return;
      }

      const normalized = format ? formatHeader(header) : String(header).trim();

      if (normalized !== header) {
        delete self[header];
      }

      self[normalized] = normalizeValue(value);

      headers[normalized] = true;
    });

    return this;
  }

  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }

  toJSON(asStrings) {
    const obj = Object.create(null);

    utils$1.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(', ') : value);
    });

    return obj;
  }

  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }

  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ': ' + value).join('\n');
  }

  getSetCookie() {
    return this.get("set-cookie") || [];
  }

  get [Symbol.toStringTag]() {
    return 'AxiosHeaders';
  }

  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }

  static concat(first, ...targets) {
    const computed = new this(first);

    targets.forEach((target) => computed.set(target));

    return computed;
  }

  static accessor(header) {
    const internals = this[$internals] = (this[$internals] = {
      accessors: {}
    });

    const accessors = internals.accessors;
    const prototype = this.prototype;

    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);

      if (!accessors[lHeader]) {
        buildAccessors(prototype, _header);
        accessors[lHeader] = true;
      }
    }

    utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

    return this;
  }
}

AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent', 'Authorization']);

// reserved names hotfix
utils$1.reduceDescriptors(AxiosHeaders.prototype, ({value}, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1); // map `set` => `Set`
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  }
});

utils$1.freezeMethods(AxiosHeaders);

var AxiosHeaders$1 = AxiosHeaders;

/**
 * Transform the data for a request or a response
 *
 * @param {Array|Function} fns A single function or Array of functions
 * @param {?Object} response The response object
 *
 * @returns {*} The resulting transformed data
 */
function transformData(fns, response) {
  const config = this || defaults$1;
  const context = response || config;
  const headers = AxiosHeaders$1.from(context.headers);
  let data = context.data;

  utils$1.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
  });

  headers.normalize();

  return data;
}

function isCancel(value) {
  return !!(value && value.__CANCEL__);
}

/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @param {string=} message The message.
 * @param {Object=} config The config.
 * @param {Object=} request The request.
 *
 * @returns {CanceledError} The created error.
 */
function CanceledError(message, config, request) {
  // eslint-disable-next-line no-eq-null,eqeqeq
  AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
  this.name = 'CanceledError';
}

utils$1.inherits(CanceledError, AxiosError, {
  __CANCEL__: true
});

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 *
 * @returns {object} The response.
 */
function settle(resolve, reject, response) {
  const validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError(
      'Request failed with status code ' + response.status,
      [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
}

function parseProtocol(url) {
  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || '';
}

/**
 * Calculate data maxRate
 * @param {Number} [samplesCount= 10]
 * @param {Number} [min= 1000]
 * @returns {Function}
 */
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;

  min = min !== undefined ? min : 1000;

  return function push(chunkLength) {
    const now = Date.now();

    const startedAt = timestamps[tail];

    if (!firstSampleTS) {
      firstSampleTS = now;
    }

    bytes[head] = chunkLength;
    timestamps[head] = now;

    let i = tail;
    let bytesCount = 0;

    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }

    head = (head + 1) % samplesCount;

    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }

    if (now - firstSampleTS < min) {
      return;
    }

    const passed = startedAt && now - startedAt;

    return passed ? Math.round(bytesCount * 1000 / passed) : undefined;
  };
}

/**
 * Throttle decorator
 * @param {Function} fn
 * @param {Number} freq
 * @return {Function}
 */
function throttle(fn, freq) {
  let timestamp = 0;
  let threshold = 1000 / freq;
  let lastArgs;
  let timer;

  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn.apply(null, args);
  };

  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if ( passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };

  const flush = () => lastArgs && invoke(lastArgs);

  return [throttled, flush];
}

const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer(50, 250);

  return throttle(e => {
    const loaded = e.loaded;
    const total = e.lengthComputable ? e.total : undefined;
    const progressBytes = loaded - bytesNotified;
    const rate = _speedometer(progressBytes);
    const inRange = loaded <= total;

    bytesNotified = loaded;

    const data = {
      loaded,
      total,
      progress: total ? (loaded / total) : undefined,
      bytes: progressBytes,
      rate: rate ? rate : undefined,
      estimated: rate && total && inRange ? (total - loaded) / rate : undefined,
      event: e,
      lengthComputable: total != null,
      [isDownloadStream ? 'download' : 'upload']: true
    };

    listener(data);
  }, freq);
};

const progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;

  return [(loaded) => throttled[0]({
    lengthComputable,
    total,
    loaded
  }), throttled[1]];
};

const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));

var isURLSameOrigin = platform.hasStandardBrowserEnv ? ((origin, isMSIE) => (url) => {
  url = new URL(url, platform.origin);

  return (
    origin.protocol === url.protocol &&
    origin.host === url.host &&
    (isMSIE || origin.port === url.port)
  );
})(
  new URL(platform.origin),
  platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
) : () => true;

var cookies = platform.hasStandardBrowserEnv ?

  // Standard browser envs support document.cookie
  {
    write(name, value, expires, path, domain, secure) {
      const cookie = [name + '=' + encodeURIComponent(value)];

      utils$1.isNumber(expires) && cookie.push('expires=' + new Date(expires).toGMTString());

      utils$1.isString(path) && cookie.push('path=' + path);

      utils$1.isString(domain) && cookie.push('domain=' + domain);

      secure === true && cookie.push('secure');

      document.cookie = cookie.join('; ');
    },

    read(name) {
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return (match ? decodeURIComponent(match[3]) : null);
    },

    remove(name) {
      this.write(name, '', Date.now() - 86400000);
    }
  }

  :

  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {},
    read() {
      return null;
    },
    remove() {}
  };

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 *
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 *
 * @returns {string} The combined URL
 */
function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/?\/$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 *
 * @returns {string} The combined full path
 */
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls == false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}

const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 *
 * @returns {Object} New object resulting from merging config2 to config1
 */
function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  const config = {};

  function getMergedValue(target, source, prop, caseless) {
    if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
      return utils$1.merge.call({caseless}, target, source);
    } else if (utils$1.isPlainObject(source)) {
      return utils$1.merge({}, source);
    } else if (utils$1.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  // eslint-disable-next-line consistent-return
  function mergeDeepProperties(a, b, prop , caseless) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(a, b, prop , caseless);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(undefined, a, prop , caseless);
    }
  }

  // eslint-disable-next-line consistent-return
  function valueFromConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(undefined, b);
    }
  }

  // eslint-disable-next-line consistent-return
  function defaultToConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(undefined, b);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(undefined, a);
    }
  }

  // eslint-disable-next-line consistent-return
  function mergeDirectKeys(a, b, prop) {
    if (prop in config2) {
      return getMergedValue(a, b);
    } else if (prop in config1) {
      return getMergedValue(undefined, a);
    }
  }

  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b , prop) => mergeDeepProperties(headersToObject(a), headersToObject(b),prop, true)
  };

  utils$1.forEach(Object.keys(Object.assign({}, config1, config2)), function computeConfigValue(prop) {
    const merge = mergeMap[prop] || mergeDeepProperties;
    const configValue = merge(config1[prop], config2[prop], prop);
    (utils$1.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });

  return config;
}

var resolveConfig = (config) => {
  const newConfig = mergeConfig({}, config);

  let {data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth} = newConfig;

  newConfig.headers = headers = AxiosHeaders$1.from(headers);

  newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url, newConfig.allowAbsoluteUrls), config.params, config.paramsSerializer);

  // HTTP basic authentication
  if (auth) {
    headers.set('Authorization', 'Basic ' +
      btoa((auth.username || '') + ':' + (auth.password ? unescape(encodeURIComponent(auth.password)) : ''))
    );
  }

  let contentType;

  if (utils$1.isFormData(data)) {
    if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
      headers.setContentType(undefined); // Let the browser set it
    } else if ((contentType = headers.getContentType()) !== false) {
      // fix semicolon duplication issue for ReactNative FormData implementation
      const [type, ...tokens] = contentType ? contentType.split(';').map(token => token.trim()).filter(Boolean) : [];
      headers.setContentType([type || 'multipart/form-data', ...tokens].join('; '));
    }
  }

  // Add xsrf header
  // This is only done if running in a standard browser environment.
  // Specifically not if we're in a web worker, or react-native.

  if (platform.hasStandardBrowserEnv) {
    withXSRFToken && utils$1.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));

    if (withXSRFToken || (withXSRFToken !== false && isURLSameOrigin(newConfig.url))) {
      // Add xsrf header
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);

      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }

  return newConfig;
};

const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';

var xhrAdapter = isXHRAdapterSupported && function (config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    const _config = resolveConfig(config);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
    let {responseType, onUploadProgress, onDownloadProgress} = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload;

    function done() {
      flushUpload && flushUpload(); // flush events
      flushDownload && flushDownload(); // flush events

      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);

      _config.signal && _config.signal.removeEventListener('abort', onCanceled);
    }

    let request = new XMLHttpRequest();

    request.open(_config.method.toUpperCase(), _config.url, true);

    // Set the request timeout in MS
    request.timeout = _config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      const responseHeaders = AxiosHeaders$1.from(
        'getAllResponseHeaders' in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === 'text' || responseType === 'json' ?
        request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      };

      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? 'timeout of ' + _config.timeout + 'ms exceeded' : 'timeout exceeded';
      const transitional = _config.transitional || transitionalDefaults;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(new AxiosError(
        timeoutErrorMessage,
        transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
        config,
        request));

      // Clean up request
      request = null;
    };

    // Remove Content-Type if data is undefined
    requestData === undefined && requestHeaders.setContentType(null);

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }

    // Add withCredentials to request if needed
    if (!utils$1.isUndefined(_config.withCredentials)) {
      request.withCredentials = !!_config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = _config.responseType;
    }

    // Handle progress if needed
    if (onDownloadProgress) {
      ([downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true));
      request.addEventListener('progress', downloadThrottled);
    }

    // Not all browsers support upload events
    if (onUploadProgress && request.upload) {
      ([uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress));

      request.upload.addEventListener('progress', uploadThrottled);

      request.upload.addEventListener('loadend', flushUpload);
    }

    if (_config.cancelToken || _config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = cancel => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
        request.abort();
        request = null;
      };

      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener('abort', onCanceled);
      }
    }

    const protocol = parseProtocol(_config.url);

    if (protocol && platform.protocols.indexOf(protocol) === -1) {
      reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
      return;
    }


    // Send the request
    request.send(requestData || null);
  });
};

const composeSignals = (signals, timeout) => {
  const {length} = (signals = signals ? signals.filter(Boolean) : []);

  if (timeout || length) {
    let controller = new AbortController();

    let aborted;

    const onabort = function (reason) {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : this.reason;
        controller.abort(err instanceof AxiosError ? err : new CanceledError(err instanceof Error ? err.message : err));
      }
    };

    let timer = timeout && setTimeout(() => {
      timer = null;
      onabort(new AxiosError(`timeout ${timeout} of ms exceeded`, AxiosError.ETIMEDOUT));
    }, timeout);

    const unsubscribe = () => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach(signal => {
          signal.unsubscribe ? signal.unsubscribe(onabort) : signal.removeEventListener('abort', onabort);
        });
        signals = null;
      }
    };

    signals.forEach((signal) => signal.addEventListener('abort', onabort));

    const {signal} = controller;

    signal.unsubscribe = () => utils$1.asap(unsubscribe);

    return signal;
  }
};

var composeSignals$1 = composeSignals;

const streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;

  if (!chunkSize || len < chunkSize) {
    yield chunk;
    return;
  }

  let pos = 0;
  let end;

  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};

const readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};

const readStream = async function* (stream) {
  if (stream[Symbol.asyncIterator]) {
    yield* stream;
    return;
  }

  const reader = stream.getReader();
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    await reader.cancel();
  }
};

const trackStream = (stream, chunkSize, onProgress, onFinish) => {
  const iterator = readBytes(stream, chunkSize);

  let bytes = 0;
  let done;
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e);
    }
  };

  return new ReadableStream({
    async pull(controller) {
      try {
        const {done, value} = await iterator.next();

        if (done) {
         _onFinish();
          controller.close();
          return;
        }

        let len = value.byteLength;
        if (onProgress) {
          let loadedBytes = bytes += len;
          onProgress(loadedBytes);
        }
        controller.enqueue(new Uint8Array(value));
      } catch (err) {
        _onFinish(err);
        throw err;
      }
    },
    cancel(reason) {
      _onFinish(reason);
      return iterator.return();
    }
  }, {
    highWaterMark: 2
  })
};

const isFetchSupported = typeof fetch === 'function' && typeof Request === 'function' && typeof Response === 'function';
const isReadableStreamSupported = isFetchSupported && typeof ReadableStream === 'function';

// used only inside the fetch adapter
const encodeText = isFetchSupported && (typeof TextEncoder === 'function' ?
    ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) :
    async (str) => new Uint8Array(await new Response(str).arrayBuffer())
);

const test = (fn, ...args) => {
  try {
    return !!fn(...args);
  } catch (e) {
    return false
  }
};

const supportsRequestStream = isReadableStreamSupported && test(() => {
  let duplexAccessed = false;

  const hasContentType = new Request(platform.origin, {
    body: new ReadableStream(),
    method: 'POST',
    get duplex() {
      duplexAccessed = true;
      return 'half';
    },
  }).headers.has('Content-Type');

  return duplexAccessed && !hasContentType;
});

const DEFAULT_CHUNK_SIZE = 64 * 1024;

const supportsResponseStream = isReadableStreamSupported &&
  test(() => utils$1.isReadableStream(new Response('').body));


const resolvers = {
  stream: supportsResponseStream && ((res) => res.body)
};

isFetchSupported && (((res) => {
  ['text', 'arrayBuffer', 'blob', 'formData', 'stream'].forEach(type => {
    !resolvers[type] && (resolvers[type] = utils$1.isFunction(res[type]) ? (res) => res[type]() :
      (_, config) => {
        throw new AxiosError(`Response type '${type}' is not supported`, AxiosError.ERR_NOT_SUPPORT, config);
      });
  });
})(new Response));

const getBodyLength = async (body) => {
  if (body == null) {
    return 0;
  }

  if(utils$1.isBlob(body)) {
    return body.size;
  }

  if(utils$1.isSpecCompliantForm(body)) {
    const _request = new Request(platform.origin, {
      method: 'POST',
      body,
    });
    return (await _request.arrayBuffer()).byteLength;
  }

  if(utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
    return body.byteLength;
  }

  if(utils$1.isURLSearchParams(body)) {
    body = body + '';
  }

  if(utils$1.isString(body)) {
    return (await encodeText(body)).byteLength;
  }
};

const resolveBodyLength = async (headers, body) => {
  const length = utils$1.toFiniteNumber(headers.getContentLength());

  return length == null ? getBodyLength(body) : length;
};

var fetchAdapter = isFetchSupported && (async (config) => {
  let {
    url,
    method,
    data,
    signal,
    cancelToken,
    timeout,
    onDownloadProgress,
    onUploadProgress,
    responseType,
    headers,
    withCredentials = 'same-origin',
    fetchOptions
  } = resolveConfig(config);

  responseType = responseType ? (responseType + '').toLowerCase() : 'text';

  let composedSignal = composeSignals$1([signal, cancelToken && cancelToken.toAbortSignal()], timeout);

  let request;

  const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
      composedSignal.unsubscribe();
  });

  let requestContentLength;

  try {
    if (
      onUploadProgress && supportsRequestStream && method !== 'get' && method !== 'head' &&
      (requestContentLength = await resolveBodyLength(headers, data)) !== 0
    ) {
      let _request = new Request(url, {
        method: 'POST',
        body: data,
        duplex: "half"
      });

      let contentTypeHeader;

      if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get('content-type'))) {
        headers.setContentType(contentTypeHeader);
      }

      if (_request.body) {
        const [onProgress, flush] = progressEventDecorator(
          requestContentLength,
          progressEventReducer(asyncDecorator(onUploadProgress))
        );

        data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
      }
    }

    if (!utils$1.isString(withCredentials)) {
      withCredentials = withCredentials ? 'include' : 'omit';
    }

    // Cloudflare Workers throws when credentials are defined
    // see https://github.com/cloudflare/workerd/issues/902
    const isCredentialsSupported = "credentials" in Request.prototype;
    request = new Request(url, {
      ...fetchOptions,
      signal: composedSignal,
      method: method.toUpperCase(),
      headers: headers.normalize().toJSON(),
      body: data,
      duplex: "half",
      credentials: isCredentialsSupported ? withCredentials : undefined
    });

    let response = await fetch(request);

    const isStreamResponse = supportsResponseStream && (responseType === 'stream' || responseType === 'response');

    if (supportsResponseStream && (onDownloadProgress || (isStreamResponse && unsubscribe))) {
      const options = {};

      ['status', 'statusText', 'headers'].forEach(prop => {
        options[prop] = response[prop];
      });

      const responseContentLength = utils$1.toFiniteNumber(response.headers.get('content-length'));

      const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
        responseContentLength,
        progressEventReducer(asyncDecorator(onDownloadProgress), true)
      ) || [];

      response = new Response(
        trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
          flush && flush();
          unsubscribe && unsubscribe();
        }),
        options
      );
    }

    responseType = responseType || 'text';

    let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || 'text'](response, config);

    !isStreamResponse && unsubscribe && unsubscribe();

    return await new Promise((resolve, reject) => {
      settle(resolve, reject, {
        data: responseData,
        headers: AxiosHeaders$1.from(response.headers),
        status: response.status,
        statusText: response.statusText,
        config,
        request
      });
    })
  } catch (err) {
    unsubscribe && unsubscribe();

    if (err && err.name === 'TypeError' && /Load failed|fetch/i.test(err.message)) {
      throw Object.assign(
        new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request),
        {
          cause: err.cause || err
        }
      )
    }

    throw AxiosError.from(err, err && err.code, config, request);
  }
});

const knownAdapters = {
  http: httpAdapter,
  xhr: xhrAdapter,
  fetch: fetchAdapter
};

utils$1.forEach(knownAdapters, (fn, value) => {
  if (fn) {
    try {
      Object.defineProperty(fn, 'name', {value});
    } catch (e) {
      // eslint-disable-next-line no-empty
    }
    Object.defineProperty(fn, 'adapterName', {value});
  }
});

const renderReason = (reason) => `- ${reason}`;

const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;

var adapters = {
  getAdapter: (adapters) => {
    adapters = utils$1.isArray(adapters) ? adapters : [adapters];

    const {length} = adapters;
    let nameOrAdapter;
    let adapter;

    const rejectedReasons = {};

    for (let i = 0; i < length; i++) {
      nameOrAdapter = adapters[i];
      let id;

      adapter = nameOrAdapter;

      if (!isResolvedHandle(nameOrAdapter)) {
        adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];

        if (adapter === undefined) {
          throw new AxiosError(`Unknown adapter '${id}'`);
        }
      }

      if (adapter) {
        break;
      }

      rejectedReasons[id || '#' + i] = adapter;
    }

    if (!adapter) {

      const reasons = Object.entries(rejectedReasons)
        .map(([id, state]) => `adapter ${id} ` +
          (state === false ? 'is not supported by the environment' : 'is not available in the build')
        );

      let s = length ?
        (reasons.length > 1 ? 'since :\n' + reasons.map(renderReason).join('\n') : ' ' + renderReason(reasons[0])) :
        'as no adapter specified';

      throw new AxiosError(
        `There is no suitable adapter to dispatch the request ` + s,
        'ERR_NOT_SUPPORT'
      );
    }

    return adapter;
  },
  adapters: knownAdapters
};

/**
 * Throws a `CanceledError` if cancellation has been requested.
 *
 * @param {Object} config The config that is to be used for the request
 *
 * @returns {void}
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError(null, config);
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 *
 * @returns {Promise} The Promise to be fulfilled
 */
function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  config.headers = AxiosHeaders$1.from(config.headers);

  // Transform request data
  config.data = transformData.call(
    config,
    config.transformRequest
  );

  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }

  const adapter = adapters.getAdapter(config.adapter || defaults$1.adapter);

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      config.transformResponse,
      response
    );

    response.headers = AxiosHeaders$1.from(response.headers);

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          config.transformResponse,
          reason.response
        );
        reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
      }
    }

    return Promise.reject(reason);
  });
}

const VERSION = "1.9.0";

const validators$1 = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((type, i) => {
  validators$1[type] = function validator(thing) {
    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});

const deprecatedWarnings = {};

/**
 * Transitional option validator
 *
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 *
 * @returns {function}
 */
validators$1.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return (value, opt, opts) => {
    if (validator === false) {
      throw new AxiosError(
        formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
        AxiosError.ERR_DEPRECATED
      );
    }

    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(
        formatMessage(
          opt,
          ' has been deprecated since v' + version + ' and will be removed in the near future'
        )
      );
    }

    return validator ? validator(value, opt, opts) : true;
  };
};

validators$1.spelling = function spelling(correctSpelling) {
  return (value, opt) => {
    // eslint-disable-next-line no-console
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  }
};

/**
 * Assert object's properties type
 *
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 *
 * @returns {object}
 */

function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== 'object') {
    throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator = schema[opt];
    if (validator) {
      const value = options[opt];
      const result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
    }
  }
}

var validator = {
  assertOptions,
  validators: validators$1
};

const validators = validator.validators;

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 *
 * @return {Axios} A new instance of Axios
 */
class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager$1(),
      response: new InterceptorManager$1()
    };
  }

  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        let dummy = {};

        Error.captureStackTrace ? Error.captureStackTrace(dummy) : (dummy = new Error());

        // slice off the Error: ... line
        const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, '') : '';
        try {
          if (!err.stack) {
            err.stack = stack;
            // match without the 2 top stack lines
          } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ''))) {
            err.stack += '\n' + stack;
          }
        } catch (e) {
          // ignore the case where "stack" is an un-writable property
        }
      }

      throw err;
    }
  }

  _request(configOrUrl, config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof configOrUrl === 'string') {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }

    config = mergeConfig(this.defaults, config);

    const {transitional, paramsSerializer, headers} = config;

    if (transitional !== undefined) {
      validator.assertOptions(transitional, {
        silentJSONParsing: validators.transitional(validators.boolean),
        forcedJSONParsing: validators.transitional(validators.boolean),
        clarifyTimeoutError: validators.transitional(validators.boolean)
      }, false);
    }

    if (paramsSerializer != null) {
      if (utils$1.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator.assertOptions(paramsSerializer, {
          encode: validators.function,
          serialize: validators.function
        }, true);
      }
    }

    // Set config.allowAbsoluteUrls
    if (config.allowAbsoluteUrls !== undefined) ; else if (this.defaults.allowAbsoluteUrls !== undefined) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }

    validator.assertOptions(config, {
      baseUrl: validators.spelling('baseURL'),
      withXsrfToken: validators.spelling('withXSRFToken')
    }, true);

    // Set config.method
    config.method = (config.method || this.defaults.method || 'get').toLowerCase();

    // Flatten headers
    let contextHeaders = headers && utils$1.merge(
      headers.common,
      headers[config.method]
    );

    headers && utils$1.forEach(
      ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
      (method) => {
        delete headers[method];
      }
    );

    config.headers = AxiosHeaders$1.concat(contextHeaders, headers);

    // filter out skipped interceptors
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
        return;
      }

      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    let promise;
    let i = 0;
    let len;

    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), undefined];
      chain.unshift.apply(chain, requestInterceptorChain);
      chain.push.apply(chain, responseInterceptorChain);
      len = chain.length;

      promise = Promise.resolve(config);

      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }

      return promise;
    }

    len = requestInterceptorChain.length;

    let newConfig = config;

    i = 0;

    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }

    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }

    i = 0;
    len = responseInterceptorChain.length;

    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }

    return promise;
  }

  getUri(config) {
    config = mergeConfig(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
}

// Provide aliases for supported request methods
utils$1.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method,
      url,
      data: (config || {}).data
    }));
  };
});

utils$1.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url,
        data
      }));
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});

var Axios$1 = Axios;

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @param {Function} executor The executor function.
 *
 * @returns {CancelToken}
 */
class CancelToken {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }

    let resolvePromise;

    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });

    const token = this;

    // eslint-disable-next-line func-names
    this.promise.then(cancel => {
      if (!token._listeners) return;

      let i = token._listeners.length;

      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });

    // eslint-disable-next-line func-names
    this.promise.then = onfulfilled => {
      let _resolve;
      // eslint-disable-next-line func-names
      const promise = new Promise(resolve => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);

      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };

      return promise;
    };

    executor(function cancel(message, config, request) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }

      token.reason = new CanceledError(message, config, request);
      resolvePromise(token.reason);
    });
  }

  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }

  /**
   * Subscribe to the cancel signal
   */

  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }

    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }

  /**
   * Unsubscribe from the cancel signal
   */

  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }

  toAbortSignal() {
    const controller = new AbortController();

    const abort = (err) => {
      controller.abort(err);
    };

    this.subscribe(abort);

    controller.signal.unsubscribe = () => this.unsubscribe(abort);

    return controller.signal;
  }

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
}

var CancelToken$1 = CancelToken;

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 *
 * @returns {Function}
 */
function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 *
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
function isAxiosError(payload) {
  return utils$1.isObject(payload) && (payload.isAxiosError === true);
}

const HttpStatusCode = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
};

Object.entries(HttpStatusCode).forEach(([key, value]) => {
  HttpStatusCode[value] = key;
});

var HttpStatusCode$1 = HttpStatusCode;

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 *
 * @returns {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  const context = new Axios$1(defaultConfig);
  const instance = bind(Axios$1.prototype.request, context);

  // Copy axios.prototype to instance
  utils$1.extend(instance, Axios$1.prototype, context, {allOwnKeys: true});

  // Copy context to instance
  utils$1.extend(instance, context, null, {allOwnKeys: true});

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
const axios = createInstance(defaults$1);

// Expose Axios class to allow class inheritance
axios.Axios = Axios$1;

// Expose Cancel & CancelToken
axios.CanceledError = CanceledError;
axios.CancelToken = CancelToken$1;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData;

// Expose AxiosError class
axios.AxiosError = AxiosError;

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};

axios.spread = spread;

// Expose isAxiosError
axios.isAxiosError = isAxiosError;

// Expose mergeConfig
axios.mergeConfig = mergeConfig;

axios.AxiosHeaders = AxiosHeaders$1;

axios.formToJSON = thing => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);

axios.getAdapter = adapters.getAdapter;

axios.HttpStatusCode = HttpStatusCode$1;

axios.default = axios;

module.exports = axios;
//# sourceMappingURL=axios.cjs.map


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EIJEViewType = void 0;
var EIJEViewType;
(function (EIJEViewType) {
    EIJEViewType["TABLE"] = "table";
    EIJEViewType["LIST"] = "list";
})(EIJEViewType = exports.EIJEViewType || (exports.EIJEViewType = {}));


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

/**
 * Servicio para manejar notificaciones usando Flashy.js
 * @author trystan4861
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationService = void 0;
const vscode = __webpack_require__(1);
class NotificationService {
    constructor() {
        this._webviewPanel = null;
    }
    static getInstance() {
        if (!NotificationService._instance) {
            NotificationService._instance = new NotificationService();
        }
        return NotificationService._instance;
    }
    /**
     * Establece el panel de webview para enviar notificaciones
     * @param panel Panel de webview activo
     */
    setWebviewPanel(panel) {
        this._webviewPanel = panel;
    }
    /**
     * Muestra un mensaje informativo usando Flashy
     * @param message Mensaje a mostrar
     * @param isSaveMessage Indica si es un mensaje de guardado
     */
    showInformationMessage(message, isSaveMessage = false) {
        this.sendFlashyNotification(message, 'success', 3000);
    }
    /**
     * Muestra un mensaje de error usando Flashy
     * @param message Mensaje de error a mostrar
     */
    showErrorMessage(message) {
        this.sendFlashyNotification(message, 'error', 0); // 0 = sin auto-cierre
    }
    /**
     * Muestra un mensaje de advertencia usando Flashy
     * @param message Mensaje de advertencia a mostrar
     */
    showWarningMessage(message) {
        this.sendFlashyNotification(message, 'warning', 3000);
    }
    /**
     * Envía una notificación Flashy al webview
     * @param message Mensaje a mostrar
     * @param type Tipo de notificación (success, error, warning, info)
     * @param duration Duración en milisegundos (0 = sin auto-cierre)
     */
    sendFlashyNotification(message, type, duration) {
        if (!this._webviewPanel) {
            // Fallback a notificaciones nativas de VSCode si no hay webview
            switch (type) {
                case 'success':
                    vscode.window.showInformationMessage(message);
                    break;
                case 'error':
                    vscode.window.showErrorMessage(message);
                    break;
                case 'warning':
                    vscode.window.showWarningMessage(message);
                    break;
                default:
                    vscode.window.showInformationMessage(message);
            }
            return;
        }
        this._webviewPanel.webview.postMessage({
            command: 'showFlashyNotification',
            message: message,
            type: type,
            duration: duration
        });
    }
}
exports.NotificationService = NotificationService;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const vscode = __webpack_require__(1);
const eije_editor_provider_1 = __webpack_require__(2);
const eije_configuration_1 = __webpack_require__(6);
const i18n_service_1 = __webpack_require__(10);
async function activate(context) {
    // Initialize the i18n service
    const i18n = i18n_service_1.I18nService.getInstance(context);
    // Wait for translations to load
    await i18n.waitForLoad();
    // Set language based on VS Code UI language
    const vscodeLanguage = vscode.env.language;
    if (vscodeLanguage.startsWith('es')) {
        i18n.setLanguage('es');
    }
    else {
        i18n.setLanguage('en');
    }
    if (eije_configuration_1.EIJEConfiguration.WORKSPACE_FOLDERS) {
        let myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        myStatusBarItem.command = 'ei18n-json-editor';
        myStatusBarItem.text = `$(symbol-string) ${i18n.t('extension.statusBar')}`;
        myStatusBarItem.show();
    }
    // Al hacer clic en el icono de la barra de actividad, queremos que se abra directamente el editor
    // Mantenemos un TreeDataProvider mínimo para mostrar algo en la vista
    class SimpleTreeDataProvider {
        constructor() {
            this._onDidChangeTreeData = new vscode.EventEmitter();
            this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        }
        getTreeItem(element) {
            return new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.None);
        }
        getChildren(element) {
            if (element) {
                return Promise.resolve([]);
            }
            return Promise.resolve([i18n.t('extension.openingEditor')]);
        }
    }
    const treeView = vscode.window.createTreeView('trystan4861-eije-view', {
        treeDataProvider: new SimpleTreeDataProvider(),
        showCollapseAll: false
    });
    // Cuando la vista se vuelve visible, automáticamente abrir el editor
    treeView.onDidChangeVisibility(e => {
        if (e.visible) {
            // Pequeño retraso para asegurar que todo esté listo
            setTimeout(() => {
                vscode.commands.executeCommand('ei18n-json-editor').then(() => {
                    // Opcionalmente, ocultar la vista después de abrir el editor
                    vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
                });
            }, 100);
        }
    });
    context.subscriptions.push(treeView);
    context.subscriptions.push(eije_editor_provider_1.EIJEEditorProvider.register(context));
}
exports.activate = activate;

})();

var __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=extension.js.map