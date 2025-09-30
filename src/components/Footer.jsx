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
            Frequently Asked Questions
          </h2>
          <details className="group border-b pb-4">
            <summary className="flex justify-between cursor-pointer text-lg font-semibold text-gray-900">
              <span>How do you find the best events?</span>
              <span className="text-indigo-600 group-open:rotate-180 transition">⌄</span>
            </summary>
            <p className="mt-2 text-gray-600">
              We curate events from trusted organizers and venues across Hanoi.
            </p>
          </details>
          <details className="group border-b pb-4">
            <summary className="flex justify-between cursor-pointer text-lg font-semibold text-gray-900">
              <span>How do you find events near me?</span>
              <span className="text-indigo-600 group-open:rotate-180 transition">⌄</span>
            </summary>
            <p className="mt-2 text-gray-600">
              Use our location filter to find events in your area.
            </p>
          </details>
          <details className="group pb-4">
            <summary className="flex justify-between cursor-pointer text-lg font-semibold text-gray-900">
              <span>How often are events updated?</span>
              <span className="text-indigo-600 group-open:rotate-180 transition">⌄</span>
            </summary>
            <p className="mt-2 text-gray-600">
              We update our event listings every Friday with fresh content.
            </p>
          </details>
        </div>

        {/* Email Capture Section */}
        <div className="mb-10 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Stay Updated</h3>
          <p className="text-gray-600 mb-4">Get the best events in Hanoi delivered to your inbox</p>
          <EmailCapture />
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-gray-900">Suki</div>
            <p className="text-gray-600">Suki is your guide to the best events happening near you this week.</p>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-gray-900">Product</div>
            <ul className="[&_a]:text-gray-600 [&_a:hover]:text-gray-900 space-y-1">
              <li><Link to="/browse-events">Browse Events</Link></li>
              <li><Link to="/create">Create Event</Link></li>
              <li><Link to="/saved">Saved</Link></li>
              <li><Link to="/manage-events">Manage Events</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-gray-900">Company</div>
            <ul className="[&_a]:text-gray-600 [&_a:hover]:text-gray-900 space-y-1">
              <li><a href="https://status.suki.example" target="_blank" rel="noopener">Status</a></li>
              <li><a href="/terms" onClick={e => e.preventDefault()}>Terms</a></li>
              <li><a href="/privacy" onClick={e => e.preventDefault()}>Privacy</a></li>
              <li><a href="/accessibility" onClick={e => e.preventDefault()}>Accessibility</a></li>
            </ul>
          </div>

          {/* Contact us */}
          <div className="space-y-3">
            <div className="font-semibold text-gray-900">Contact</div>
            <p className="text-gray-600">
              Get in touch with our team
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
            <a href="/cookies" onClick={e => e.preventDefault()}>Cookies</a>
            <span>•</span>
            <span>Vietnam</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
