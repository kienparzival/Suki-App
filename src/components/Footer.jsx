import React from 'react'
import { Link } from 'react-router-dom'
import EmailCapture from './EmailCapture.jsx'

export default function Footer() {
    return (
    <footer className="mt-16 border-t bg-gradient-to-b from-indigo-50 via-sky-50 to-white">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* FAQ */}
        <div className="space-y-4 mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('footer.faq.title')}
          </h2>
          <details className="group border-b pb-4">
            <summary className="flex justify-between cursor-pointer text-lg font-semibold text-gray-900">
              <span>{t('footer.faq.bestEvents')}</span>
              <span className="text-indigo-600 group-open:rotate-180 transition">⌄</span>
            </summary>
            <p className="mt-2 text-gray-600">
              {t('footer.faq.bestEventsAnswer')}
            </p>
          </details>
          <details className="group border-b pb-4">
            <summary className="flex justify-between cursor-pointer text-lg font-semibold text-gray-900">
              <span>{t('footer.faq.nearMe')}</span>
              <span className="text-indigo-600 group-open:rotate-180 transition">⌄</span>
            </summary>
            <p className="mt-2 text-gray-600">
              {t('footer.faq.nearMeAnswer')}
            </p>
          </details>
          <details className="group pb-4">
            <summary className="flex justify-between cursor-pointer text-lg font-semibold text-gray-900">
              <span>{t('footer.faq.upcoming')}</span>
              <span className="text-indigo-600 group-open:rotate-180 transition">⌄</span>
            </summary>
            <p className="mt-2 text-gray-600">
              {t('footer.faq.upcomingAnswer')}
            </p>
          </details>
        </div>

        {/* Email Capture Section */}
        <div className="mb-10 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-3">{t('footer.email.title')}</h3>
          <p className="text-gray-600 mb-4">{t('footer.email.subtitle')}</p>
          <EmailCapture />
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-gray-900">Suki</div>
            <p className="text-gray-600">{t('footer.suki.description')}</p>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-gray-900">{t('footer.product.title')}</div>
            <ul className="[&_a]:text-gray-600 [&_a:hover]:text-gray-900 space-y-1">
              <li><Link to="/browse-events">{t('nav.browseEvents')}</Link></li>
              <li><Link to="/create">Create Event</Link></li>
              <li><Link to="/saved">Saved</Link></li>
              <li><Link to="/manage-events">Manage Events</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-gray-900">{t('footer.company.title')}</div>
            <ul className="[&_a]:text-gray-600 [&_a:hover]:text-gray-900 space-y-1">
              <li><a href="https://status.suki.example" target="_blank" rel="noopener">Status</a></li>
              <li><a href="/terms" onClick={e => e.preventDefault()}>Terms</a></li>
              <li><a href="/privacy" onClick={e => e.preventDefault()}>Privacy</a></li>
              <li><a href="/accessibility" onClick={e => e.preventDefault()}>Accessibility</a></li>
            </ul>
          </div>

          {/* Contact us */}
          <div className="space-y-3">
            <div className="font-semibold text-gray-900">{t('footer.contact.title')}</div>
            <p className="text-gray-600">
              {t('footer.contact.subtitle')}
            </p>
            <div className="space-y-1">
              <a
                href="mailto:kien.wwl@gmail.com"
                className="inline-block px-3 py-2 rounded-lg border border-indigo-200 bg-white/60 hover:bg-indigo-50 transition"
              >
                Email: kien.wwl@gmail.com
              </a>
              <a
                href="tel:+84916962351"
                className="block text-gray-700 hover:text-indigo-700"
              >
                Phone: +84 91 696 2351
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t text-xs text-gray-500 flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Suki</span>
          <div className="flex items-center gap-3">
            <a href="/cookies" onClick={e => e.preventDefault()}>{t('footer.cookies')}</a>
            <span>•</span>
            <span>{t('footer.vietnam')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
