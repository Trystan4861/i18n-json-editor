import { EIJEConfiguration } from '../eije-configuration';
import { EIJEDataTranslation } from '../models/eije-data-translation';
import { EIJEMicrosoftTranslator } from './translations/eije-microsoft-translator';
import { EIJETranlsation } from './translations/eije-translation';

export abstract class EIJETranslationService {
    public static async translate(translation: EIJEDataTranslation, language: string, languages: string[]) {
        const tranlsationService = EIJEConfiguration.TRANSLATION_SERVICE;

        if (!tranlsationService || !EIJEConfiguration.TRANSLATION_SERVICE_API_KEY) {
            return;
        }
        let service: EIJETranlsation;
        if (EIJEConfiguration.TRANSLATION_SERVICE === TranslationServiceEnum.MicrosoftTranslator) {
            service = new EIJEMicrosoftTranslator();
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

export enum TranslationServiceEnum {
    MicrosoftTranslator = 'MicrosoftTranslator'
}
