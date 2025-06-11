export interface EIJETranlsation {
    translate(text: string, language: string, languages: string[]): Promise<{ [language: string]: string }>;
}
