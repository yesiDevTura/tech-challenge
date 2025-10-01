import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

// Función para analizar SEO
function analyzeSEO(headline: string, keyword: string) {
  const headlineLength = headline.length;
  const wordCount = headline.split(/\s+/).length;
  
  const keywordLower = keyword.toLowerCase();
  const headlineLower = headline.toLowerCase();
  const keywordOccurrences = (headlineLower.match(new RegExp(keywordLower, 'g')) || []).length;
  const keywordDensity = wordCount > 0 ? (keywordOccurrences / wordCount) * 100 : 0;

  let lengthScore = 'good';
  let lengthMessage = 'Perfect length for SEO';
  
  if (headlineLength < 40) {
    lengthScore = 'warning';
    lengthMessage = 'Too short - consider adding more context';
  } else if (headlineLength > 70) {
    lengthScore = 'warning';
    lengthMessage = 'Too long - might be truncated in search results';
  }

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
    const body = await request.json();
    const { keyword, userId, userEmail } = body;

    // Validar datos
    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
    }

    const groq = new OpenAI({ 
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1'
    });

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

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
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

    let headlines: string[];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        headlines = JSON.parse(jsonMatch[0]);
      } else {
        headlines = text
          .split('\n')
          .filter(line => line.trim().length > 0 && !line.includes('[') && !line.includes(']'))
          .map(line => line.replace(/^["'\-\d.)\s]+/, '').replace(/["']$/, '').trim())
          .filter(line => line.length > 0)
          .slice(0, 3);
      }
    } catch (e) {
      headlines = text
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3);
    }

    if (headlines.length < 3) {
      headlines = [
        ...headlines,
        ...Array(3 - headlines.length).fill(`${keyword} - Transform Your Business Today`),
      ];
    }

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