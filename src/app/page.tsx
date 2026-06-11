import OnboardingFlow from '@/components/OnboardingFlow';
import Animated3DBackground from '@/components/Animated3DBackground';

export default function Home() {
  return (
    <main id="main-content" className="relative isolate min-h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <Animated3DBackground />
      <div className="relative z-10 max-w-4xl w-full mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            EcoVerse <span className="text-green-500">AI</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Shape Your Future. One Choice at a Time. 
            Discover how your daily habits impact your world in 50 years.
          </p>
        </div>
        
        <OnboardingFlow />
      </div>
    </main>
  );
}
