import { Route, Routes } from "react-router";
import HomePage from "./HomePage.jsx";
import ProjectPage from "./ProjectPage.jsx";

// Which page each address shows.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/:id" element={<ProjectPage />} />
    </Routes>
  );
}