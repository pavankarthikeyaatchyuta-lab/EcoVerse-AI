import OnboardingFlow from '@/components/OnboardingFlow';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            EcoVerse <span className="text-green-500">AI</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Shape Your Future. One Choice at a Time. 
            Discover how your daily habits impact your world in 50 years.
          </p>
        </div>
        
        <OnboardingFlow />
      </div>
    </main>
  );
}
