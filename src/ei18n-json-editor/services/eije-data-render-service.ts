import { EIJEConfiguration } from '../eije-configuration';
import { EIJEDataTranslation } from '../models/eije-data-translation';
import { EIJEPage } from '../models/eije-page';
import { EIJESort } from '../models/eije-sort';
import { I18nService } from '../../i18n/i18n-service';

export class EIJEDataRenderService {
    static renderPagination(translations: EIJEDataTranslation[], page: EIJEPage, withPageSizeSelector: boolean = true) {
        let render = '<div>';
        render += '<div class="row">';
        render += '<div class="col-4">';
        render += '<div class="mt-3">';
        if (page.count === 0) {
            render += '0 ';
        } else {
            var firstEl = (page.pageNumber - 1) * page.pageSize + 1;
            render += `${firstEl}-${firstEl + (translations.length - 1)} `;
        }
        render += `${I18nService.getInstance().t('ui.labels.of')} ${page.count}`;
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
        render += `<li class="page-item ${page.pageNumber + 1 > page.totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="navigate(${
            page.pageNumber + 1
        })">></a></li>`;
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

    private static _getTableHeader(column: string, sort: EIJESort) {
        const isRTL = EIJEConfiguration.isRTL(column);
        const rtlClass = isRTL ? 'rtl-header' : '';
        
        return `<th class="text-center ${rtlClass}" style="cursor: pointer;" onclick="sort('${column}',${sort.column === column ? !sort.ascending : true})" ${isRTL ? 'dir="rtl"' : ''}>
            <div class="th">
           ${column}             
           ${sort.column === column ? (sort.ascending ? '<i class="fa-solid fa-chevron-up"></i>' : '<i class="fa-solid fa-chevron-down"></i>') : ''}
            </div>
        </th>`;
    }

    static renderColumnSelector(languages: string[]) {
        const i18n = I18nService.getInstance();
        const visibleColumns = EIJEConfiguration.VISIBLE_COLUMNS;
        
        let render = '<div class="column-selector">';
        
        render += '<div id="columnSelectorContent" class="column-selector-panel" style="display:none;">';
        render += '<div class="card card-body">';
        render += '<div class="row">';
        
        // Siempre mostrar las columnas de "key" y "en" (deshabilitadas)
        render += '<div class="col-md-3 mb-2">';
        render += '<div class="form-check">';
        render += `<input type="checkbox" class="form-check-input" id="column-key" checked disabled>`;
        render += `<label class="form-check-label" for="column-key">${i18n.t('ui.labels.keyColumn')}</label>`;
        render += '</div>';
        render += '</div>';
        
        languages.forEach(language => {
            const isChecked = language === 'en' || visibleColumns.includes(language);
            const isDisabled = language === 'en'; // No se puede ocultar la columna 'en'
            
            render += '<div class="col-md-3 mb-2">';
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
        render += '<div class="text-right mt-2">';
        render += `<button type="button" id="apply-columns-btn" class="btn btn-vscode" onclick="applyColumnChanges()" disabled>${i18n.t('ui.buttons.apply')}</button>`;
        render += '</div>';
        render += '</div>';
        render += '</div>';
        render += '</div>';
        
        return render;
    }

    static renderTable(translations: EIJEDataTranslation[], languages: string[], page: EIJEPage, sort: EIJESort, showFolder: boolean = true, hasTranslateService = false) {
        // Get visible columns
        const visibleColumns = EIJEConfiguration.VISIBLE_COLUMNS;
        const allLanguages = [...languages]; // Copia para no modificar el original
        
        // Filtrar idiomas según visibilidad
        const filteredLanguages = allLanguages.filter(lang => 
            lang === 'en' || visibleColumns.includes(lang)
        );
        
        // Crear selector de columnas
        let render = this.renderColumnSelector(languages);
        
        render += '<table class="table table-borderless">';
        render += '<tr>';
        render += '<th></th>';
        if (showFolder) {
            render += this._getTableHeader(I18nService.getInstance().t('ui.labels.folder'), sort);
        }
        render += this._getTableHeader(I18nService.getInstance().t('ui.labels.keyColumn'), sort);

        // Solo mostrar los encabezados de las columnas visibles
        filteredLanguages.forEach((language: string) => {
            render += `${this._getTableHeader(language, sort)}`;
        });
        render += '</tr>';

        translations.forEach(t => {
            render += '<tr>';
            render += `<td class="td-remove"><button type="button" class="btn p-0 px-1" onclick="remove(${t.id})"><i class="error-vscode fa-duotone fa-regular fa-circle-minus"></i></button></td>`;

            if (showFolder) {
                render += `<td><select id="select-folder-${t.id}" class="form-control" onchange="updateFolder(this,${t.id})">`;
                const folders = EIJEConfiguration.WORKSPACE_FOLDERS;
                folders.forEach(d => {
                    render += `<option value='${d.path.replace(/"/g, '&quot;')}' ${d.path === t.folder ? 'selected' : ''}>${d.name}</option>`;
                });
                render += ' </select></td>';
            }

            render += `
                <td>
                    <input id="input-key-${t.id}" class="form-control ${t.valid ? '' : 'is-invalid'}" type="text" placeholder="${I18nService.getInstance().t('ui.placeholders.key')}" value="${t.key.replace(
                /"/g,
                '&quot;'
            )}" onfocus="mark(${t.id})" oninput="updateInput(this,${t.id});" onchange="updateInput(this,${t.id});" />
                    <div id="input-key-${t.id}-feedback" class="invalid-feedback error-vscode">${t.error}</div>
                </td>
            `;

            // Solo mostrar las celdas de las columnas visibles
            filteredLanguages.forEach((language: string) => {
                const isRTL = EIJEConfiguration.isRTL(language);
                const rtlClass = isRTL ? 'rtl-text' : '';
                
                render += '<td>';
                if (hasTranslateService) {
                    render += `<div class="input-group">`;
                }
                const isEmpty = !t.languages[language] || t.languages[language].trim() === '';
                render += `<input class="form-control ${rtlClass} ${isEmpty ? 'empty-translation' : ''}" type="text" placeholder="${I18nService.getInstance().t('ui.placeholders.translation')}" 
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

    static renderList(
        translations: EIJEDataTranslation[],
        selectTranslation: EIJEDataTranslation,
        languages: string[],
        page: EIJEPage,
        sort: EIJESort,
        showFolder: boolean = true,
        hasTranslateService = false
    ) {
        // Get visible columns
        const visibleColumns = EIJEConfiguration.VISIBLE_COLUMNS;
        const allLanguages = [...languages]; // Copia para no modificar el original
        
        // Filtrar idiomas según visibilidad
        const filteredLanguages = allLanguages.filter(lang => 
            lang === 'en' || visibleColumns.includes(lang)
        );
        
        let render = this.renderColumnSelector(languages);
        
        render += '<div>';
        render += '<div class="row">';
        render += '<div class="col-5 pt-15px">';
        render += this.renderPagination(translations, page, false);
        render += '<div style="word-wrap: break-word;" class="list-group">';
        translations.forEach(t => {
            render += `<a href="#" id="select-key-${t.id}" onclick="select(${t.id})" class="btn-vscode-secondary list-group-item list-group-item-action ${
                selectTranslation && selectTranslation.id === t.id ? 'active' : ''
            }">${t.key === '' ? '&nbsp;' : t.key}</a>`;
        });
        render += '</div>';
        render += '</div>';

        render += '<div class="col-7">';

        if (selectTranslation) {
            if (showFolder) {
                render += ` 
                  <div class="form-group">
                    <label>${I18nService.getInstance().t('ui.labels.directory')}</label>
                    <div class="row">
                      <div class="col-12">
                        <select id="select-folder-${selectTranslation.id}" class="form-control" onchange="updateFolder(this,${selectTranslation.id})">`;

                const folders = EIJEConfiguration.WORKSPACE_FOLDERS;
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
                    <label>${I18nService.getInstance().t('ui.labels.key')}</label>
                    <div class="row ml--30 mr--18">
                        <div class="col-1 p-0 align-content-center div-remove">
                            <button type="button" class="btn p-0 px-1" onclick="remove(${selectTranslation.id})"><i class="error-vscode fa-duotone fa-regular fa-circle-minus"></i></button>
                        </div>
                        <div class="col-11 p-0">
                            <input id="input-key-${selectTranslation.id}" class="form-control ${
                selectTranslation.valid ? '' : 'is-invalid'
            }" type="text" placeholder="${I18nService.getInstance().t('ui.placeholders.key')}" value="${selectTranslation.key}" oninput="updateInput(this,${selectTranslation.id});" onchange="updateInput(this,${selectTranslation.id});" />
                            <div id="input-key-${selectTranslation.id}-feedback" class="invalid-feedback error-vscode">${selectTranslation.error}</div>
                        </div>
                    </div>
                </div>`;
            
            // Solo mostrar los campos de texto de los idiomas visibles
            filteredLanguages.forEach((language: string) => {
                const isRTL = EIJEConfiguration.isRTL(language);
                const rtlClass = isRTL ? 'rtl-text' : '';
                
                render += `<label>${language}</label>`;
                if (hasTranslateService) {
                    render += `<div class="row">
                                    <div class="col-10">`;
                }
                render += `<textarea class="form-control mb-2 ${rtlClass}" rows="6" 
                    placeholder="${I18nService.getInstance().t('ui.placeholders.translation')}" 
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
