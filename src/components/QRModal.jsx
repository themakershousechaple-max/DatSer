import React, { useMemo, useState } from 'react'
import { X, Share2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

const QRModal = ({ isOpen, member, onClose }) => {
  const { currentTable } = useApp()
  const [copied, setCopied] = useState(false)

  const get30thDate = (table) => {
    if (!table) return null
    try {
      const [monthName, year] = table.split('_')
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
      const monthIndex = months.indexOf(monthName)
      if (monthIndex === -1) return null
      const yyyy = parseInt(year,10)
      return `${yyyy}-${String(monthIndex+1).padStart(2,'0')}-30`
    } catch {
      return null
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const qrPayload = useMemo(() => {
    if (!member) return null
    const date30 = get30thDate(currentTable)
    const url = `${origin}/qr?qr_mark=${encodeURIComponent(member.id)}${date30 ? `&date=${encodeURIComponent(date30)}` : ''}`
    return { url, date30 }
  }, [member, currentTable, origin])

  if (!isOpen || !member || !qrPayload) return null

  const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=${encodeURIComponent(qrPayload.url)}`

  const whatsappMessage = `Please scan this QR to mark attendance: ${qrPayload.url}`
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrPayload.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Share / QR for {member['full_name'] || member['Full Name']}</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="w-full flex items-center justify-center">
            <img src={qrImageUrl} alt="QR code" className="w-56 h-56 object-contain bg-white p-1 rounded" />
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 break-words">
            <div className="font-medium mb-1">Link</div>
            <div className="text-sm mb-2">{qrPayload.url}</div>
            <div className="flex gap-2">
              <button onClick={onCopy} className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRModal