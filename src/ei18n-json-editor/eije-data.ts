import * as vscode from 'vscode';
import * as fs from 'fs';
import * as _path from 'path';

import { EIJEConfiguration } from './eije-configuration';
import { EIJEDataRenderService } from './services/eije-data-render-service';
import { EIJEDataTranslation } from './models/eije-data-translation';
import { EIJEDataTranslationError, getTranslatedError } from './models/eije-data-translation';
import { EIJETranslationService } from './services/eije-translation-service';
import { EIJEManager } from './eije-manager';
import { EIJEPage } from './models/eije-page';
import { EIJESort } from './models/eije-sort';
import { EIJEView, EIJEViewType } from './models/eije-view';
import { I18nService } from '../i18n/i18n-service';
import { NotificationService } from './services/notification-service';

export class EIJEData {
    private _currentID = 1;

    private _languages: string[] = [];
    private _translations: EIJEDataTranslation[] = [];

    private _searchPattern: string = '';
    private _filteredFolder: string = '*';

    private _view: EIJEView;
    private _page: EIJEPage;
    private _sort: EIJESort;
    
    // Métodos para obtener datos necesarios para las funciones de traducciones vacías
    getAllTranslations(): EIJEDataTranslation[] {
        return this._translations;
    }
    
    getLanguages(): string[] {
        return this._languages;
    }
    
    getPageSize(): number {
        return this._page.pageSize;
    }
    
    getCurrentPage(): number {
        return this._page.pageNumber;
    }

    constructor(private _manager: EIJEManager) {
        this._loadFiles();
        this._defaultValues();
    }

    private _defaultValues() {
        this._view = {
            type: EIJEViewType.TABLE,
            selectionId: 1
        };

        this._sort = {
            column: I18nService.getInstance().t('ui.labels.keyColumn'),
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
        translation.error = getTranslatedError(EIJEDataTranslationError.KEY_NOT_EMPTY);
        
        this._insert(translation);
        this._view.selectionId = translation.id;
        this._manager.refreshDataTable();
    }

    changeFolder(id: number, value: string) {
        const translation = this._get(id);
        translation.folder = value;
        this._validate(translation, true);
        this._manager.updateTranslation(translation);
        return translation;
    }

    filterFolder(value: string) {
        this._filteredFolder = value;
        this._manager.refreshDataTable();
    }

    mark(id: number) {
        const translation = this._get(id);
        if (translation) {
            this._view.selectionId = id;
        }
    }

    navigate(page: number, skipRefresh: boolean = false) {
        this._page.pageNumber = page;
        if (!skipRefresh) {
            this._manager.refreshDataTable();
        }
    }

    pageSize(pageSize: number) {
        if (pageSize > 0 && pageSize % 10 === 0) {
            this._page.pageSize = pageSize;
            this._manager.refreshDataTable();
        }
    }

    private _hasTranslationService(): boolean {
        return !!EIJEConfiguration.TRANSLATION_SERVICE && 
               !!EIJEConfiguration.TRANSLATION_SERVICE_API_KEY &&
               EIJEConfiguration.TRANSLATION_SERVICE !== 'Coming soon' &&
               EIJEConfiguration.TRANSLATION_SERVICE_API_KEY !== 'Coming soon';
    }

    render() {
        let render = '';
        let translations = this._getDisplayedTranslations();
        const hasTranslateService = this._hasTranslationService();

        switch (this._view.type) {
            case EIJEViewType.LIST:
                render += EIJEDataRenderService.renderList(
                    translations,
                    this._get(this._view.selectionId),
                    this._languages,
                    this._page,
                    this._sort,
                    this._manager.isWorkspace,
                    hasTranslateService
                );
                break;
            case EIJEViewType.TABLE:
                render += EIJEDataRenderService.renderTable(
                    translations,
                    this._languages,
                    this._page,
                    this._sort,
                    this._manager.isWorkspace,
                    hasTranslateService
                );
                break;
        }

        return render;
    }

    remove(id: number) {
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
    
    save() {
        // Revalidar todas las traducciones para asegurar que cumplen con la configuración actual
        this._revalidateAllTranslations();
        
        // Verificar si hay traducciones con claves vacías o inválidas
        const invalidTranslations = this._translations.filter(t => !t.valid);
        if (invalidTranslations.length > 0) {
            // Si hay traducciones inválidas, mostrar un mensaje de error y no guardar
            const i18n = I18nService.getInstance();
            NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.cannotSaveInvalidTranslations'));
            
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
            const hiddenLanguages = EIJEConfiguration.HIDDEN_COLUMNS;
            
            // Limpiar JSONs existentes (solo de idiomas visibles)
            let existingFolders = [];
            if (this._manager.folderPath) {
                existingFolders.push(this._manager.folderPath);
            } else {
                existingFolders = EIJEConfiguration.WORKSPACE_FOLDERS.map(d => d.path);
            }
            existingFolders.forEach(d => {
                this._languages.forEach(language => {
                    // Saltar idiomas ocultos - no deben limpiarse ni guardarse
                    if (hiddenLanguages.includes(language)) {
                        return;
                    }
                    
                    const json = JSON.stringify({}, null, EIJEConfiguration.JSON_SPACE);
                    const f = vscode.Uri.file(_path.join(d, language + '.json')).fsPath;
                    fs.writeFileSync(f, json);
                });
            });

            // Agrupar traducciones por carpeta
            let folders: { [key: string]: EIJEDataTranslation[] } = this._translations.reduce((r, a) => {
                r[a.folder] = r[a.folder] || [];
                r[a.folder].push(a);
                return r;
            }, {});

            // Guardar traducciones válidas
            Object.entries(folders).forEach(entry => {
                const [key, value] = entry;
                this._languages.forEach(language => {
                    // Saltar idiomas ocultos - no deben guardarse
                    if (hiddenLanguages.includes(language)) {
                        return;
                    }
                    
                    let o = {};

                    value
                        .filter(translation => translation.valid)
                        .sort((a, b) => (a.key > b.key ? 1 : -1))
                        .forEach(translation => {
                            // Si se permiten traducciones vacías, incluir todas las traducciones
                            // Si no se permiten, solo incluir las que tienen contenido
                            const hasContent = translation.languages[language] && translation.languages[language].trim() !== '';
                            const shouldInclude = hasContent || EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS;
                            
                            if (shouldInclude) {
                                const value = translation.languages[language] || '';
                                this._transformKeysValues(translation.key, value, o);
                            }
                        });

                    var json = JSON.stringify(o, null, EIJEConfiguration.JSON_SPACE);
                    json = json.replace(/\n/g, EIJEConfiguration.LINE_ENDING);
                    const f = vscode.Uri.file(_path.join(key, language + '.json')).fsPath;
                    fs.writeFileSync(f, json);
                });
            });
            
            // Mostrar mensaje de éxito en VS Code
            NotificationService.getInstance().showInformationMessage(I18nService.getInstance().t('ui.messages.saved'), true);
            
            // Informar al frontend que el guardado fue exitoso
            this._manager.sendSaveResult(true);
        } catch (error) {
            // En caso de cualquier error durante el guardado
            NotificationService.getInstance().showErrorMessage(I18nService.getInstance().t('ui.messages.saveError') + ': ' + String(error));
            
            // Informar al frontend que el guardado falló
            this._manager.sendSaveResult(false);
        }
    }

    search(value: string) {
        this._searchPattern = value;
        this._manager.refreshDataTable();
    }

    select(id: number, skipRefresh: boolean = false) {
        const translation = this._get(id);
        if (translation) {
            this._view.selectionId = translation.id;

            if (!skipRefresh) {
                this._manager.refreshDataTable();
            }
        }
    }
    sort(column: string, ascending: boolean, firstPage: boolean = false) {
        this._sort.ascending = this._sort.column !== column ? true : ascending;
        this._sort.column = column;

        if (firstPage) {
            this.navigate(1);
        } else {
            this._manager.refreshDataTable();
        }
    }

    switchView(view: EIJEViewType) {
        this._view.type = view;
        this._manager.refreshDataTable();
    }

    async translate(id: number, language: string = '') {
        const translation = this._get(id);
        if (translation && language) {
            await EIJETranslationService.translate(translation, language, this._languages);
            this._manager.refreshDataTable();
        }
    }

    update(id: number, value: string, language: string = ''): EIJEDataTranslation {
        const translation = this._get(id);
        if (translation) {
            this._view.selectionId = id;
            if (language) {
                translation.languages[language] = value.replace(/\\n/g, '\n');
                this._validate(translation);
            } else {
                const newKey = EIJEConfiguration.FORCE_KEY_UPPERCASE ? value.toUpperCase() : value;
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
    countEmptyTranslations(): { count: number, hasEmpty: boolean } {
        // Get hidden languages to ignore
        const hiddenLanguages = EIJEConfiguration.HIDDEN_COLUMNS;
        
        // Get all filtered translations
        let filteredTranslations = this._translations;
        if (this._filteredFolder !== '*') {
            filteredTranslations = filteredTranslations.filter(t => t.folder === this._filteredFolder);
        }
        
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
    hasEmptyTranslations(): boolean {
        return this.countEmptyTranslations().hasEmpty;
    }
    
    /**
     * Find empty translations on the current page
     * @param currentPage The current page number
     * @returns Array of translation IDs with empty values
     */
    findEmptyTranslations(currentPage: number): { id: number, language: string }[] {
        // Si se permiten traducciones vacías, devolver array vacío
        if (EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS) {
            return [];
        }
        
        const emptyTranslations: { id: number, language: string }[] = [];
        
        // Get hidden languages to ignore
        const hiddenLanguages = EIJEConfiguration.HIDDEN_COLUMNS;
        
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
    findNextEmptyTranslation(): { page: number, id: number, language: string } | null {
        // Start from the current page and then check all other pages
        const currentPage = this._page.pageNumber;
        const pageSize = this._page.pageSize;
        
        // Get hidden languages to ignore
        const hiddenLanguages = EIJEConfiguration.HIDDEN_COLUMNS;
        
        // Get filtered translations (using the same filtering logic as _getDisplayedTranslations)
        let filteredTranslations = this._translations;
        if (this._filteredFolder !== '*') {
            filteredTranslations = filteredTranslations.filter(t => t.folder === this._filteredFolder);
        }
        
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
    private _transformKeysValues(key: string, value: string, o = {}) {
        let separator = EIJEConfiguration.KEY_SEPARATOR ? key.indexOf(EIJEConfiguration.KEY_SEPARATOR) : -1;
        if (separator > 0) {
            const _key = key.substring(0, separator);
            if (!o[_key]) {
                o[_key] = {};
            }
            this._transformKeysValues(key.substring(separator + 1), value, o[_key]);
        } else if (!o[key] && typeof o !== 'string') {
            o[key] = value;
        }
    }

    /**
     *  Load methods
     */
    private _loadFiles() {
        // Almacenar los idiomas antes de cargar los nuevos archivos
        const previousLanguages = [...this._languages];
        
        // Cargar archivos de idioma
        if (!this._manager.isWorkspace) {
            this._loadFolder(this._manager.folderPath);
        } else {
            const directories = EIJEConfiguration.WORKSPACE_FOLDERS;
            directories.forEach(d => {
                this._loadFolder(d.path);
            });
        }
        
        // Detectar idiomas nuevos (no existían antes de cargar los archivos)
        const newlyAddedLanguages = this._languages.filter(lang => 
            !previousLanguages.includes(lang)
        );
        
        // Obtener configuración actual
        const currentVisibleColumns = EIJEConfiguration.VISIBLE_COLUMNS;
        const currentHiddenColumns = EIJEConfiguration.HIDDEN_COLUMNS;
        
        if (this._languages.length > 0) {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            let hasConfigFile = false;
            if (workspaceFolder) {
                const configPath = _path.join(workspaceFolder.uri.fsPath, '.vscode', '.ei18n-editor-config.json');
                hasConfigFile = fs.existsSync(configPath);
            }
            
            if (!hasConfigFile) {
                const columnsToShow = this._languages.filter(lang => lang !== 'en');
                EIJEConfiguration.saveVisibleColumns(columnsToShow);
            } else {
                const completelyNewLanguages = this._languages.filter(lang => 
                    lang !== 'en' && 
                    !currentVisibleColumns.includes(lang) && 
                    !currentHiddenColumns.includes(lang)
                );
                
                if (completelyNewLanguages.length > 0) {
                    const updatedColumns = [...currentVisibleColumns, ...completelyNewLanguages];
                    EIJEConfiguration.saveVisibleColumns(updatedColumns);
                }
            }
        }
    }

    private _loadFolder(folderPath: string) {
        const files = fs.readdirSync(folderPath);

        const translate: any = {};
        const keys: string[] = [];
        files
            .filter(f => f.endsWith('.json'))
            .forEach((file: string) => {
                var language = file.split('.')[0];
                if (this._languages.indexOf(language) === -1) {
                    this._languages.push(language);
                }

                try {
                    let rawdata = fs.readFileSync(_path.join(folderPath, file));
                    let jsonData = this._stripBOM(rawdata.toString());
                    let content = JSON.parse(jsonData);

                    let keysValues = this._getKeysValues(content);

                    for (let key in keysValues) {
                        if (keys.indexOf(key) === -1) {
                            keys.push(key);
                        }
                    }
                    translate[language] = keysValues;
                } catch (e) {
                    translate[language] = {};
                }
            });

        keys.forEach((key: string) => {
            const languages: any = {};
            this._languages.forEach((language: string) => {
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
    private _getKeysValues(obj: any, _key = '') {
        let kv: any = {};
        for (let key in obj) {
            if (typeof obj[key] !== 'string') {
                kv = { ...kv, ...this._getKeysValues(obj[key], _key + key + (EIJEConfiguration.KEY_SEPARATOR || '')) };
            } else {
                kv[_key + key] = obj[key];
            }
        }
        return kv;
    }

    /**
     * Get all translation displayed on the view based on the active filters and paging options
     */
    private _getDisplayedTranslations(): EIJEDataTranslation[] {
        var o = this._translations;
        if (this._filteredFolder !== '*') {
            o = o.filter(t => t.folder === this._filteredFolder);
        }

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
                let _a: string, _b: string;
                if (this._view.type === EIJEViewType.LIST || this._sort.column === I18nService.getInstance().t('ui.labels.keyColumn')) {
                    _a = a.key.toLowerCase();
                    _b = b.key.toLowerCase();
                } else if (this._sort.column === I18nService.getInstance().t('ui.labels.folder')) {
                    _a = a.folder + a.key.toLowerCase();
                    _b = b.folder + b.key.toLowerCase();
                } else {
                    _a = a.languages[this._sort.column] ? a.languages[this._sort.column].toLowerCase() : '';
                    _b = b.languages[this._sort.column] ? b.languages[this._sort.column].toLowerCase() : '';
                }
                return ((this._view.type === EIJEViewType.LIST ? true : this._sort.ascending) ? _a > _b : _a < _b) ? 1 : -1;
            });

        this._page.count = o.length;
        this._page.pageSize = this._view.type === EIJEViewType.LIST ? 15 : this._page.pageSize;
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
    private _validateImpacted(translation: EIJEDataTranslation, key: string = undefined) {
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

    private _validate(translation: EIJEDataTranslation, keyChanged: boolean = false) {
        var t = this._validatePath(translation);
        if (translation.key === '') {
            translation.valid = false;
            translation.error = getTranslatedError(EIJEDataTranslationError.KEY_NOT_EMPTY);
        } else if (keyChanged) {
            let separator = EIJEConfiguration.KEY_SEPARATOR ? this.escapeRegExp(EIJEConfiguration.KEY_SEPARATOR) : false;
            //does not start or end with the separator or two consecutive separators
            if (separator && new RegExp(`^${separator}|${separator}{2,}|${separator}$`).test(translation.key)) {
                translation.valid = false;
                translation.error = getTranslatedError(EIJEDataTranslationError.INVALID_KEY);
            } else if (this._validatePath(translation).length > 0) {
                translation.valid = false;
                translation.error = getTranslatedError(EIJEDataTranslationError.DUPLICATE_PATH);
            } else {
                translation.valid = true;
                translation.error = '';
            }
        }
        
        // Si no se permiten traducciones vacías, validar que no haya ninguna
        if (translation.valid && !EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS) {
            // Comprobar si hay algún idioma con traducción vacía
            for (const language of this._languages) {
                if (language !== 'key' && 
                    !EIJEConfiguration.HIDDEN_COLUMNS.includes(language) && 
                    (!translation.languages[language] || translation.languages[language].trim() === '')) {
                    translation.valid = false;
                    translation.error = getTranslatedError(EIJEDataTranslationError.EMPTY_TRANSLATION);
                    break;
                }
            }
        }
    }

    private _validatePath(translation: EIJEDataTranslation, valid: boolean = true, key: string = undefined) {
        const splitKey = this._split(key !== undefined ? key : translation.key);

        return this._translations.filter(t => {
            if (translation.id === t.id || translation.folder !== t.folder || t.valid !== valid) {
                return false;
            }
            return this._comparePath(splitKey, t.key.split('.'));
        });
    }

    private _comparePath(a: string[], b: string[]) {
        const _a = a.length >= b.length ? b : a;
        const _b = a.length < b.length ? b : a;
        return _a.every((v: string, i: number) => v === _b[i]);
    }

    /**
     * Factories
     */
    private _createFactoryIJEDataTranslation(): EIJEDataTranslation {
        return {
            id: this._currentID++,
            folder: !this._manager.isWorkspace ? this._manager.folderPath : this._filteredFolder !== '*' ? this._filteredFolder : EIJEConfiguration.WORKSPACE_FOLDERS[0].path,
            valid: true,
            error: '',
            key: '',
            languages: {}
        };
    }

    /**
     * Helpers
     */
    private escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    private _get(id: number): EIJEDataTranslation {
        return this._translations.find(t => t.id === id);
    }

    private _getIndex(id: number): number {
        return this._translations.findIndex(t => t.id === id);
    }

    private _insert(translation: EIJEDataTranslation) {
        this._translations.push(translation);
    }

    private _split(key: string) {
        if (EIJEConfiguration.KEY_SEPARATOR) {
            return key.split(EIJEConfiguration.KEY_SEPARATOR);
        }
        return [key];
    }

    private _stripBOM(content: string): string {
        if (!content.startsWith('\uFEFF')) {
            return content;
        }

        return content.replace('\uFEFF', '');
    }
}
