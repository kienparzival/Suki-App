import { Helmet } from 'react-helmet'

function json(obj) { return { __html: JSON.stringify(obj, null, 2) } }

export default function SEO({ city='Hanoi', events=[] }) {
  // English-only text strings. Keep short, keyword-rich, human.
  const title = `Hanoi events this week • Things to do in ${city} | Suki`
  const desc = `Discover events in ${city}: concerts, meetups, workshops, and more. Updated weekly on Suki.`
  const og = `Find the best ${city} events this week on Suki.`

  const siteUrl   = typeof window !== 'undefined' ? window.location.origin : 'https://suki.example'
  const pageUrl   = typeof window !== 'undefined' ? window.location.href   : `${siteUrl}/discover`
  const logoUrl   = `${siteUrl}/Suki.png` // using existing logo
  const coverUrl  = `${siteUrl}/og-cover.png`  // optional nice OG image in /public

  // Convert your event records to schema.org "Event" nodes (limit to 10)
  const schemaEvents = (events || []).slice(0, 10).map((e) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    startDate: e.start_at,       // ISO string preferred
    endDate:   e.end_at || e.start_at,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${siteUrl}/events/${e.id}`,
    image: e.cover_url ? [e.cover_url] : undefined,
    description: e.description || '',
    location: e.venue?.name ? {
      '@type': 'Place',
      name: e.venue.name,
      address: e.venue.address ? {
        '@type': 'PostalAddress',
        streetAddress: e.venue.address,
        addressLocality: city,
        addressCountry: 'VN'
      } : undefined
    } : undefined,
    offers: e.external_ticket_url ? [{
      '@type': 'Offer',
      url: e.external_ticket_url,
      availability: 'https://schema.org/InStock',
      price: e.min_price || 0,
      priceCurrency: 'VND'
    }] : undefined
  }))

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: schemaEvents.map((ev, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: ev.url,
      name: ev.name
    }))
  }

  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Suki',
    url: siteUrl,
    logo: logoUrl
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Suki',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/discover?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <Helmet>
      {/* language + canonical */}
      <html lang="en" />
      <link rel="canonical" href={pageUrl} />

      {/* basic SEO */}
      <title>{title}</title>
      <meta name="description" content={desc} />
      
      {/* Google Search Console verification */}
      <meta name="google-site-verification" content="VSVSC5PkZDX4qkw7Xjj_sPXk0anOckGXpDcOT6Zc7aM" />

      {/* Open Graph & Twitter */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={`${siteUrl}/og-cover.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={`${siteUrl}/og-cover.png`} />

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={json(org)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={json(website)} />
      {schemaEvents.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={json(itemList)} />
      )}
      {schemaEvents.map((ev, idx) => (
        <script key={idx} type="application/ld+json" dangerouslySetInnerHTML={json(ev)} />
      ))}
    </Helmet>
  )
}
