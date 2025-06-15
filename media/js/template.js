/**
 * Template JavaScript para la extensión i18n JSON Editor
 * Maneja la comunicación entre la interfaz web y VSCode, 
 * gestiona el estado de traducciones vacías y controla la interfaz de usuario
 * @author trystan4861
 */

var vscode;
var hasUnsavedChanges = false;
var allowEmptyTranslations = false; // Variable global para almacenar la configuración
var currentWorkspaceFolder = ''; // Variable para rastrear la carpeta de trabajo actual

(function () {
  vscode = acquireVsCodeApi();
  
  // Deshabilitar el botón de guardado por defecto
  window.addEventListener("DOMContentLoaded", () => {
    const saveButton = document.getElementById("save-button");
    if (saveButton) {
      saveButton.disabled = true;
    }
    tippy('[title]',{
      content: (reference) => reference.getAttribute('title'),      
    });
  });

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
      case "content":
        document.getElementById("content-view").innerHTML = message.render;
        // Actualizar el contador de traducciones pendientes después de renderizar
        checkEmptyTranslations();
        break;
      case "emptyTranslationsFound":
        // Actualizar la información de traducciones vacías
        const emptyTranslations = message.emptyTranslations;
        const filesHaveEmptyTranslations = message.hasEmptyTranslations; // true si hay traducciones vacías Y no se permiten
        const allowEmptyFlag = message.allowEmptyTranslations; // true si se permiten traducciones vacías
        const hasAnyEmptyTranslations = message.hasAnyEmptyTranslations; // true si hay alguna traducción vacía
        const totalEmptyCount = message.totalEmptyCount;
        
        // Actualizar contador con el TOTAL de traducciones vacías en todo el archivo
        const emptyCounter = document.getElementById('missing-translations-counter');
        if (emptyCounter) {
          emptyCounter.textContent = totalEmptyCount;
        }
        
        // Mostrar u ocultar el botón según si hay traducciones vacías en todo el conjunto de datos
        // Y si esas traducciones vacías son un error o no
        const dangerBtn = document.getElementById('btn-warning-translations');
        if (dangerBtn) {
          if (filesHaveEmptyTranslations) {
            // Si hay traducciones vacías y no se permiten, mostrar botón rojo (peligro)
            dangerBtn.style.display = 'inline-block';
            dangerBtn.classList.remove('btn-warning');
            dangerBtn.classList.add('btn-danger');
          } else if (hasAnyEmptyTranslations && allowEmptyFlag) {
            // Si hay traducciones vacías pero están permitidas, mostrar botón amarillo (advertencia)
            dangerBtn.style.display = 'inline-block';
            dangerBtn.classList.remove('btn-danger');
            dangerBtn.classList.add('btn-warning');
          } else {
            // Si no hay traducciones vacías, ocultar botón
            dangerBtn.style.display = 'none';
          }
        }
        
        // Solo actualizar el botón de guardar si hay cambios pendientes
        // Si no hay cambios pendientes, no interferir con el flujo de colores del guardado
        if (hasUnsavedChanges) {
          const saveButtonUpdate = document.getElementById("save-button");
          if (saveButtonUpdate) {
            if (hasAnyEmptyTranslations && !allowEmptyFlag) {
              // Si hay traducciones vacías y NO se permiten, usar rojo (error)
              saveButtonUpdate.classList.remove("btn-vscode", "btn-success", "btn-warning");
              saveButtonUpdate.classList.add("btn-danger");
            } else {
              // Si no hay traducciones vacías O se permiten las vacías, usar amarillo (cambios pendientes)
              saveButtonUpdate.classList.remove("btn-vscode", "btn-success", "btn-danger");
              saveButtonUpdate.classList.add("btn-warning");
            }
          }
        }
        break;
        
      case "emptyTranslationsInfo":
        // Actualizar la información de traducciones vacías
        emptyTranslationsInfo = message.data;
        const counter = document.getElementById('missing-translations-counter');
        if (counter) {
          counter.textContent = emptyTranslationsInfo.count;
          
          // Mostrar u ocultar el botón según si hay traducciones pendientes
          const warningBtn = document.getElementById('btn-warning-translations');
          if (warningBtn) {
            warningBtn.style.display = emptyTranslationsInfo.count > 0 ? 'inline-block' : 'none';
          }
        }
        break;
        
      case "initWorkspaceFolders":
        // Inicializar el desplegable de carpetas de trabajo
        console.log('Received initWorkspaceFolders message:', message);
        initializeWorkspaceFolderSelector(message.folders, message.currentFolder);
        break;
        
      case "workspaceFolderChanged":
        // Actualizar la carpeta actual después del cambio
        currentWorkspaceFolder = message.folderName;
        hasUnsavedChanges = false;
        updateSaveButtonStyle();
        break;
        
      case "restoreWorkspaceFolderSelection":
        // Restaurar la selección anterior en el selector de carpetas
        const selector = document.getElementById('workspace-folder-selector');
        if (selector) {
          // Si hay una carpeta actual, seleccionarla
          if (currentWorkspaceFolder) {
            for (let i = 0; i < selector.options.length; i++) {
              if (selector.options[i].value === currentWorkspaceFolder) {
                selector.selectedIndex = i;
                break;
              }
            }
          } else {
            // Si no hay carpeta actual, seleccionar el placeholder
            selector.selectedIndex = 0;
          }
        }
        break;

      case "folders":
        // Legacy code - no longer needed as we use workspace folder selector
        break;

      case "update":
        const t = message.translation;
        if (t) {
          const el = document.getElementById(`input-key-${t.id}`);
          el.value = t.key;
          t.valid ? el.classList.remove("is-invalid") : el.classList.add("is-invalid");
          document.getElementById(`input-key-${t.id}-feedback`).innerText = t.error;

          const select = document.getElementById(`select-key-${t.id}`);
          if (select) {
            select.innerHTML = t.key === "" ? "&nbsp;" : t.key;
          }
        }
        break;
        
      case "saveResult":
        // Manejar el resultado del guardado (éxito o error)
        const saveButtonResult = document.getElementById("save-button");
        
        // Verificar si hay traducciones vacías
        const emptyTranslationsCounter = document.getElementById('missing-translations-counter');
        const pendingEmptyTranslations = emptyTranslationsCounter && 
                                     parseInt(emptyTranslationsCounter.textContent) > 0;
        
        // Verificar si se permiten traducciones vacías (viene del backend)
        let allowEmptyTrans = message.allowEmptyTranslations;
        
        // Si el guardado tuvo éxito
        if (message.success) {
            // Si hay traducciones vacías y NO se permiten, notificar al backend
            if (pendingEmptyTranslations && !allowEmptyTrans) {
                vscode.postMessage({ 
                    command: "notifyEmptyTranslations", 
                    count: parseInt(emptyTranslationsCounter.textContent),
                    // Indicar explícitamente que se debe cancelar el mensaje de éxito
                    cancelSuccessMessage: true
                });
            } else {
                // Si fue exitoso (y no hay traducciones vacías O se permiten), mostrar success
                saveButtonResult.classList.remove("btn-vscode", "btn-warning", "btn-danger");
                saveButtonResult.classList.add("btn-success");
                saveButtonResult.disabled = false;
                
                // Después de 2.5 segundos, volver al estado normal
                setTimeout(() => {
                    saveButtonResult.classList.remove("btn-success");
                    saveButtonResult.classList.add("btn-vscode");
                    hasUnsavedChanges = false;
                    saveButtonResult.disabled = true; // Deshabilitar cuando vuelve a estilo primary
                }, 2500);
            }
        } else {
          // Si hubo error o hay traducciones vacías
          // Mostrar estado de error
          saveButtonResult.classList.remove("btn-vscode", "btn-warning", "btn-success");
          saveButtonResult.classList.add("btn-danger");
          saveButtonResult.disabled = false;
          
          // Después de 2 segundos, volver al estado de advertencia
          setTimeout(() => {
            saveButtonResult.classList.remove("btn-danger");
            saveButtonResult.classList.add("btn-warning");
            saveButtonResult.disabled = false; // Mantener habilitado con advertencia
            // Mantenemos hasUnsavedChanges como true porque hay problemas
            hasUnsavedChanges = true;
          }, 2000);
        }
        break;
      case "configurationUpdate":
        // Actualizar configuración global
        allowEmptyTranslations = message.allowEmptyTranslations;
        
        // Revalidar el estado actual después de recibir la configuración
        checkEmptyTranslations();
        break;
        
      case "unsavedChanges":
        // Actualizar el estado de cambios sin guardar
        hasUnsavedChanges = message.hasUnsavedChanges;
        updateSaveButtonStyle();
        break;
      case "showFlashyNotification":
        showFlashyNotification(message.message, message.type, message.duration);
        break;
    }
  });
  setTimeout(() => {
    refresh();
    // Actualizar el contador de traducciones pendientes inicialmente
    checkEmptyTranslations();
    
    // Asegurarnos de que el botón de guardado esté deshabilitado inicialmente
    const saveButtonInit = document.getElementById("save-button");
    if (saveButtonInit) {
      saveButtonInit.disabled = true;
    }
  }, 200);
})();

// Variable global para almacenar información de traducciones vacías
let emptyTranslationsInfo = {
  count: 0,
  totalPages: 0,
  emptyByPage: {},
  currentIndex: -1
};

// Función para comprobar todas las traducciones vacías del sistema
function checkEmptyTranslations() {
  // Obtener la página actual
  const currentPageElement = document.querySelector('.page-item.active .page-link');
  const currentPage = currentPageElement ? parseInt(currentPageElement.textContent) : 1;
  
  // Solicitar la información completa de traducciones vacías al servidor
  // El servidor responderá con emptyTranslationsFound que incluye hasEmptyTranslations
  vscode.postMessage({ command: "checkEmptyTranslations", currentPage });
}

// Función para desplazarse a la siguiente traducción vacía
function scrollToNextEmptyTranslation() {
  // Siempre buscamos en todo el archivo, no solo en la página actual
  // Enviamos un mensaje al backend para navegar a la siguiente página con traducciones vacías
  vscode.postMessage({ command: "navigateToNextEmptyTranslation" });
}



function add() {
  vscode.postMessage({ command: "add" });
  hasUnsavedChanges = true;
  updateSaveButtonStyle();
}

function initializeWorkspaceFolderSelector(folders, currentFolder) {
  console.log('initializeWorkspaceFolderSelector called with:', { folders, currentFolder });
  
  const selector = document.getElementById('workspace-folder-selector');
  if (!selector) {
    console.error('workspace-folder-selector not found in DOM');
    return;
  }
  
  // Obtener la traducción del placeholder
  const placeholderText = document.body.getAttribute('data-i18n-select-workspace-folder') || 'Select workspace folder';
  
  // Limpiar opciones existentes
  selector.innerHTML = '';
  
  // Agregar la opción de placeholder con las propiedades correctas
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholderText;
  placeholderOption.disabled = true;
  placeholderOption.hidden = true;
  placeholderOption.selected = !currentFolder; // Seleccionar si no hay carpeta actual
  placeholderOption.classList.add('d-none');
  selector.appendChild(placeholderOption);
  
  if (!folders || folders.length === 0) {
    console.log('No folders provided or empty folders array');
    // Ocultar el selector si no hay carpetas configuradas
    selector.style.display = 'none';
    return;
  }
  
  // Agregar opciones para cada carpeta de trabajo
  folders.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder.name;
    option.textContent = folder.name;
    if (folder.name === currentFolder) {
      option.selected = true;
      currentWorkspaceFolder = folder.name;
    }
    selector.appendChild(option);
  });
  
  // Si no hay carpeta seleccionada, mantener el placeholder seleccionado
  if (!currentFolder) {
    selector.selectedIndex = 0; // Seleccionar el placeholder
    currentWorkspaceFolder = ''; // No hay carpeta actual
  }
  
  // Mostrar el selector siempre que haya carpetas (incluso si es solo una para mostrar cuál está activa)
  selector.style.display = 'block';
  
  console.log('Workspace folder selector initialized with', folders.length, 'folders. Current:', currentFolder);
}

function switchWorkspaceFolder(el) {
  const newFolder = el.value;
  
  // Si no hay valor seleccionado, no hacer nada
  if (!newFolder) {
    return;
  }
  
  // Si no hay cambios o es la misma carpeta, cambiar directamente
  if (!hasUnsavedChanges || newFolder === currentWorkspaceFolder) {
    vscode.postMessage({ command: "switchWorkspaceFolder", folderName: newFolder });
    return;
  }
  
  // En lugar de usar confirm(), usamos un enfoque basado en elementos DOM
  // para mostrar opciones al usuario
  showCustomConfirmDialog(
    "Tienes cambios sin guardar. ¿Qué deseas hacer?",
    [
      {
        text: "Guardar y cambiar",
        action: () => {
          vscode.postMessage({ command: "saveAndSwitchWorkspaceFolder", folderName: newFolder });
        }
      },
      {
        text: "Descartar cambios",
        action: () => {
          showCustomConfirmDialog(
            "¿Estás seguro de que quieres descartar los cambios sin guardar?",
            [
              {
                text: "Sí, descartar",
                action: () => {
                  vscode.postMessage({ command: "discardAndSwitchWorkspaceFolder", folderName: newFolder });
                }
              },
              {
                text: "No, cancelar",
                action: () => {
                  el.value = currentWorkspaceFolder || '';
                }
              }
            ]
          );
        }
      },
      {
        text: "Cancelar",
        action: () => {
          el.value = currentWorkspaceFolder || '';
        }
      }
    ]
  );
}

function mark(id) {
  vscode.postMessage({ command: "mark", id: id });
}

/**
 * Muestra un diálogo de confirmación personalizado que funciona dentro del sandbox
 * @param {string} message - Mensaje a mostrar
 * @param {Array<{text: string, action: Function}>} buttons - Botones y sus acciones
 */
function showCustomConfirmDialog(message, buttons) {
  // Crear el fondo oscuro
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '1000';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';

  // Crear el diálogo
  const dialog = document.createElement('div');
  dialog.style.backgroundColor = 'var(--vscode-editor-background)';
  dialog.style.color = 'var(--vscode-editor-foreground)';
  dialog.style.padding = '20px';
  dialog.style.borderRadius = '5px';
  dialog.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
  dialog.style.maxWidth = '400px';
  dialog.style.width = '100%';

  // Agregar el mensaje
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  messageElement.style.marginBottom = '20px';
  dialog.appendChild(messageElement);

  // Contenedor de botones
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'flex-end';
  buttonContainer.style.gap = '10px';

  // Agregar botones
  buttons.forEach(button => {
    const buttonElement = document.createElement('button');
    buttonElement.textContent = button.text;
    buttonElement.className = 'btn btn-vscode';
    buttonElement.addEventListener('click', () => {
      document.body.removeChild(overlay);
      button.action();
    });
    buttonContainer.appendChild(buttonElement);
  });

  dialog.appendChild(buttonContainer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

function navigate(page) {
  vscode.postMessage({ command: "navigate", page: page });
}

function pageSize(el) {
  vscode.postMessage({ command: "pageSize", value: el.value });
}

function refresh() {
  vscode.postMessage({ command: "refresh" });
}

function reload() {
  vscode.postMessage({ command: "reload" });
  hasUnsavedChanges = false;
  const saveButtonReload = document.getElementById("save-button");
  saveButtonReload.classList.remove("btn-warning", "btn-success", "btn-danger");
  saveButtonReload.classList.add("btn-vscode");
  saveButtonReload.disabled = true; // Deshabilitar cuando se restablece al estilo primary
}

function discardChanges() {
  // Usar el diálogo personalizado en lugar de confirm()
  showCustomConfirmDialog(
    "¿Estás seguro de que quieres descartar todos los cambios sin guardar?",
    [
      {
        text: "Sí, descartar",
        action: () => {
          vscode.postMessage({ command: "discardChanges" });
          hasUnsavedChanges = false;
          updateSaveButtonStyle();
        }
      },
      {
        text: "No, cancelar",
        action: () => {
          // No hacer nada, simplemente cerrar el diálogo
        }
      }
    ]
  );
}

function remove(id) {
  vscode.postMessage({ command: "remove", id: id });
  hasUnsavedChanges = true;
  updateSaveButtonStyle();
}

function save() {
  // Verificar si hay traducciones vacías
  const emptyTranslationsCounter = document.getElementById('missing-translations-counter');
  const hasMissingTranslations = emptyTranslationsCounter && 
                              parseInt(emptyTranslationsCounter.textContent) > 0;
  
  // Enviar el comando con información adicional sobre traducciones vacías
  vscode.postMessage({ 
    command: "save", 
    hasEmptyTranslations: hasMissingTranslations,
    emptyCount: hasMissingTranslations ? parseInt(emptyTranslationsCounter.textContent) : 0,
    // Indicar si deben mostrarse mensajes de error relacionados con traducciones vacías
    showEmptyTranslationsError: hasMissingTranslations,
    // Indicar explícitamente que se debe cancelar el mensaje de éxito si hay traducciones vacías
    cancelSuccessMessage: hasMissingTranslations
  });
  
  // Cambiar el botón a un estado de "procesando"
  const saveButtonSave = document.getElementById("save-button");
  saveButtonSave.disabled = true;
  saveButtonSave.classList.remove("btn-vscode", "btn-warning", "btn-success", "btn-danger");
  saveButtonSave.classList.add("btn-secondary"); // Estilo de procesando
}

// Función para actualizar el estilo del botón de guardado según si hay cambios
function updateSaveButtonStyle() {
  const saveButtonStyle = document.getElementById("save-button");
  const discardButtonStyle = document.getElementById("discard-button");
  
  if (hasUnsavedChanges) {
    // Verificar si hay traducciones vacías y si están permitidas
    const emptyTranslationsCounter = document.getElementById('missing-translations-counter');
    const hasMissingTranslations = emptyTranslationsCounter && 
                                parseInt(emptyTranslationsCounter.textContent) > 0;
    
    // Usar la variable global de configuración
    // allowEmptyTranslations ya está definida globalmente
    
    saveButtonStyle.classList.remove("btn-vscode", "btn-success", "btn-danger");
    
    if (hasMissingTranslations && !allowEmptyTranslations) {
      // Si hay traducciones vacías y NO se permiten, usar rojo (error)
      saveButtonStyle.classList.add("btn-danger");
    } else {
      // Si no hay traducciones vacías O se permiten las vacías, usar amarillo (cambios pendientes)
      saveButtonStyle.classList.add("btn-warning");
    }
    saveButtonStyle.disabled = false; // Habilitar inmediatamente cuando hay cambios
    
    // Mostrar el botón de descartar cambios
    discardButtonStyle.style.display = "inline-block";
  } else {
    // Cuando no hay cambios, volver al estado normal (azul) y deshabilitar
    saveButtonStyle.classList.remove("btn-warning", "btn-success", "btn-danger");
    saveButtonStyle.classList.add("btn-vscode");
    saveButtonStyle.disabled = true; // Deshabilitar cuando no hay cambios
    
    // Ocultar el botón de descartar cambios
    discardButtonStyle.style.display = "none";
  }
}
function search(el) {
  vscode.postMessage({ command: "search", value: el.value });
}

function select(id) {
  vscode.postMessage({ command: "select", id: id });
}

function sort(column, ascending) {
  vscode.postMessage({ command: "sort", column: column, ascending: ascending });
}

function newLanguage() {
  // Instead of using prompt(), send a command to show input box
  vscode.postMessage({ command: "showNewLanguageInput" });
}

function switchView() {
  const el = document.getElementById("icon-switch-view");
  const isTableView = el.classList.contains("fa-table-rows");
  vscode.postMessage({
    command: "switch-view",
    view: isTableView ? "list" : "table",
  });
  isTableView ? el.classList.replace("fa-table-rows", "fa-table-cells") : el.classList.replace("fa-table-cells", "fa-table-rows");
}

function updateInput(el, id, language = "") {
  const wasEmpty = el.classList.contains('empty-translation');
  const isEmpty = el.value.trim() === '';
  
  // Actualizar clase empty-translation según si el campo está vacío o no
  if (isEmpty) {
    el.classList.add('empty-translation');
  } else {
    el.classList.remove('empty-translation');
  }
  
  // Marcar que hay cambios no guardados
  hasUnsavedChanges = true;
  updateSaveButtonStyle();
  
  // Actualizar manualmente el contador si cambia el estado de vacío
  if (wasEmpty && !isEmpty) {
    // Si estaba vacío y ahora tiene contenido, decrementar el contador
    const counter = document.getElementById('missing-translations-counter');
    if (counter && counter.textContent) {
      const currentCount = parseInt(counter.textContent);
      if (!isNaN(currentCount) && currentCount > 0) {
        counter.textContent = currentCount - 1;
        
        // Si el contador llega a cero, ocultar el botón de advertencia
        if (currentCount - 1 === 0) {
          const dangerBtn = document.getElementById('btn-warning-translations');
          if (dangerBtn) {
            dangerBtn.style.display = 'none';
          }
        }
      }
    }
  } else if (!wasEmpty && isEmpty) {
    // Si tenía contenido y ahora está vacío, incrementar el contador
    const counter = document.getElementById('missing-translations-counter');
    if (counter && counter.textContent) {
      const currentCount = parseInt(counter.textContent);
      if (!isNaN(currentCount)) {
        counter.textContent = currentCount + 1;
        
        // Mostrar el botón de advertencia
        const dangerBtn = document.getElementById('btn-warning-translations');
        if (dangerBtn) {
          dangerBtn.style.display = 'inline-block';
        }
      }
    }
  }
  
  // Enviar el mensaje de actualización al backend
  vscode.postMessage({ command: "update", id: id, value: el.value, language: language });
  
  // También solicitar una actualización completa de traducciones vacías
  // para mantener sincronizado el contador en ambos lados
  checkEmptyTranslations();
}

function translateInput(el, id, language = "") {
  vscode.postMessage({ command: "translate", id: id, language: language });
}



function toggleColumn(language, visible) {
  vscode.postMessage({ command: "toggleColumn", language: language, visible: visible });
}

// Función para mostrar/ocultar el selector de columnas
function toggleColumnSelector() {
  const panel = document.getElementById("columnSelectorContent");
  if (panel) {
    if (panel.style.display === "none") {
      panel.style.display = "block";
    } else {
      panel.style.display = "none";
    }
  }
}

// Función para aplicar cambios en la selección de columnas
function applyColumnChanges() {
  const languages = document.querySelectorAll('input[id^="column-"]:not([disabled])');
  
  // Crear arrays para enviar todos los cambios de una vez
  const columnsToShow = [];
  const columnsToHide = [];
  
  languages.forEach(checkbox => {
    const language = checkbox.id.replace('column-', '');
    if (language !== 'key' && language !== 'en') { // 'en' no se puede ocultar
      if (checkbox.checked) {
        columnsToShow.push(language);
      } else {
        columnsToHide.push(language);
      }
    }
  });
  
  // Enviar mensaje con todos los cambios
  vscode.postMessage({ 
    command: "updateColumnVisibility", 
    columnsToShow: columnsToShow,
    columnsToHide: columnsToHide
  });
  
  document.getElementById('apply-columns-btn').disabled = true;
}

// Función para mostrar/ocultar el campo de búsqueda
function toggleSearch() {
  const searchContainer = document.getElementById('search-container');
  const isVisible = searchContainer.style.display !== 'none';
  
  searchContainer.style.display = isVisible ? 'none' : 'inline-block';
  
  // Si se muestra el campo, enfocar el input
  if (!isVisible) {
    document.getElementById('search-input').focus();
  }
}

// Función para mostrar/ocultar el botón de limpiar
function toggleClearButton(el) {
  const clearBtn = document.getElementById('clear-search-btn');
  clearBtn.style.display = el.value.length > 0 ? 'inline-block' : 'none';
}

// Función para limpiar el campo de búsqueda
function clearSearch() {
  const searchInput = document.getElementById('search-input');
  searchInput.value = '';
  search(searchInput); // Actualizar la búsqueda con el valor vacío
  toggleClearButton(searchInput); // Ocultar el botón de limpiar
  searchInput.focus(); // Mantener el foco en el campo
}

/**
 * Muestra una notificación usando Flashy.js
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, warning, info)
 * @param {number} duration - Duración en milisegundos (0 = sin auto-cierre)
 */
function showFlashyNotification(message, type, duration) {
  // Detectar si el tema de VSCode es oscuro
  const isDarkTheme = document.body.classList.contains('vscode-dark') || 
                     document.body.classList.contains('vscode-high-contrast') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Mapear iconos usando FontAwesome 6 Pro
  const iconMap = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error: '<i class="fa-solid fa-circle-exclamation"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
    info: '<i class="fa-solid fa-circle-info"></i>',
    default: '<i class="fa-solid fa-comment"></i>'
  };
  
  // Configurar opciones de Flashy
  const options = {
    type: type,
    position: 'bottom-right',
    duration: duration,
    closable: true,
    animation: 'slide',
    theme: isDarkTheme ? 'dark' : 'light',
    icon: iconMap[type] || iconMap.default
  };
  
  // Mostrar la notificación
  if (typeof window.flashy === 'function') {
    window.flashy(message, options);
  } else {
    // Fallback si Flashy no está disponible
    console.warn('Flashy no está disponible, usando console.log como fallback');
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

