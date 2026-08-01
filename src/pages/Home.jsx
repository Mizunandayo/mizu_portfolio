import Seo from '../components/Seo.jsx'
import Hero from '../components/home/Hero.jsx'
import About from '../components/home/About.jsx'
import Work from '../components/home/Work.jsx'
import Experience from '../components/home/Experience.jsx'
import Stack from '../components/home/Stack.jsx'
import Hackathons from '../components/home/Hackathons.jsx'
import Certifications from '../components/home/Certifications.jsx'
import Contact from '../components/home/Contact.jsx'
import { metaFor } from '../seo.js'

export default function Home() {
  const m = metaFor('/')

  return (
    <>
      <Seo {...m} />
      <main id="main">
        <Hero />
        <About />
        <Work />
        <Experience />
        <Stack />
        <Hackathons />
        <Certifications />
        <Contact />
      </main>
    </>
  )
}
