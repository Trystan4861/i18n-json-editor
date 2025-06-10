import { IJEConfiguration } from '../ije-configuration';
import { IJEDataTranslation } from '../models/ije-data-translation';
import { IJEPage } from '../models/ije-page';
import { IJESort } from '../models/ije-sort';
import { I18nService } from '../../i18n/i18n-service';

export class IJEDataRenderService {
    static renderPagination(translations: IJEDataTranslation[], page: IJEPage, withPageSizeSelector: boolean = true) {
        let render = '<div class="container-fluid">';
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

    private static _getTableHeader(column: string, sort: IJESort) {
        return `<th class="text-center" style="cursor: pointer;" onclick="sort('${column}',${sort.column === column ? !sort.ascending : true})">
           ${column}             
           ${sort.column === column ? (sort.ascending ? '<i class="icon-up-open"></i>' : '<i class="icon-down-open"></i>') : ''}
            
        </th>`;
    }

    static renderTable(translations: IJEDataTranslation[], languages: string[], page: IJEPage, sort: IJESort, showFolder: boolean = true, hasTranslateService = false) {
        let render = '<table class="table table-borderless">';
        render += '<tr>';
        render += '<th></th>';
        if (showFolder) {
            render += this._getTableHeader('FOLDER', sort);
        }
        render += this._getTableHeader('KEY', sort);

        languages.forEach((language: string) => {
            render += `${this._getTableHeader(language, sort)}`;
        });
        render += '</tr>';

        translations.forEach(t => {
            render += '<tr>';
            render += `<td><button type="button" class="btn" onclick="remove(${t.id})"><i class="error-vscode icon-trash-empty"></i></button></td>`;

            if (showFolder) {
                render += `<td><select id="select-folder-${t.id}" class="form-control" onchange="updateFolder(this,${t.id})">`;
                const folders = IJEConfiguration.WORKSPACE_FOLDERS;
                folders.forEach(d => {
                    render += `<option value='${d.path.replace(/"/g, '&quot;')}' ${d.path === t.folder ? 'selected' : ''}>${d.name}</option>`;
                });
                render += ' </select></td>';
            }

            render += `
                <td>
                    <input id="input-key-${t.id}" class="form-control ${t.valid ? '' : 'is-invalid'}" type="text" placeholder="Key..." value="${t.key.replace(
                /"/g,
                '&quot;'
            )}" onfocus="mark(${t.id})" onchange="updateInput(this,${t.id});" />
                    <div id="input-key-${t.id}-feedback" class="invalid-feedback error-vscode">${t.error}</div>
                </td>
            `;

            languages.forEach((language: string) => {
                render += '<td>';
                if (hasTranslateService) {
                    render += `<div class="input-group">`;
                }
                render += `<input class="form-control" type="text" placeholder="Translation..." onfocus="mark(${t.id})" onchange="updateInput(this,${t.id},'${language}');" `;
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
        translations: IJEDataTranslation[],
        selectTranslation: IJEDataTranslation,
        languages: string[],
        page: IJEPage,
        sort: IJESort,
        showFolder: boolean = true,
        hasTranslateService = false
    ) {
        let render = '<div class="container-fluid">';
        render += '<div class="row">';
        render += '<div class="col-5">';
        render += '<div style="word-wrap: break-word;" class="list-group">';
        translations.forEach(t => {
            render += `<a href="#" id="select-key-${t.id}" onclick="select(${t.id})" class="btn-vscode-secondary list-group-item list-group-item-action ${
                selectTranslation && selectTranslation.id === t.id ? 'active' : ''
            }">${t.key === '' ? '&nbsp;' : t.key}</a>`;
        });
        render += '</div>';
        render += this.renderPagination(translations, page, false);
        render += '</div>';

        render += '<div class="col-7">';

        if (selectTranslation) {
            if (showFolder) {
                render += ` 
                  <div class="form-group">
                    <label>Directory</label>
                    <div class="row">
                      <div class="col-12">
                        <select id="select-folder-${selectTranslation.id}" class="form-control" onchange="updateFolder(this,${selectTranslation.id})">`;

                const folders = IJEConfiguration.WORKSPACE_FOLDERS;
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
                    <label>Key</label>
                    <div class="row">
                        <div class="col-10">
                            <input id="input-key-${selectTranslation.id}" class="form-control ${
                selectTranslation.valid ? '' : 'is-invalid'
            }" type="text" placeholder="Key..." value="${selectTranslation.key}" onchange="updateInput(this,${selectTranslation.id});" />
                            <div id="input-key-${selectTranslation.id}-feedback" class="invalid-feedback error-vscode">${selectTranslation.error}</div>
                        </div>
                 
                        <div class="col-2">
                            <button type="button" class="btn" onclick="remove(${selectTranslation.id})"><i class=" error-vscode icon-trash-empty"></i></button>
                        </div>
                    </div>
                </div>`;
            languages.forEach((language: string) => {
                render += `<label>${language}</label>`;
                if (hasTranslateService) {
                    render += `<div class="row">
                                    <div class="col-10">`;
                }
                render += `<textarea class="form-control mb-2" rows="6" placeholder="Translation..." onchange="updateInput(this,${selectTranslation.id},'${language}');">`;
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
