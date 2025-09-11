import React, { useMemo } from "react"

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

// Matches http(s)://... or www.... up to whitespace or <
const URL_REGEX = /((https?:\/\/|www\.)[^\s<]+)/gi
function linkify(escaped) {
  return escaped.replace(URL_REGEX, (url) => {
    const href = url.startsWith("http") ? url : `https://${url}`
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`
  })
}

export default function DescriptionBlock({ text }) {
  const html = useMemo(() => {
    const safe = escapeHtml(text || "").trim()
    const linked = linkify(safe)
    return linked.replace(/\n/g, "<br />")
  }, [text])

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-6 leading-relaxed text-gray-800 whitespace-pre-wrap break-words overflow-x-hidden [&_a]:text-blue-600 [&_a]:underline [&_a]:break-words [&_a]:hover:opacity-80"
      style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}


