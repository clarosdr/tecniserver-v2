
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingChunk } from "../types.ts";

// Ensure API_KEY is available in the environment.
// In a real frontend app, this key should be handled securely, possibly via a backend proxy.
// For this exercise, we assume process.env.API_KEY is accessible.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn(
    "Gemini API key not found. Please set the API_KEY environment variable."
  );
}

// FIX: Initialize with named apiKey parameter
const ai = new GoogleGenAI({ apiKey: API_KEY || "YOUR_API_KEY_PLACEHOLDER" }); // Fallback for environment where process.env is not set up
// FIX: Use recommended model
const modelName = 'gemini-2.5-flash';

export const generateDiagnosticTemplate = async (problemDescription: string): Promise<string> => {
  if (!API_KEY) return "Error: API Key not configured.";
  try {
    const prompt = `
      Eres un técnico experto en reparación de computadoras.
      Genera una plantilla de diagnóstico estructurada y detallada para el siguiente problema técnico.
      La plantilla debe incluir pasos claros para la solución de problemas, cubriendo verificaciones de hardware, software y posibles soluciones comunes.
      Formatea la salida como una lista de pasos numerados, con sub-pasos si es necesario. Usa Markdown para el formato.

      Problema: "${problemDescription}"

      Ejemplo de formato esperado si el problema fuera "La laptop no enciende":
      ### Plantilla de Diagnóstico: La laptop no enciende

      **1. Verificación de Alimentación Eléctrica:**
         1.1. Asegurar que el cargador esté correctamente conectado tanto a la laptop como a una toma de corriente funcional.
         1.2. Probar con un cargador diferente compatible, si está disponible.
         1.3. Observar si el LED indicador de carga de la laptop se enciende al conectar el cargador.
         1.4. Intentar encender la laptop sin la batería (si es extraíble) usando solo el cargador.

      **2. Verificación de Batería (si aplica):**
         2.1. Si la batería es extraíble, retirarla, limpiar los contactos y volver a insertarla.
         2.2. Comprobar si la laptop enciende solo con la batería (sin el cargador).

      **3. Comprobaciones de Hardware Básico:**
         3.1. **RAM:** Si es accesible, intentar reseating de los módulos de RAM. Probar con un solo módulo si hay varios.
         3.2. **Disco Duro/SSD:** Escuchar si el disco duro hace ruidos inusuales (clics).
         3.3. **Periféricos:** Desconectar todos los periféricos externos (USB, monitor externo, etc.) e intentar encender.

      **4. Pruebas de Pantalla:**
         4.1. Conectar la laptop a un monitor externo para descartar un problema de la pantalla interna.
         4.2. Iluminar la pantalla con una linterna para ver si hay una imagen muy tenue (podría indicar un fallo del backlight).

      **5. Indicadores y Sonidos:**
         5.1. Prestar atención a cualquier secuencia de pitidos o luces LED parpadeantes, ya que pueden indicar códigos de error específicos del fabricante.

      **6. Restablecimiento de Hardware (Hard Reset):**
         6.1. Desconectar el cargador y retirar la batería (si es posible).
         6.2. Mantener presionado el botón de encendido durante 30-60 segundos.
         6.3. Volver a conectar el cargador (sin batería primero) e intentar encender. Luego, probar con la batería.

      **7. Consideraciones Avanzadas:**
         7.1. Posible fallo de la placa base.
         7.2. Problema con el botón de encendido.
    `;

    // FIX: Updated API call structure
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
    });
    
    // FIX: Access text directly from response
    return response.text;

  } catch (error) {
    console.error("Error generating diagnostic template:", error);
    return `Error al generar plantilla: ${error instanceof Error ? error.message : String(error)}`;
  }
};


export const getWebSearchResults = async (query: string): Promise<{ text: string; sources: GroundingChunk[] }> => {
  if (!API_KEY) return { text: "Error: API Key not configured.", sources: [] };
  try {
    // FIX: Updated API call structure
    const response = await ai.models.generateContent({
      model: modelName,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // FIX: Access text directly from response
    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks || [];
    
    return { text, sources };

  } catch (error) {
    console.error("Error performing web search:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("grounding")) {
        return { text: `Error con la búsqueda web: ${errorMessage}. La búsqueda web puede no estar disponible para este modelo o configuración.`, sources: [] };
    }
    return { text: `Error en la búsqueda: ${errorMessage}`, sources: [] };
  }
};