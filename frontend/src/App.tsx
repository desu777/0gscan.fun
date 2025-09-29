import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Galaxy from './components/Galaxy/Galaxy';
import Header from './components/Header/Header';
import Distribution from './components/Distribution/Distribution';
import Statistics from './components/Statistics/Statistics';
import Contracts from './components/Contracts/Contracts';
import WalletTable from './components/WalletTable/WalletTable';
import Footer from './components/Footer/Footer';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-dark relative overflow-hidden">
        {/* Background Galaxy Effect */}
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={0.8}
          glowIntensity={0.2}
          saturation={0.3}
          hueShift={140}
          transparent={true}
        />

        {/* Main Content */}
        <div className="relative z-10">
          <Header />
          <main className="pb-20">
            <Distribution />
            <Statistics />
            <Contracts />
            <WalletTable />
          </main>
          <Footer />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;