import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold">MarketingAI</span>
        </div>
        <div className="flex gap-4">
          <Link href="/api/auth/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/api/auth/login">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full">
              AI-Powered Marketing
            </span>
          </div>
          
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Generate Perfect Headlines
            <br />
            in Seconds
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your marketing with AI-powered headline generation. 
            Get SEO-optimized, compelling headlines that convert.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/api/auth/login">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-blue-600">10K+</div>
              <div className="text-gray-600">Headlines Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">98%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-gray-600">AI Availability</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose MarketingAI?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-600">
                Advanced AI models generate compelling headlines tailored to your keywords.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">SEO Optimized</h3>
              <p className="text-gray-600">
                Built-in SEO checker ensures your headlines are search-engine friendly.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Fast</h3>
              <p className="text-gray-600">
                Enterprise-grade security with lightning-fast generation speeds.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="text-center text-gray-600">
          <p>© 2025 MarketingAI. Built for Technical Challenge.</p>
        </div>
      </footer>
    </div>
  );
}
