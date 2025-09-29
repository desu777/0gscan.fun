export default function Header() {
  return (
    <header className="relative z-10 pt-12 pb-8 text-center">
      <div className="max-w-6xl mx-auto px-4">
        <img
          src="/L-I1k2oL_400x400.jpg"
          alt="0G Labs"
          className="w-28 h-28 mx-auto mb-6 rounded-xl shadow-lg"
        />
        <h1 className="text-4xl md:text-5xl font-poppins font-light text-white mb-3">
          Airdrop Distribution Transparency
        </h1>
        <p className="text-gray-400 font-poppins text-lg">
          Independent on-chain verification
        </p>
      </div>
    </header>
  );
}