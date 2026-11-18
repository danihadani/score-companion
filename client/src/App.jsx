import { Route, Routes } from "react-router";
import HomePage from "./HomePage.jsx";
import LoginPage from "./LoginPage.jsx";
import ProjectPage from "./ProjectPage.jsx";
import RequireAuth from "./RequireAuth.jsx";
import SignUpPage from "./SignUpPage.jsx";
import UserBar from "./UserBar.jsx";

// Which page each address shows. Only /login and /signup are open to everyone.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <UserBar />
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <RequireAuth>
            <UserBar />
            <ProjectPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
