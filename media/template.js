var vscode;
(function () {
  vscode = acquireVsCodeApi();

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
      case "content":
        document.getElementById("content-view").innerHTML = message.render;
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
    }
  });
  setTimeout(() => this.refresh(), 200);
})();


add = () => vscode.postMessage({ command: "add" });
filterFolder = (el) => vscode.postMessage({ command: "filterFolder", value: el.value });
mark = (id) => vscode.postMessage({ command: "mark", id: id });
navigate = (page) => vscode.postMessage({ command: "navigate", page: page });
pageSize = (el) => vscode.postMessage({ command: "pageSize", value: el.value });
refresh = () => vscode.postMessage({ command: "refresh" });
reload = () => vscode.postMessage({ command: "reload" });
remove = (id) => vscode.postMessage({ command: "remove", id: id });
save = () => vscode.postMessage({ command: "save" });
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
updateInput = (el, id, language = "") => vscode.postMessage({ command: "update", id: id, value: el.value, language: language });
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

