import { EIJEConfiguration } from '../../eije-configuration';
import { EIJETranlsation } from './eije-translation';

export class EIJEMicrosoftTranslator implements EIJETranlsation {
    async translate(text: string, language: string, languages: string[]): Promise<{ [language: string]: string }> {
        const endpoint = 'https://api.cognitive.microsofttranslator.com';
        const targetLanguages = languages.filter(l => l !== language);
        
        // Construir la URL con los parámetros de consulta
        const url = new URL('/translate', endpoint);
        url.searchParams.append('api-version', '3.0');
        url.searchParams.append('from', language);
        targetLanguages.forEach(lang => {
            url.searchParams.append('to', lang);
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': EIJEConfiguration.TRANSLATION_SERVICE_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([{ text }])
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                return {};
            }

            return Object.assign(
                {},
                ...targetLanguages.map(l => ({
                    [l]: data[0].translations.filter(t => t.to === l)[0]?.text || ''
                }))
            );
        } catch (error) {
            console.error('Translation error:', error);
            return {};
        }
    }
}
