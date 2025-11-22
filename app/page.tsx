import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight
} from 'lucide-react';
import { InteractiveChatbox } from '@/app/components/ui/interactive-chatbox';
import SampleConversation from '@/app/components/chat/sample-conversation';
import AdvisorCarousel from "@/app/components/AdvisorCarousel";

// Feature card data 
const FEATURES = [
  {
    title: 'AI Career Advisor',
    description: 'Chat with your personal AI advisor anytime, anywhere. Get instant answers about majors, career options, course selections, and more. It\'s like having a career counselor in your pocket.',
    benefits: [
      'Personalized career recommendations',
      '24/7 availability',
      'Context-aware conversations'
    ]
  },
  {
    title: 'Academic Roadmap',
    description: 'Visualize your entire journey from day one to graduation and beyond. Get clear, step-by-step guidance on courses, skills, and milestones to reach your goals.',
    benefits: [
      'Interactive visual timelines',
      'Customized for your major',
      'Semester-by-semester planning'
    ]
  },
  {
    title: 'Connect with Mentor',
    description: 'Get guidance from academic advisors and discover student clubs that align with your interests. Build relationships and join communities that support your academic and career goals.',
    benefits: [
      'Connect with academic advisors',
      'Discover relevant clubs',
      'Join student communities'
    ]
  }
] as const;

// Footer links 
const FOOTER_SECTIONS = [
  {
    title: 'Platform',
    links: [
      { href: '/login', label: 'Dashboard' },
      { href: '/Chat', label: 'Explore' },
      { href: '/Roadmap', label: 'Roadmap' },
      { href: '/Mentors', label: 'Mentors' }
    ]
  },
  {
    title: 'Support',
    links: [
      { href: '#', label: 'Help Center' },
      { href: '#', label: 'Contact Us' },
      { href: '#', label: 'FAQ' }
    ]
  },
  {
    title: 'University of Hawaii',
    links: [
      { href: '#', label: 'About UH' },
      { href: '#', label: 'Academic Resources' },
      { href: '#', label: 'Career Services' }
    ]
  }
] as const;

export default async function Home() {
  const session = await getSession();

  // If the user is authenticated, send them to the dashboard (which lives
  // under the `(with-sidebar)` route group so it includes the sidebar).
  if (session) {
    redirect('/Chat');
  }

  // Otherwise render the public landing page
  return (
    <div className="min-h-screen bg-[#fefffc] font-[family-name:var(--font-mondwest,PPMondwest,system-ui,sans-serif)]">
  {/* Header */}
  <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-md bg-white/60">
        <div className="flex items-center justify-between px-6 lg:px-12 py-4 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-4xl font-bold text-gray-700 hover:text-gray-500 transition-colors">
              Pathfinity
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="inline-flex items-center px-5 py-2 rounded-full bg-white border border-gray-300 text-black text-sm font-medium hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg transition-all duration-200 hover:scale-101"
            >
              Log in
            </Link>
            <Link 
              href="/login?signup=true" 
              className="inline-flex items-center px-6 py-2.5 rounded-full bg-black border border-gray-300 text-white text-sm font-medium hover:bg-gray-800 hover:border-gray-400 hover:shadow-lg transition-all duration-200 hover:scale-101"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

  {/* Hero Section */}
  <main className="pt-20 pb-20 px-6">
        <section className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              Discover your career pathway{' '} with natural language
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Get personalized career advice, visualize your path to success, and connect with mentors—all powered by AI. 
              Pathfinity is your intelligent companion for navigating your academic and career journey at University of Hawaii.
            </p>

          </div>

          {/* Hero Image with Interactive Chatbox */}
          <div className="max-w-6xl mx-auto mb-42 relative">
            <div className="relative rounded-xl shadow-2xl overflow-hidden">
              <Image 
                src="/hero-anim-bg-2.webp" 
                alt="Pathfinity Platform" 
                width={1200}
                height={800}
                className="w-full h-[450px] object-cover"
                priority
              />
              
              {/* Interactive Chatbox centered both horizontally and vertically */}
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <InteractiveChatbox />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto mb-42">
          <div className="text-center mb-24">
            <p className="text-3xl text-black-600">Here&apos;s some of the things Pathfinity can do for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <div 
                key={index}
                className="bg-#fefffc rounded-2xl p-8 shadow-md hover:shadow-xl transition-all border-2 border-gray-100 hover:border-gray-300"
              >
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Secondary Hero Image (AI animation with Sample Conversation) */}
        <div className="max-w-7xl mx-auto mb-60">
          <div className="relative rounded-xl shadow-2xl overflow-hidden">
            <Image
              src="/ai-anim-bg.webp"
              alt="AI animation"
              width={1200}
              height={800}
              className="w-full h-[640px] object-cover"
              priority
            />
            {/* Sample Conversation Overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="w-full max-w-5xl">
                <SampleConversation />
              </div>
            </div>
          </div>
          <p className="mt-12 mx-auto max-w-[600px] text-center text-black-600 text-lg">
            View a customized roadmap showing exactly what courses to take, skills to develop, and milestones to hit each semester on your path to success.
          </p>
        </div>

        <div className="text-center mb-24">
            {/* <h2 className="text-4xl font-bold mb-4">Three Powerful Tools, One Platform</h2> */}
            <p className="text-3xl text-black-600">Connect with academic advisors to plan courses tailored to your career path</p>
        </div>

        {/* Agents image + support block */}
        <div className="max-w-7xl mx-auto mb-72 relative">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-end">
            <div className="lg:col-span-3 relative">
              <Image
                src="/agents-bg-img.webp"
                alt="Advisors and agents"
                width={1200}
                height={1000}
                className="w-full h-[640px] object-cover rounded-xl shadow-2xl"
                priority={false}
              />
              {/* Advisor Carousel Overlay */}
              <AdvisorCarousel />
            </div>

            <div className="lg:col-span-1 flex items-end">
              <div className="w-full">
                <p className="text-2xl lg:text-3xl font-semibold text-gray-800 text-left">
                  Build a network that supports your journey
                </p>
                <p className="mt-4 text-gray-600 text-base">
                  Build relationships - discover students clubs and join communities that align with your interests and academic/career goals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto">
          <div className="bg-#fefffc rounded-3xl p-8 lg:p-12 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-black mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Join hundreds of UH students who are already discovering their path to success with Pathfinity.
            </p>
            <Link 
              href="/login?signup=true" 
              className="inline-flex items-center justify-center px-10 py-5 rounded-4xl bg-black text-white font-bold text-lg hover:shadow-2xl transition-all duration-200 hover:scale-105 group"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#fefffc] text-black py-12 px-6 mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-black">Pathfinity</span>
              </div>
              <p className="text-sm text-black">
                Empowering University of Hawaii students to discover their career pathways.
              </p>
            </div>
            
            {FOOTER_SECTIONS.map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold text-black mb-4">{section.title}</h4>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href={link.href} className="hover:text-black transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-black">
            <p>
              Made with <Image src="/aloha-dance.gif" alt="aloha" width={40} height={40} className="inline-block align-bottom -translate-y-0" /> for UH students
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

