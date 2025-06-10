import * as vscode from 'vscode';
import * as fs from 'fs';
import * as _path from 'path';

import { IJEConfiguration } from './ije-configuration';
import { IJEDataRenderService } from './services/ije-data-render-service';
import { IJEDataTranslation } from './models/ije-data-translation';
import { IJEDataTranslationError, getTranslatedError } from './models/ije-data-translation';
import { IJETranslationService } from './services/ije-translation-service';
import { IJEManager } from './ije-manager';
import { IJEPage } from './models/ije-page';
import { IJESort } from './models/ije-sort';
import { IJEView, IJEViewType } from './models/ije-view';
import { I18nService } from '../i18n/i18n-service';

export class IJEData {
    private _currentID = 1;

    private _languages: string[] = [];
    private _translations: IJEDataTranslation[] = [];

    private _searchPattern: string = '';
    private _filteredFolder: string = '*';

    private _view: IJEView;
    private _page: IJEPage;
    private _sort: IJESort;
    
    // Métodos para obtener datos necesarios para las funciones de traducciones vacías
    getAllTranslations(): IJEDataTranslation[] {
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

    constructor(private _manager: IJEManager) {
        this._loadFiles();
        this._defaultValues();
    }

    private _defaultValues() {
        this._view = {
            type: IJEViewType.TABLE,
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

    navigate(page: number) {
        this._page.pageNumber = page;
        this._manager.refreshDataTable();
    }

    pageSize(pageSize: number) {
        if (pageSize > 0 && pageSize % 10 === 0) {
            this._page.pageSize = pageSize;
            this._manager.refreshDataTable();
        }
    }

    render() {
        let render = '';
        let translations = this._getDisplayedTranslations();

        switch (this._view.type) {
            case IJEViewType.LIST:
                render += IJEDataRenderService.renderList(
                    translations,
                    this._get(this._view.selectionId),
                    this._languages,
                    this._page,
                    this._sort,
                    this._manager.isWorkspace,
                    !!IJEConfiguration.TRANSLATION_SERVICE && !!IJEConfiguration.TRANSLATION_SERVICE_API_KEY
                );
                break;
            case IJEViewType.TABLE:
                render += IJEDataRenderService.renderTable(
                    translations,
                    this._languages,
                    this._page,
                    this._sort,
                    this._manager.isWorkspace,
                    !!IJEConfiguration.TRANSLATION_SERVICE && !!IJEConfiguration.TRANSLATION_SERVICE_API_KEY
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

    save() {
        //clean jsons
        let existingFolders = [];
        if (this._manager.folderPath) {
            existingFolders.push(this._manager.folderPath);
        } else {
            existingFolders = IJEConfiguration.WORKSPACE_FOLDERS.map(d => d.path);
        }
        existingFolders.forEach(d => {
            this._languages.forEach(language => {
                const json = JSON.stringify({}, null, IJEConfiguration.JSON_SPACE);
                const f = vscode.Uri.file(_path.join(d, language + '.json')).fsPath;
                fs.writeFileSync(f, json);
            });
        });

        //
        let folders: { [key: string]: IJEDataTranslation[] } = this._translations.reduce((r, a) => {
            r[a.folder] = r[a.folder] || [];
            r[a.folder].push(a);
            return r;
        }, {});

        Object.entries(folders).forEach(entry => {
            const [key, value] = entry;
            this._languages.forEach(language => {
                let o = {};

                value
                    .filter(translation => translation.valid)
                    .sort((a, b) => (a.key > b.key ? 1 : -1))
                    .forEach(translation => {
                        if (translation.languages[language]) {
                            this._transformKeysValues(translation.key, translation.languages[language], o);
                        }
                    });

                var json = JSON.stringify(o, null, IJEConfiguration.JSON_SPACE);
                json = json.replace(/\n/g, IJEConfiguration.LINE_ENDING);
                const f = vscode.Uri.file(_path.join(key, language + '.json')).fsPath;
                fs.writeFileSync(f, json);
            });
        });
        vscode.window.showInformationMessage(I18nService.getInstance().t('ui.messages.saved'));
    }

    search(value: string) {
        this._searchPattern = value;
        this._manager.refreshDataTable();
    }

    select(id: number) {
        const translation = this._get(id);
        if (translation) {
            this._view.selectionId = translation.id;

            this._manager.refreshDataTable();
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

    switchView(view: IJEViewType) {
        this._view.type = view;
        this._manager.refreshDataTable();
    }

    async translate(id: number, language: string = '') {
        const translation = this._get(id);
        if (translation && language) {
            await IJETranslationService.translate(translation, language, this._languages);
            this._manager.refreshDataTable();
        }
    }

    update(id: number, value: string, language: string = ''): IJEDataTranslation {
        const translation = this._get(id);
        if (translation) {
            this._view.selectionId = id;
            if (language) {
                translation.languages[language] = value.replace(/\\n/g, '\n');
                this._validate(translation);
            } else {
                const newKey = IJEConfiguration.FORCE_KEY_UPPERCASE ? value.toUpperCase() : value;
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
     * Find empty translations on the current page
     * @param currentPage The current page number
     * @returns Array of translation IDs with empty values
     */
    findEmptyTranslations(currentPage: number): { id: number, language: string }[] {
        const emptyTranslations: { id: number, language: string }[] = [];
        
        // Get hidden languages to ignore
        const hiddenLanguages = IJEConfiguration.HIDDEN_COLUMNS;
        
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
        const hiddenLanguages = IJEConfiguration.HIDDEN_COLUMNS;
        
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
        let separator = IJEConfiguration.KEY_SEPARATOR ? key.indexOf(IJEConfiguration.KEY_SEPARATOR) : -1;
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
            const directories = IJEConfiguration.WORKSPACE_FOLDERS;
            directories.forEach(d => {
                this._loadFolder(d.path);
            });
        }
        
        // Detectar idiomas nuevos (no existían antes de cargar los archivos)
        const newlyAddedLanguages = this._languages.filter(lang => 
            !previousLanguages.includes(lang)
        );
        
        // Obtener configuración actual
        const currentVisibleColumns = IJEConfiguration.VISIBLE_COLUMNS;
        const currentHiddenColumns = IJEConfiguration.HIDDEN_COLUMNS;
        
        // Si no hay configuración guardada de columnas visibles,
        // inicializar para que todas las columnas sean visibles (excepto 'en' que ya es visible por defecto)
        if (this._languages.length > 0) {
            if (currentVisibleColumns.length === 0 && currentHiddenColumns.length === 0) {
                // Primera inicialización - mostrar todos los idiomas
                const columnsToShow = this._languages.filter(lang => lang !== 'en');
                IJEConfiguration.saveVisibleColumns(columnsToShow);
            } else {
                // CASO 1: Idiomas que son completamente nuevos
                // Comprobar si hay nuevos idiomas que no están en las columnas visibles ni ocultas
                const completelyNewLanguages = this._languages.filter(lang => 
                    lang !== 'en' && 
                    !currentVisibleColumns.includes(lang) && 
                    !currentHiddenColumns.includes(lang)
                );
                
                // CASO 2: Idiomas que se volvieron a crear
                // Idiomas que existen ahora, están en la lista de ocultos, pero se acaban de añadir nuevamente
                const recreatedLanguages = newlyAddedLanguages.filter(lang => 
                    lang !== 'en' && 
                    currentHiddenColumns.includes(lang)
                );
                
                // Eliminar idiomas recreados de la lista de ocultos
                if (recreatedLanguages.length > 0) {
                    const updatedHiddenColumns = currentHiddenColumns.filter(
                        lang => !recreatedLanguages.includes(lang)
                    );
                    IJEConfiguration.saveHiddenColumns(updatedHiddenColumns);
                }
                
                // Añadir a columnas visibles tanto los nuevos como los recreados
                const languagesToAdd = [...completelyNewLanguages, ...recreatedLanguages];
                if (languagesToAdd.length > 0) {
                    const updatedColumns = [...currentVisibleColumns, ...languagesToAdd];
                    IJEConfiguration.saveVisibleColumns(updatedColumns);
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
                kv = { ...kv, ...this._getKeysValues(obj[key], _key + key + (IJEConfiguration.KEY_SEPARATOR || '')) };
            } else {
                kv[_key + key] = obj[key];
            }
        }
        return kv;
    }

    /**
     * Get all translation displayed on the view based on the active filters and paging options
     */
    private _getDisplayedTranslations(): IJEDataTranslation[] {
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
                if (this._view.type === IJEViewType.LIST || this._sort.column === I18nService.getInstance().t('ui.labels.keyColumn')) {
                    _a = a.key.toLowerCase();
                    _b = b.key.toLowerCase();
                } else if (this._sort.column === I18nService.getInstance().t('ui.labels.folder')) {
                    _a = a.folder + a.key.toLowerCase();
                    _b = b.folder + b.key.toLowerCase();
                } else {
                    _a = a.languages[this._sort.column] ? a.languages[this._sort.column].toLowerCase() : '';
                    _b = b.languages[this._sort.column] ? b.languages[this._sort.column].toLowerCase() : '';
                }
                return ((this._view.type === IJEViewType.LIST ? true : this._sort.ascending) ? _a > _b : _a < _b) ? 1 : -1;
            });

        this._page.count = o.length;
        this._page.pageSize = this._view.type === IJEViewType.LIST ? 15 : this._page.pageSize;
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
    private _validateImpacted(translation: IJEDataTranslation, key: string = undefined) {
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

    private _validate(translation: IJEDataTranslation, keyChanged: boolean = false) {
        var t = this._validatePath(translation);
        if (translation.key === '') {
            translation.valid = false;
            translation.error = getTranslatedError(IJEDataTranslationError.KEY_NOT_EMPTY);
        } else if (keyChanged) {
            let separator = IJEConfiguration.KEY_SEPARATOR ? this.escapeRegExp(IJEConfiguration.KEY_SEPARATOR) : false;
            //does not start or end with the separator or two consecutive separators
            if (separator && new RegExp(`^${separator}|${separator}{2,}|${separator}$`).test(translation.key)) {
                translation.valid = false;
                translation.error = getTranslatedError(IJEDataTranslationError.INVALID_KEY);
            } else if (this._validatePath(translation).length > 0) {
                translation.valid = false;
                translation.error = getTranslatedError(IJEDataTranslationError.DUPLICATE_PATH);
            } else {
                translation.valid = true;
                translation.error = '';
            }
        }
    }

    private _validatePath(translation: IJEDataTranslation, valid: boolean = true, key: string = undefined) {
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
    private _createFactoryIJEDataTranslation(): IJEDataTranslation {
        return {
            id: this._currentID++,
            folder: !this._manager.isWorkspace ? this._manager.folderPath : this._filteredFolder !== '*' ? this._filteredFolder : IJEConfiguration.WORKSPACE_FOLDERS[0].path,
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

    private _get(id: number): IJEDataTranslation {
        return this._translations.find(t => t.id === id);
    }

    private _getIndex(id: number): number {
        return this._translations.findIndex(t => t.id === id);
    }

    private _insert(translation: IJEDataTranslation) {
        this._translations.push(translation);
    }

    private _split(key: string) {
        if (IJEConfiguration.KEY_SEPARATOR) {
            return key.split(IJEConfiguration.KEY_SEPARATOR);
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
