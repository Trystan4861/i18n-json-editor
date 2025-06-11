import axios from 'axios';
import { EIJEConfiguration } from '../../eije-configuration';
import { EIJETranlsation } from './eije-translation';

export class EIJEMicrosoftTranslator implements EIJETranlsation {
    async translate(text: string, language: string, languages: string[]): Promise<{ [language: string]: string }> {
        const endpoint = 'https://api.cognitive.microsofttranslator.com';

        var response = await axios({
            baseURL: endpoint,
            url: '/translate',
            method: 'post',
            headers: {
                'Ocp-Apim-Subscription-Key': EIJEConfiguration.TRANSLATION_SERVICE_API_KEY,
                'Content-type': 'application/json'
            },
            params: {
                'api-version': '3.0',
                from: language,
                to: languages.filter(l => l !== language)
            },
            data: [
                {
                    text: text
                }
            ],
            responseType: 'json'
        });

        const data = response.data;

        if (data.length === 0) {
            return {};
        }

        return Object.assign(
            {},
            ...languages
                .filter(l => l !== language)
                .map(l => ({
                    [l]: data[0].translations.filter(t => t.to === l)[0].text as string
                }))
        );
    }
}
