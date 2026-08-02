import Seo from '../components/Seo.jsx'
import Hero from '../components/home/Hero.jsx'
import About from '../components/home/About.jsx'
import Work from '../components/home/Work.jsx'
import Experience from '../components/home/Experience.jsx'
import Stack from '../components/home/Stack.jsx'
import Hackathons from '../components/home/Hackathons.jsx'
import Certifications from '../components/home/Certifications.jsx'
import Contact from '../components/home/Contact.jsx'
import SectionBreak from '../components/shared/SectionBreak.jsx'
import { metaFor } from '../seo.js'

export default function Home() {
  const m = metaFor('/')

  return (
    <>
      <Seo {...m} />
      <main id="main">
        <Hero />
        <SectionBreak src="betweenheroandabout.jpg" />

        <About />
        <SectionBreak src="betweenaboutandwork.jpg" />

        <Work />
        <SectionBreak src="betweenworksandexperience.gif" />

        <Experience />
        <SectionBreak src="betweenexperienceandstack.jpg" />

        <Stack />
        <SectionBreak src="betweenstackandhackathons.jpg" />

        <Hackathons />
        <SectionBreak src="betweenhackathonsandcert.gif" />

        <Certifications />
        <Contact />

        {/* Closing plate. Natural aspect rather than a cropped band, so
            the whole image is reachable by scrolling to the end of it. */}
        <div className="end-plate-mizu" aria-hidden="true">
          <img src="/profile/endsection.jpg" alt="" loading="lazy" decoding="async" />
        </div>
      </main>
    </>
  )
}
