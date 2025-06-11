export interface EIJEDataTranslation {
    id: number;
    folder: string;
    key: string;
    valid: boolean;
    error: string;
    languages: { [language: string]: string };
}

import { I18nService } from '../../i18n/i18n-service';

export enum EIJEDataTranslationError {
    INVALID_KEY = 'ui.errors.invalidKey',
    KEY_NOT_EMPTY = 'ui.errors.keyNotEmpty',
    DUPLICATE_PATH = 'ui.errors.duplicatePath'
}

// Helper function to get translated error message
export function getTranslatedError(error: EIJEDataTranslationError): string {
    return I18nService.getInstance().t(error);
}
