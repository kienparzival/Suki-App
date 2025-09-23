import { Helmet } from 'react-helmet'

function json(obj) { return { __html: JSON.stringify(obj, null, 2) } }

export default function SEO({ lang='en', city='Hanoi', events=[] }) {
  // Text strings for EN/VI. Keep short, keyword-rich, human.
  const texts = {
    en: {
      title: `Hanoi events this week • Things to do in ${city} | Suki`,
      desc:  `Discover events in ${city}: concerts, meetups, workshops, and more. Updated weekly on Suki.`,
      og:    `Find the best ${city} events this week on Suki.`,
    },
    vi: {
      title: `Sự kiện ở ${city} • Chơi gì tuần này | Suki`,
      desc:  `Khám phá sự kiện ở ${city}: hòa nhạc, meetup, workshop và nhiều hơn nữa. Cập nhật hàng tuần trên Suki.`,
      og:    `Tìm sự kiện hay ở ${city} tuần này trên Suki.`,
    }
  }[lang] || {}

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
      <html lang={lang} />
      <link rel="canonical" href={pageUrl} />

      {/* basic SEO */}
      <title>{texts.title}</title>
      <meta name="description" content={texts.desc} />

      {/* Open Graph & Twitter */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={texts.title} />
      <meta property="og:description" content={texts.og || texts.desc} />
      <meta property="og:url" content={pageUrl} />
      {coverUrl && <meta property="og:image" content={coverUrl} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={texts.title} />
      <meta name="twitter:description" content={texts.og || texts.desc} />
      {coverUrl && <meta name="twitter:image" content={coverUrl} />}

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
