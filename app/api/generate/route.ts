import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

// Función para analizar SEO
function analyzeSEO(headline: string, keyword: string) {
  const headlineLength = headline.length;
  const wordCount = headline.split(/\s+/).length;
  
  // Calcular densidad de keyword
  const keywordLower = keyword.toLowerCase();
  const headlineLower = headline.toLowerCase();
  const keywordOccurrences = (headlineLower.match(new RegExp(keywordLower, 'g')) || []).length;
  const keywordDensity = wordCount > 0 ? (keywordOccurrences / wordCount) * 100 : 0;

  // Análisis de longitud ideal (50-60 caracteres para SEO)
  let lengthScore = 'good';
  let lengthMessage = 'Perfect length for SEO';
  
  if (headlineLength < 40) {
    lengthScore = 'warning';
    lengthMessage = 'Too short - consider adding more context';
  } else if (headlineLength > 70) {
    lengthScore = 'warning';
    lengthMessage = 'Too long - might be truncated in search results';
  }

  // Análisis de keyword density (ideal 1-3%)
  let densityScore = 'good';
  let densityMessage = 'Good keyword usage';
  
  if (keywordDensity === 0) {
    densityScore = 'error';
    densityMessage = 'Keyword not found in headline';
  } else if (keywordDensity < 5) {
    densityScore = 'warning';
    densityMessage = 'Low keyword presence';
  } else if (keywordDensity > 15) {
    densityScore = 'warning';
    densityMessage = 'Too much keyword repetition (keyword stuffing)';
  }

  return {
    length: headlineLength,
    wordCount,
    keywordDensity: keywordDensity.toFixed(1),
    lengthScore,
    lengthMessage,
    densityScore,
    densityMessage,
    hasKeyword: keywordOccurrences > 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const res = new NextResponse();
    const session = await getSession(request, res);
    if (!session || !session.user) {
      console.error('No session found in generate');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyword } = await request.json();

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    // Verificar API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
    }

    // Inicializar Groq (usa el SDK de OpenAI con el endpoint de Groq)
    const groq = new OpenAI({ 
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1'
    });

    // Prompt optimizado para generar headlines de marketing
    const prompt = `You are an expert marketing copywriter. Generate 3 compelling, creative, and conversion-focused marketing headlines for the keyword: "${keyword}".

Requirements:
- Each headline should be 50-60 characters long
- Include the keyword naturally
- Make them attention-grabbing and actionable
- Focus on benefits and value
- Use power words when appropriate

Format your response as a JSON array with exactly 3 headlines:
["headline 1", "headline 2", "headline 3"]

Only respond with the JSON array, nothing else.`;

    // Llamar a Groq API (ultra rápido!)
    const completion = await groq.chat.completions.create({
      model:  'llama-3.3-70b-versatile', // Modelo gratuito de Groq
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing copywriter. Always respond with valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 500,
    });

    const text = completion.choices[0].message.content || '';

    // Intentar parsear la respuesta como JSON
    let headlines: string[];
    try {
      // Limpiar la respuesta para extraer solo el JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        headlines = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: dividir por líneas
        headlines = text
          .split('\n')
          .filter(line => line.trim().length > 0 && !line.includes('[') && !line.includes(']'))
          .map(line => line.replace(/^["'\-\d.)\s]+/, '').replace(/["']$/, '').trim())
          .filter(line => line.length > 0)
          .slice(0, 3);
      }
    } catch (e) {
      // Si falla el parsing, dividir manualmente
      headlines = text
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3);
    }

    // Asegurar que tengamos exactamente 3 headlines
    if (headlines.length < 3) {
      headlines = [
        ...headlines,
        ...Array(3 - headlines.length).fill(`${keyword} - Transform Your Business Today`),
      ];
    }

    // Analizar SEO de cada headline
    const headlinesWithSEO = headlines.slice(0, 3).map(headline => ({
      text: headline,
      seo: analyzeSEO(headline, keyword),
    }));

    return NextResponse.json({
      success: true,
      keyword,
      headlines: headlinesWithSEO,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error generating headlines:', error);
    return NextResponse.json(
      { error: 'Failed to generate headlines', details: error.message },
      { status: 500 }
    );
  }
}
