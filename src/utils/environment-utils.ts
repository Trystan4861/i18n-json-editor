/**
 * Utilidades relacionadas con el entorno de ejecución
 */
export class EnvironmentUtils {
    /**
     * Determina si la aplicación está ejecutándose en un entorno web
     * @returns {boolean} Siempre retorna false ya que la aplicación solo funciona en entorno de escritorio
     */
    public static isWebEnvironment(): boolean {
        // Siempre retornamos false ya que temporalmente sólo funcionará en escritorio
        return false;
    }
}