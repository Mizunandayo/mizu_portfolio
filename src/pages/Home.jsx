import Seo from '../components/Seo.jsx'
import Hero from '../components/home/Hero.jsx'
import About from '../components/home/About.jsx'
import Work from '../components/home/Work.jsx'
import Experience from '../components/home/Experience.jsx'
import Stack from '../components/home/Stack.jsx'
import Hackathons from '../components/home/Hackathons.jsx'
import Certifications from '../components/home/Certifications.jsx'
import Contact from '../components/home/Contact.jsx'
import Gallery from '../components/home/Gallery.jsx'
import Subscribe from '../components/home/Subscribe.jsx'
import Games from '../components/home/Games.jsx'
import Closing from '../components/home/Closing.jsx'
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
        <SectionBreak src="betweenaboutandwork.gif" />

        <Work />
        <SectionBreak src="betweenworksandexperience.gif" />

        <Experience />
        <SectionBreak src="betweenexperienceandstack.gif" />

        <Stack />
        <SectionBreak src="betweenstackandhackathons.jpg" />

        <Hackathons />
        <SectionBreak src="betweenhackathonsandcert.gif" />

        <Certifications />
        <SectionBreak src="betweencertandcontact.gif" />
        <Contact />

        <Gallery />

        <Games />
        <Subscribe />



        <Closing />
      </main>
    </>
  )
}
