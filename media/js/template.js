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
    initTooltips();
    
    // Cerrar el menú contextual al hacer clic en cualquier parte de la página
    document.addEventListener('click', function(event) {
      const contextMenu = document.getElementById('language-context-menu');
      if (contextMenu && contextMenu.style.display === 'block') {
        // Si el clic no fue dentro del menú contextual, cerrarlo
        if (!contextMenu.contains(event.target)) {
          hideContextMenu();
        }
      }
    });
  });

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
      case "content":
        document.getElementById("content-view").innerHTML = message.render;
        // Actualizar el contador de traducciones pendientes después de renderizar
        checkEmptyTranslations();
        // Reinicializar tooltips después de actualizar el contenido
        initTooltips();
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
        
      case "showCreateI18nPrompt":
        showCreateI18nPrompt(message.title, message.text);
        break;
        
      case "showNoWorkspaceFoldersMessage":
        showNoWorkspaceFoldersMessage();
        break;
        
      case "getPreferencesResult":
        // Mostrar el formulario de preferencias con la configuración recibida
        showPreferencesForm(message.config);
        break;
        
      case "savePreferencesResult":
        // Manejar el resultado del guardado de preferencias
        if (message.success) {
          showFlashyNotification('Configuración guardada correctamente', 'success', 2000);
        } else {
          showFlashyNotification(`Error al guardar configuración: ${message.error}`, 'error', 3000);
        }
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
 * Muestra un diálogo de confirmación personalizado utilizando SweetAlert2
 * @param {string} message - Mensaje a mostrar
 * @param {Array<{text: string, action: Function}>} buttons - Botones y sus acciones
 */
function showCustomConfirmDialog(message, buttons) {
  // Detectar si el tema de VSCode es oscuro
  const isDarkTheme = document.body.classList.contains('vscode-dark') || 
                     document.body.classList.contains('vscode-high-contrast') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Configurar opciones de SweetAlert2
  const swalOptions = {
    title: '',
    text: message,
    icon: 'question',
    showCancelButton: false,
    showConfirmButton: false,
    focusConfirm: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: true,
    customClass: {
      popup: 'swal-vscode-popup',
      title: 'swal-vscode-title',
      content: 'swal-vscode-content',
      actions: 'swal-vscode-actions'
    },
    // Adaptar colores al tema de VSCode
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)'
  };
  
  // Crear botones personalizados
  const footerHtml = buttons.map((button, index) => {
    return `<button id="swal-custom-btn-${index}" class="btn btn-vscode">${button.text}</button>`;
  }).join('');
  
  // Agregar los botones al footer
  swalOptions.footer = `<div class="swal-vscode-footer">${footerHtml}</div>`;
  
  // Mostrar el diálogo
  Swal.fire(swalOptions).then(() => {
    // Este bloque se ejecuta cuando se cierra el diálogo
  });
  
  // Agregar event listeners a los botones personalizados
  buttons.forEach((button, index) => {
    setTimeout(() => {
      const btnElement = document.getElementById(`swal-custom-btn-${index}`);
      if (btnElement) {
        btnElement.addEventListener('click', () => {
          Swal.close();
          button.action();
        });
      }
    }, 100); // Pequeño retraso para asegurar que los elementos estén en el DOM
  });
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
    // Fallback si Flashy no está disponible - no hacer nada
  }
}

// Variable para almacenar el idioma seleccionado en el menú contextual
let contextMenuLanguage = '';

/**
 * Muestra el menú contextual para una columna de idioma
 * @param {Event} event - Evento de clic derecho
 * @param {string} language - Idioma de la columna
 */
function showLanguageContextMenu(event, language) {
  event.preventDefault();
  
  // Guardar el idioma seleccionado
  contextMenuLanguage = language;
  
  // Obtener el menú contextual
  const contextMenu = document.getElementById('language-context-menu');
  
  // Posicionar el menú en la ubicación del clic
  contextMenu.style.left = `${event.pageX}px`;
  contextMenu.style.top = `${event.pageY}px`;
  
  // Mostrar el menú
  contextMenu.style.display = 'block';
  
  // Agregar evento para cerrar el menú al hacer clic fuera de él
  document.addEventListener('click', hideContextMenu);
  
  // Evitar que el evento se propague
  event.stopPropagation();
}

/**
 * Oculta el menú contextual
 */
function hideContextMenu() {
  const contextMenu = document.getElementById('language-context-menu');
  if (contextMenu) {
    contextMenu.style.display = 'none';
  }
  document.removeEventListener('click', hideContextMenu);
}

/**
 * Ordena la columna de idioma alfabéticamente
 * @param {boolean} ascending - Indica si el orden es ascendente o descendente
 */
function sortLanguageColumn(ascending) {
  if (contextMenuLanguage) {
    sort(contextMenuLanguage, ascending);
  }
}

/**
 * Oculta la columna de idioma seleccionada
 */
function hideLanguageColumn() {
  if (contextMenuLanguage) {
    // Usar directamente el comando toggleColumn con visible=false
    vscode.postMessage({
      command: "toggleColumn",
      language: contextMenuLanguage,
      visible: false
    });
    
    // No mostrar notificación aquí, ya que se mostrará desde el backend
    // para evitar duplicados
  }
}

/**
 * Muestra un diálogo de confirmación para eliminar un idioma
 */
function confirmDeleteLanguage() {
  if (!contextMenuLanguage) {return;}
  
  // Primera confirmación
  Swal.fire({
    title: 'Eliminar idioma',
    text: `¿Estás seguro de que deseas eliminar el idioma "${contextMenuLanguage}"? Esta operación no se puede deshacer y se eliminará permanentemente el archivo del idioma.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#DC3545',
    cancelButtonColor: 'var(--vscode-button-background)',
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)'
  }).then((result) => {
    if (result.isConfirmed) {
      // Segunda confirmación
      Swal.fire({
        title: 'Confirmar eliminación',
        text: `¿Estás REALMENTE seguro? El archivo de idioma "${contextMenuLanguage}" será eliminado permanentemente.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC3545',
        cancelButtonColor: 'var(--vscode-button-background)',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: 'var(--vscode-editor-background)',
        color: 'var(--vscode-editor-foreground)'
      }).then((result) => {
        if (result.isConfirmed) {
          // Enviar comando para eliminar el idioma
          vscode.postMessage({ 
            command: "deleteLanguage", 
            language: contextMenuLanguage 
          });
        }
      });
    }
  });
}

// Función para mostrar el diálogo de creación de carpeta i18n
function showCreateI18nPrompt(title, text) {
  // Obtener los textos de los botones del atributo data-i18n del body
  const createInRootText = document.body.getAttribute('data-i18n-btn-create-in-root') || 'Crear en raíz';
  const cancelText = document.body.getAttribute('data-i18n-btn-cancel') || 'Cancelar';
  const customPathText = document.body.getAttribute('data-i18n-btn-custom-path') || 'Ruta personalizada';
  
  Swal.fire({
    title: title || document.body.getAttribute('data-i18n-no-i18n-folders') || 'No se encontraron carpetas i18n',
    text: text || document.body.getAttribute('data-i18n-create-i18n-folder') || '¿Desea crear uno?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: createInRootText,
    cancelButtonText: cancelText,
    showDenyButton: true,
    denyButtonText: customPathText,
    reverseButtons: true,
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    confirmButtonColor: 'var(--vscode-button-background)',
    denyButtonColor: '#6c757d',
    cancelButtonColor: '#dc3545'
  }).then((result) => {
    if (result.isConfirmed) {
      // Crear en la raíz del proyecto
      vscode.postMessage({
        command: 'createI18nDirectory'
      });
    } else if (result.isDenied) {
      // Mostrar diálogo para ingresar ruta personalizada
      showCustomPathPrompt();
    } else {
      // Cancelar - cerrar el editor
      vscode.postMessage({
        command: 'closeEditor'
      });
    }
  });
}

// Función para mostrar el diálogo de ruta personalizada
function showCustomPathPrompt() {
  // Obtener los textos de los botones y mensajes del atributo data-i18n del body
  const createText = document.body.getAttribute('data-i18n-btn-create') || 'Crear';
  const cancelText = document.body.getAttribute('data-i18n-btn-cancel') || 'Cancelar';
  const createI18nFolderText = document.body.getAttribute('data-i18n-create-i18n-folder-title') || 'Crear carpeta i18n';
  const enterPathText = document.body.getAttribute('data-i18n-enter-path') || 'Ingrese la ruta relativa donde desea crear la carpeta i18n (ej: frontend)';
  const invalidPathText = document.body.getAttribute('data-i18n-invalid-path') || 'La ruta contiene caracteres inválidos';
  
  Swal.fire({
    title: createI18nFolderText,
    text: enterPathText,
    input: 'text',
    inputPlaceholder: 'frontend',
    showCancelButton: true,
    confirmButtonText: createText,
    cancelButtonText: cancelText,
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    confirmButtonColor: 'var(--vscode-button-background)',
    cancelButtonColor: '#dc3545',
    inputValidator: (value) => {
      // Validar que la ruta no contenga caracteres inválidos
      if (/[<>:"|?*]/.test(value)) {
        return invalidPathText;
      }
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      // Crear en la ruta personalizada
      vscode.postMessage({
        command: 'createI18nDirectory',
        customPath: result.value
      });
    } else if (result.isConfirmed) {
      // Si no se ingresó una ruta, crear en la raíz
      vscode.postMessage({
        command: 'createI18nDirectory'
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      // Si se canceló, cerrar el editor
      vscode.postMessage({
        command: 'closeEditor'
      });
    }
  });
}

// Función para mostrar mensaje cuando no hay carpetas de trabajo
function showNoWorkspaceFoldersMessage() {
  // Obtener los textos de los botones y mensajes del atributo data-i18n del body
  const understoodText = document.body.getAttribute('data-i18n-btn-understood') || 'Entendido';
  const noWorkspaceFoldersText = document.body.getAttribute('data-i18n-no-workspace-folders') || 'No hay carpetas de trabajo';
  const createI18nToStartText = document.body.getAttribute('data-i18n-create-i18n-to-start') || 'Por favor, cree una carpeta i18n para comenzar.';
  
  Swal.fire({
    title: noWorkspaceFoldersText,
    text: createI18nToStartText,
    icon: 'info',
    confirmButtonText: understoodText,
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    confirmButtonColor: 'var(--vscode-button-background)'
  });
}

// Función para configurar la extensión
function configureExtension() {
  // Esta función será implementada posteriormente
  // Por ahora, solo enviamos un mensaje al backend
  vscode.postMessage({
    command: 'configureExtension'
  });
}

// Variable para almacenar la configuración actual
let currentConfig = {};

/**
 * Función para mostrar el formulario de preferencias
 * Permite editar las configuraciones locales de la extensión
 */
function preferences() {
  // Solicitar la configuración actual al backend
  vscode.postMessage({ command: "getPreferences" });
}

/**
 * Muestra el formulario de preferencias con la configuración actual
 * @param {Object} config - Configuración actual de la extensión
 */
function showPreferencesForm(config) {
  currentConfig = config || {};
  
  // Generar opciones para workspace folders
  const workspaceFoldersOptions = (config.workspaceFolders || [])
    .map(folder => `<option value="${folder.name}" ${folder.name === config.defaultWorkspaceFolder ? 'selected' : ''}>${folder.name}</option>`)
    .join('');
  
  // Generar opciones para line ending
  const lineEndingOptions = [
    { value: '\n', label: 'LF (\\n) - Unix/Linux/MacOS', selected: config.lineEnding === '\n' },
    { value: '\r\n', label: 'CRLF (\\r\\n) - Windows', selected: config.lineEnding === '\r\n' }
  ].map(opt => `<option value="${opt.value}" ${opt.selected ? 'selected' : ''}>${opt.label}</option>`).join('');

  const formHtml = `
    <div class="preferences-form" style="text-align: left; max-height: 600px; overflow-y: auto;">
      <div class="form-group mb-3">
        <label for="pref-allowEmptyTranslations" class="form-label">
          <input type="checkbox" id="pref-allowEmptyTranslations" ${config.allowEmptyTranslations ? 'checked' : ''}>
          <strong>Permitir traducciones vacías</strong>
        </label>
        <small class="form-text text-muted d-block mt-1">Permite guardar archivos con traducciones vacías sin mostrar errores</small>
      </div>
      
      <div class="form-group mb-3">
        <label for="pref-defaultLanguage" class="form-label"><strong>Idioma predeterminado:</strong></label>
        <input type="text" class="form-control" id="pref-defaultLanguage" value="${config.defaultLanguage || 'en'}" placeholder="en">
        <small class="form-text text-muted">Código del idioma que se usará como referencia</small>
      </div>
      
      <div class="form-group mb-3">
        <label for="pref-forceKeyUPPERCASE" class="form-label">
          <input type="checkbox" id="pref-forceKeyUPPERCASE" ${config.forceKeyUPPERCASE ? 'checked' : ''}>
          <strong>Forzar claves en MAYÚSCULAS</strong>
        </label>
        <small class="form-text text-muted d-block mt-1">Convierte automáticamente todas las claves de traducción a mayúsculas</small>
      </div>
      
      <div class="form-group mb-3">
        <label for="pref-jsonSpace" class="form-label"><strong>Espacios de indentación JSON:</strong></label>
        <input type="number" class="form-control" id="pref-jsonSpace" value="${config.jsonSpace || 2}" min="0" max="8">
        <small class="form-text text-muted">Número de espacios para la indentación del formato JSON (0 = sin formato)</small>
      </div>
      
      <div class="form-group mb-3">
        <label for="pref-keySeparator" class="form-label"><strong>Separador de claves:</strong></label>
        <input type="text" class="form-control" id="pref-keySeparator" value="${config.keySeparator || '.'}" placeholder=".">
        <small class="form-text text-muted">Carácter usado para separar niveles en las claves (ejemplo: user.profile.name)</small>
      </div>
      
      <div class="form-group mb-3">
        <label for="pref-lineEnding" class="form-label"><strong>Terminación de línea:</strong></label>
        <select class="form-control" id="pref-lineEnding">
          ${lineEndingOptions}
        </select>
        <small class="form-text text-muted">Tipo de terminación de línea para los archivos JSON</small>
      </div>
      
      <div class="form-group mb-3">
        <label for="pref-supportedFolders" class="form-label"><strong>Carpetas soportadas:</strong></label>
        <input type="text" class="form-control" id="pref-supportedFolders" value="${(config.supportedFolders || ['i18n']).join(', ')}" placeholder="i18n">
        <small class="form-text text-muted">Lista de nombres de carpetas separadas por comas que contienen archivos de traducción</small>
      </div>
      
      ${workspaceFoldersOptions ? `
      <div class="form-group mb-3">
        <label for="pref-defaultWorkspaceFolder" class="form-label"><strong>Carpeta de trabajo predeterminada:</strong></label>
        <select class="form-control" id="pref-defaultWorkspaceFolder">
          <option value="">Seleccionar carpeta...</option>
          ${workspaceFoldersOptions}
        </select>
        <small class="form-text text-muted">Carpeta de trabajo que se seleccionará automáticamente al abrir la extensión</small>
      </div>
      ` : ''}
      
      <div class="form-group mb-3">
        <label class="form-label"><strong>Información del workspace:</strong></label>
        <div class="alert alert-info" role="alert" style="font-size: 0.85em;">
          <strong>Carpetas configuradas:</strong> ${(config.workspaceFolders || []).length} carpeta(s)<br>
          ${(config.workspaceFolders || []).map(folder => `• ${folder.name}: ${folder.path}`).join('<br>')}
        </div>
      </div>
      
      <hr>
      
      <div class="form-group mb-3">
        <label class="form-label"><strong>Servicios de traducción (Próximamente):</strong></label>
        <div class="alert alert-secondary" role="alert" style="font-size: 0.85em;">
          Los servicios de traducción automática estarán disponibles en futuras versiones.
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Preferencias de la Extensión',
    html: formHtml,
    width: '800px',
    showCancelButton: true,
    confirmButtonText: 'Guardar Cambios',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: 'var(--vscode-button-background)',
    cancelButtonColor: '#dc3545',
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    customClass: {
      popup: 'preferences-popup'
    },
    preConfirm: () => {
      // Validar y recopilar datos del formulario
      const formData = {
        allowEmptyTranslations: document.getElementById('pref-allowEmptyTranslations').checked,
        defaultLanguage: document.getElementById('pref-defaultLanguage').value.trim(),
        forceKeyUPPERCASE: document.getElementById('pref-forceKeyUPPERCASE').checked,
        jsonSpace: parseInt(document.getElementById('pref-jsonSpace').value) || 2,
        keySeparator: document.getElementById('pref-keySeparator').value || '.',
        lineEnding: document.getElementById('pref-lineEnding').value,
        supportedFolders: document.getElementById('pref-supportedFolders').value
          .split(',')
          .map(folder => folder.trim())
          .filter(folder => folder.length > 0),
        defaultWorkspaceFolder: document.getElementById('pref-defaultWorkspaceFolder') 
          ? document.getElementById('pref-defaultWorkspaceFolder').value 
          : config.defaultWorkspaceFolder,
        // Mantener los valores existentes para estos campos
        workspaceFolders: config.workspaceFolders || [],
        translationService: config.translationService || "Coming soon",
        translationServiceApiKey: config.translationServiceApiKey || "Coming soon"
      };

      // Validaciones básicas
      if (!formData.defaultLanguage) {
        Swal.showValidationMessage('El idioma predeterminado es obligatorio');
        return false;
      }

      if (formData.jsonSpace < 0 || formData.jsonSpace > 8) {
        Swal.showValidationMessage('Los espacios de indentación deben estar entre 0 y 8');
        return false;
      }

      if (!formData.keySeparator) {
        Swal.showValidationMessage('El separador de claves es obligatorio');
        return false;
      }

      if (formData.supportedFolders.length === 0) {
        Swal.showValidationMessage('Debe especificar al menos una carpeta soportada');
        return false;
      }

      return formData;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Enviar la configuración actualizada al backend
      vscode.postMessage({
        command: "savePreferences",
        config: result.value
      });
    }
  });
}

// Función para inicializar los tooltips
function initTooltips() {
  // Destruir tooltips existentes para evitar duplicados
  const elements = document.querySelectorAll('[title]');
  elements.forEach(el => {
    if (el._tippy) {
      el._tippy.destroy();
    }
  });
  
  // Inicializar tooltips en todos los elementos con atributo title
  tippy('[title]', {
    content: (reference) => reference.getAttribute('title'),
    placement: 'bottom', // Colocar todos los tooltips debajo de los elementos
  });
}

