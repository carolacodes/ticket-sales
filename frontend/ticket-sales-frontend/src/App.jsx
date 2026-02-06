import { AppShell } from "./components/layout/AppShell.jsx";
import { AppRouter } from "./routes/AppRouter.jsx";

export default function App() {
  return (
    <AppShell>
      <AppRouter />
    </AppShell>
  );
}