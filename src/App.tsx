import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import SessionHub from "./pages/SessionHub";
import PhraseDetail from "./pages/PhraseDetail";
import SessionDetail from "./pages/SessionDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SessionHub />} />
          <Route path="/phrase/:phraseId" element={<PhraseDetail />} />
          <Route path="/phrase/:phraseId/session/:id" element={<SessionDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
