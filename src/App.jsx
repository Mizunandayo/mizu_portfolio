import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import PersonalNav from "./components/PersonalNav.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import Boot from "./components/shared/Boot.jsx";
import { ModeProvider } from "./hooks/useMode.jsx";
import Welcome from "./components/shared/Welcome.jsx";
import MusicPlayer from "./components/shared/MusicPlayer.jsx";

/* Route changes start at the top; an incoming #hash wins over that. */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

/* One page. Projects and hackathons open as dialogs from the home page
   rather than routing — there are no standalone case-study pages. */
export default function App() {
  /* The greeting waits for the loader rather than stacking on it. */
  const [booted, setBooted] = useState(false);
  /* Set only when the visitor picks a track in the greeting. */
  const [music, setMusic] = useState(null);

  return (
    <ModeProvider>
      <Boot onDone={() => setBooted(true)} />
      <a href="#main" className="skip-mizu">
        Skip to content
      </a>
      <ScrollManager />
      {/* Both navs mount; CSS shows one. Swapping them in React would
          flash the wrong one before hydration settles the mode. */}
      <Nav />
      <PersonalNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <Welcome show={booted} onPickTrack={setMusic} />
      {music && <MusicPlayer startId={music} onClose={() => setMusic(null)} />}
    </ModeProvider>
  );
}
