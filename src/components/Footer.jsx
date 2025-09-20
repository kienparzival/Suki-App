import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* FAQ-ish headings (optional; keep minimal for now) */}
        <div className="space-y-4 mb-10">
          <details className="group border-b pb-4">
            <summary className="flex justify-between cursor-pointer text-lg font-semibold text-gray-900">
              <span>What are the best events to attend?</span>
              <span className="text-gray-500 group-open:rotate-180 transition">⌄</span>
            </summary>
            <p className="mt-2 text-gray-600">
              Explore "Trending" or use filters for category, date, and location to find top picks.
            </p>
          </details>
          <details className="group border-b pb-4">
            <summary className="flex justify-between cursor-pointer text-lg font-semibold text-gray-900">
              <span>Which events are currently trending in Ha Noi?</span>
              <span className="text-gray-500 group-open:rotate-180 transition">⌄</span>
            </summary>
            <p className="mt-2 text-gray-600">
              Head to Browse/Discover, set your location to Ha Noi, and sort by "Trending."
            </p>
          </details>
          <details className="group pb-4">
            <summary className="flex justify-between cursor-pointer text-lg font-semibold text-gray-900">
              <span>Which events are coming up?</span>
              <span className="text-gray-500 group-open:rotate-180 transition">⌄</span>
            </summary>
            <p className="mt-2 text-gray-600">
              Use the "Today" / "Weekend" time filters on the Discover or Browse page.
            </p>
          </details>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-gray-900">Suki</div>
            <p className="text-gray-600">A discovery-first events directory for Vietnam.</p>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-gray-900">Product</div>
            <ul className="[&_a]:text-gray-600 [&_a:hover]:text-gray-900 space-y-1">
              <li><Link to="/browse-events">Browse events</Link></li>
              <li><Link to="/create">Create an event</Link></li>
              <li><Link to="/saved">Saved</Link></li>
              <li><Link to="/manage-events">Manage my events</Link></li>
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
            <div className="font-semibold text-gray-900">Contact us</div>
            <p className="text-gray-600">
              Questions or feedback? We'd love to hear from you.
            </p>
            <div className="space-y-1">
              <a
                href="mailto:kien.wwl@gmail.com"
                className="inline-block px-3 py-2 rounded-lg border hover:bg-gray-50"
              >
                Email: kien.wwl@gmail.com
              </a>
              <a
                href="tel:+84916962351"
                className="block text-gray-700 hover:text-gray-900"
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
