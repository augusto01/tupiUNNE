const { SchemaType } = require('@google/generative-ai');
const { genAI } = require('../config/gemini.js');

const analizarExpediente = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se ha adjuntado ningún archivo PDF.' 
      });
    }

    const pdfBase64 = req.file.buffer.toString('base64');

    // Esquema de respuesta JSON para el SDK estándar
    const schemaAnalisis = {
      type: SchemaType.OBJECT,
      properties: {
        resumen_general: {
          type: SchemaType.STRING,
          description: 'Resumen conciso y claro de 2 a 4 oraciones indicando el objeto principal o trámite del expediente.',
        },
        tiene_examen_tecnico: {
          type: SchemaType.BOOLEAN,
          description: 'True únicamente si existe una pericia, informe técnico, inspección o dictamen de un especialista en el documento.',
        },
        detalle_examen_tecnico: {
          type: SchemaType.STRING,
          description: 'Breve síntesis del dictamen o conclusión técnica en caso de existir; o null si no posee.',
          nullable: true,
        },
        listado_bienes: {
          type: SchemaType.ARRAY,
          description: 'Lista completa de todos los bienes, equipos, inmuebles o insumos detallados en el expediente.',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              bien: { type: SchemaType.STRING, description: 'Nombre, denominación o tipo del bien' },
              descripcion: { type: SchemaType.STRING, description: 'Detalles, especificaciones técnicas, números de serie, marca o cantidad' },
              estado: { type: SchemaType.STRING, description: 'Estado de conservación consignado (p. ej., Bueno, Regular, Desuso, etc.) o N/A' },
            },
            required: ['bien', 'descripcion'],
          },
        },
      },
      required: ['resumen_general', 'tiene_examen_tecnico', 'listado_bienes'],
    };

    // Inicializamos el modelo de la API gratuita directa de Google AI Studio
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schemaAnalisis,
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64,
        },
      },
      `Analiza el expediente adjunto. 
       Examina todas las páginas, incluyendo posibles listas escaneadas, tablas manuscritas o planillas. 
       Extrae la información respetando estrictamente la estructura solicitada.`,
    ]);

    const responseText = result.response.text();
    const datosAnalizados = JSON.parse(responseText);

    return res.status(200).json({
      success: true,
      data: datosAnalizados,
    });

  } catch (error) {
    console.error('Error al procesar el expediente:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al analizar el expediente con Inteligencia Artificial.',
      error: error.message,
    });
  }
};

module.exports = { analizarExpediente };