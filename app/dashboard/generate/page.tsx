'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface SEOAnalysis {
  length: number;
  wordCount: number;
  keywordDensity: string;
  lengthScore: string;
  lengthMessage: string;
  densityScore: string;
  densityMessage: string;
  hasKeyword: boolean;
}

interface Headline {
  text: string;
  seo: SEOAnalysis;
}

export default function GeneratePage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [error, setError] = useState('');
  const { user } = useUser();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim()) {
      setError('Please enter a keyword');
      return;
    }

    setLoading(true);
    setError('');
    setHeadlines([]);

    try {
      //const { user } = useUser();
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          keyword: keyword.trim(),
          userId: user?.sub,
          userEmail: user?.email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate headlines');
      }

      setHeadlines(data.headlines);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">AI Headline Generator</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Generator Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Marketing Headlines</CardTitle>
            <CardDescription>
              Enter a keyword and our AI will generate compelling, SEO-optimized headlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword</Label>
                <Input
                  id="keyword"
                  placeholder="e.g., AI Marketing, Cloud Storage, Fitness App..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Headlines...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Headlines
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {headlines.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Generated Headlines</h2>
            
            {headlines.map((headline, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="text-lg">
                    Headline {index + 1}
                  </CardTitle>
                  <p className="text-xl font-semibold text-gray-800 mt-2">
                    {headline.text}
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">
                      📊 SEO Analysis
                    </h3>
                    
                    {/* Length Analysis */}
                    <div className={`p-3 rounded-md border ${getScoreColor(headline.seo.lengthScore)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {getScoreIcon(headline.seo.lengthScore)}
                        <span className="font-medium text-sm">Length: {headline.seo.length} characters</span>
                      </div>
                      <p className="text-xs ml-6">{headline.seo.lengthMessage}</p>
                    </div>

                    {/* Keyword Density */}
                    <div className={`p-3 rounded-md border ${getScoreColor(headline.seo.densityScore)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {getScoreIcon(headline.seo.densityScore)}
                        <span className="font-medium text-sm">
                          Keyword Density: {headline.seo.keywordDensity}%
                        </span>
                      </div>
                      <p className="text-xs ml-6">{headline.seo.densityMessage}</p>
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-2 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-600">Word Count</p>
                        <p className="font-semibold">{headline.seo.wordCount}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-600">Contains Keyword</p>
                        <p className="font-semibold">
                          {headline.seo.hasKeyword ? '✅ Yes' : '❌ No'}
                        </p>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        navigator.clipboard.writeText(headline.text);
                      }}
                    >
                      Copy Headline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        {headlines.length === 0 && !loading && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Enter a keyword related to your product or service</li>
                    <li>• AI generates 3 unique, compelling headlines</li>
                    <li>• Each headline includes SEO analysis</li>
                    <li>• Check keyword density and optimal length</li>
                    <li>• Copy and use in your marketing campaigns</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
