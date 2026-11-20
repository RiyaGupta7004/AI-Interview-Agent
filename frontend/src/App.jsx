import AppRoutes from "./routes/AppRoutes.jsx";

function App() {
  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-teal-300 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <AppRoutes />
    </>
  );
}

export default App;
