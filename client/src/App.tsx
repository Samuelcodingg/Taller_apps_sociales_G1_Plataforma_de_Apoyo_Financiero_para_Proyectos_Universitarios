import { useAuth } from "./contexts/AuthProvider.tsx";
import AppRoutes from "./routes/AppRoutes.tsx";

const App = () => {
  const { user } = useAuth();
  console.log(user);

  return <AppRoutes />;
};
export default App;
