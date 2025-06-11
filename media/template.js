var vscode;
var hasUnsavedChanges = false;

(function () {
  vscode = acquireVsCodeApi();
  
  // Deshabilitar el botón de guardado por defecto
  window.addEventListener("DOMContentLoaded", () => {
    const saveButton = document.getElementById("save-button");
    if (saveButton) {
      saveButton.disabled = true;
    }
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
        const filesHaveEmptyTranslations = message.hasEmptyTranslations;
        const totalEmptyCount = message.totalEmptyCount;
        
        // Actualizar contador con el TOTAL de traducciones vacías en todo el archivo
        const emptyCounter = document.getElementById('missing-translations-counter');
        if (emptyCounter) {
          emptyCounter.textContent = totalEmptyCount;
        }
        
        // Mostrar u ocultar el botón según si hay traducciones vacías en todo el conjunto de datos
        const dangerBtn = document.getElementById('btn-warning-translations');
        if (dangerBtn) {
          dangerBtn.style.display = filesHaveEmptyTranslations ? 'inline-block' : 'none';
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

      case "folders":
        const folders = message.folders;
        if (folders) {
          var select = document.getElementById("select-folder");
          for (const d of folders) {
            var option = document.createElement("option");
            option.text = d.name;
            option.value = d.path;
            select.add(option);
          }
          select.style.display = "inline";
        }

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
        const saveButton = document.getElementById("save-button");
        
        // Verificar si hay traducciones vacías
        const emptyTranslationsCounter = document.getElementById('missing-translations-counter');
        const pendingEmptyTranslations = emptyTranslationsCounter && 
                                     parseInt(emptyTranslationsCounter.textContent) > 0;
        
        // Si el backend indicó éxito pero hay traducciones vacías, notificar al backend
        // para que cancele cualquier mensaje de éxito y muestre solo el mensaje de error
        if (message.success && pendingEmptyTranslations) {
          vscode.postMessage({ 
            command: "notifyEmptyTranslations", 
            count: parseInt(emptyTranslationsCounter.textContent),
            // Indicar explícitamente que se debe cancelar el mensaje de éxito
            cancelSuccessMessage: true
          });
        }
        
        if (message.success && !pendingEmptyTranslations) {
          // Si fue exitoso y no hay traducciones vacías, mostrar success y volver al estado normal
          saveButton.classList.remove("btn-vscode", "btn-warning", "btn-danger");
          saveButton.classList.add("btn-success");
          saveButton.disabled = false;
          
          // Después de 2.5 segundos, volver al estado normal
          setTimeout(() => {
            saveButton.classList.remove("btn-success");
            saveButton.classList.add("btn-vscode");
            hasUnsavedChanges = false;
            saveButton.disabled = true; // Deshabilitar cuando vuelve a estilo primary
          }, 2500);
        } else {
          // Si hubo error o hay traducciones vacías
          // Mostrar estado de error
          saveButton.classList.remove("btn-vscode", "btn-warning", "btn-success");
          saveButton.classList.add("btn-danger");
          saveButton.disabled = false;
          
          // Después de 2 segundos, volver al estado de advertencia
          setTimeout(() => {
            saveButton.classList.remove("btn-danger");
            saveButton.classList.add("btn-warning");
            saveButton.disabled = false; // Mantener habilitado con advertencia
            // Mantenemos hasUnsavedChanges como true porque hay problemas
            hasUnsavedChanges = true;
          }, 2000);
        }
        break;
    }
  });
  setTimeout(() => {
    this.refresh();
    // Actualizar el contador de traducciones pendientes inicialmente
    checkEmptyTranslations();
    
    // Asegurarnos de que el botón de guardado esté deshabilitado inicialmente
    const saveButton = document.getElementById("save-button");
    if (saveButton) {
      saveButton.disabled = true;
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



add = () => {
  vscode.postMessage({ command: "add" });
  hasUnsavedChanges = true;
  updateSaveButtonStyle();
};
filterFolder = (el) => vscode.postMessage({ command: "filterFolder", value: el.value });
mark = (id) => vscode.postMessage({ command: "mark", id: id });
navigate = (page) => vscode.postMessage({ command: "navigate", page: page });
pageSize = (el) => vscode.postMessage({ command: "pageSize", value: el.value });
refresh = () => vscode.postMessage({ command: "refresh" });
reload = () => {
  vscode.postMessage({ command: "reload" });
  hasUnsavedChanges = false;
  const saveButton = document.getElementById("save-button");
  saveButton.classList.remove("btn-warning", "btn-success", "btn-danger");
  saveButton.classList.add("btn-vscode");
  saveButton.disabled = true; // Deshabilitar cuando se restablece al estilo primary
};
remove = (id) => {
  vscode.postMessage({ command: "remove", id: id });
  hasUnsavedChanges = true;
  updateSaveButtonStyle();
};
save = () => {
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
  const saveButton = document.getElementById("save-button");
  saveButton.disabled = true;
  saveButton.classList.remove("btn-vscode", "btn-warning", "btn-success", "btn-danger");
  saveButton.classList.add("btn-secondary"); // Estilo de procesando
};

// Función para actualizar el estilo del botón de guardado según si hay cambios
function updateSaveButtonStyle() {
  const saveButton = document.getElementById("save-button");
  if (hasUnsavedChanges) {
    saveButton.classList.remove("btn-vscode", "btn-success", "btn-danger");
    saveButton.classList.add("btn-warning");
    saveButton.disabled = false; // Habilitar cuando hay cambios
  } else {
    saveButton.disabled = true; // Deshabilitar cuando no hay cambios
  }
}
search = (el) => vscode.postMessage({ command: "search", value: el.value });
select = (id) => vscode.postMessage({ command: "select", id: id });
sort = (column, ascending) => vscode.postMessage({ command: "sort", column: column, ascending: ascending });
newLanguage = () => {
  // Instead of using prompt(), send a command to show input box
  vscode.postMessage({ command: "showNewLanguageInput" });
};
switchView = () => {
  const el = document.getElementById("icon-switch-view");
  const isTableView = !el.classList.contains("icon-table");
  isTableView ? el.classList.replace("icon-list-bullet", "icon-table") : el.classList.replace("icon-table", "icon-list-bullet");
  vscode.postMessage({
    command: "switch-view",
    view: isTableView ? "list" : "table",
  });
};
updateInput = (el, id, language = "") => {
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
};
translateInput = (el, id, language = "") => vscode.postMessage({ command: "translate", id: id, language: language });
updateFolder = (el, id) => vscode.postMessage({ command: "folder", id: id, value: el.value });
toggleColumn = (language, visible) => vscode.postMessage({ command: "toggleColumn", language: language, visible: visible });

// Función para mostrar/ocultar el selector de columnas
toggleColumnSelector = () => {
  const panel = document.getElementById("columnSelectorContent");
  if (panel) {
    if (panel.style.display === "none") {
      panel.style.display = "block";
    } else {
      panel.style.display = "none";
    }
  }
};

// Función para aplicar cambios en la selección de columnas
applyColumnChanges = () => {
  const languages = document.querySelectorAll('input[id^="column-"]:not([disabled])');
  languages.forEach(checkbox => {
    const language = checkbox.id.replace('column-', '');
    if (language !== 'key') {
      vscode.postMessage({ 
        command: "toggleColumn", 
        language: language, 
        visible: checkbox.checked 
      });
    }
  });
  document.getElementById('apply-columns-btn').disabled = true;
};

// Función para mostrar/ocultar el campo de búsqueda
toggleSearch = () => {
  const searchContainer = document.getElementById('search-container');
  const isVisible = searchContainer.style.display !== 'none';
  
  searchContainer.style.display = isVisible ? 'none' : 'inline-block';
  
  // Si se muestra el campo, enfocar el input
  if (!isVisible) {
    document.getElementById('search-input').focus();
  }
};

// Función para mostrar/ocultar el botón de limpiar
toggleClearButton = (el) => {
  const clearBtn = document.getElementById('clear-search-btn');
  clearBtn.style.display = el.value.length > 0 ? 'inline-block' : 'none';
};

// Función para limpiar el campo de búsqueda
clearSearch = () => {
  const searchInput = document.getElementById('search-input');
  searchInput.value = '';
  search(searchInput); // Actualizar la búsqueda con el valor vacío
  toggleClearButton(searchInput); // Ocultar el botón de limpiar
  searchInput.focus(); // Mantener el foco en el campo
};

