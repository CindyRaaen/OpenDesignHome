import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  X, Download, Printer, RotateCcw, FileText, AlertTriangle,
  ChevronDown, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react'
import {
  PAPER_SIZES, ARCH_SCALES, calculatePrintLayout, suggestScale,
  renderPrintSheet, exportToPDF
} from '../utils/CadPrintEngine'

/**
 * CadPrintPreview — Full-screen modal for configuring and previewing print-to-scale CAD output.
 *
 * Props:
 *   open      — boolean to show/hide
 *   onClose   — callback to close the modal
 *   data      — { walls, doors, windows, furniture, measurements }
 *   canvasWidth, canvasHeight — floor plan canvas pixel dimensions
 *   projectName — string, optional
 *   planName    — string, optional
 */
export default function CadPrintPreview({ open, onClose, data, canvasWidth, canvasHeight, projectName, planName }) {
  const previewRef = useRef(null)
  const [paperKey, setPaperKey] = useState('ARCH D')
  const [scaleKey, setScaleKey] = useState('1/4"=1\'-0"')
  const [orientation, setOrientation] = useState('landscape')
  const [previewZoom, setPreviewZoom] = useState(1)
  const [exporting, setExporting] = useState(false)

  // Title block metadata
  const [meta, setMeta] = useState({
    projectName: projectName || 'Untitled Project',
    clientName: '',
    firmName: 'Open Interior Designer',
    drawnBy: '',
    date: new Date().toLocaleDateString(),
    sheetNumber: 'A-1',
    sheetTitle: planName || 'Floor Plan',
  })

  // Auto-suggest scale when paper or orientation changes
  useEffect(() => {
    const suggested = suggestScale(paperKey, canvasWidth, canvasHeight, orientation)
    setScaleKey(suggested)
  }, [paperKey, canvasWidth, canvasHeight, orientation])

  // Update meta when props change
  useEffect(() => {
    setMeta(m => ({ ...m, projectName: projectName || m.projectName, sheetTitle: planName || m.sheetTitle }))
  }, [projectName, planName])

  // Calculate layout
  const layout = useMemo(() => {
    return calculatePrintLayout({ paperKey, scaleKey, canvasWidth, canvasHeight, orientation })
  }, [paperKey, scaleKey, canvasWidth, canvasHeight, orientation])

  // Render preview
  useEffect(() => {
    if (!open || !layout || !previewRef.current) return

    const container = previewRef.current
    // Clear previous
    while (container.firstChild) container.removeChild(container.firstChild)

    try {
      const sheet = renderPrintSheet(layout, data, meta)
      sheet.style.maxWidth = '100%'
      sheet.style.maxHeight = '100%'
      sheet.style.width = 'auto'
      sheet.style.height = 'auto'
      sheet.style.transform = `scale(${previewZoom})`
      sheet.style.transformOrigin = 'center center'
      sheet.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'
      sheet.style.borderRadius = '2px'
      container.appendChild(sheet)
    } catch (err) {
      console.error('Print preview error:', err)
    }
  }, [open, layout, data, meta, previewZoom])

  // PDF export
  const handleExportPDF = useCallback(async () => {
    if (!layout) return
    setExporting(true)
    try {
      const fname = `${(meta.projectName || 'floor-plan').replace(/[^a-zA-Z0-9]/g, '-')}-${meta.sheetNumber}.pdf`
      await exportToPDF(layout, data, meta, fname)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Failed to export PDF. Check your internet connection (jsPDF loads from CDN).')
    } finally {
      setExporting(false)
    }
  }, [layout, data, meta])

  // Browser print
  const handlePrint = useCallback(() => {
    if (!layout) return
    const sheet = renderPrintSheet(layout, data, meta)
    const win = window.open('', '_blank')
    if (!win) { alert('Pop-up blocked. Allow pop-ups and try again.'); return }
    win.document.write(`<!DOCTYPE html><html><head><title>Print Floor Plan</title><style>
      @page { size: ${layout.paper.w}in ${layout.paper.h}in; margin: 0; }
      body { margin: 0; padding: 0; }
      img { width: ${layout.paper.w}in; height: ${layout.paper.h}in; }
    </style></head><body></body></html>`)
    const img = win.document.createElement('img')
    img.src = sheet.toDataURL('image/png', 1.0)
    img.onload = () => { win.document.body.appendChild(img); win.print() }
  }, [layout, data, meta])

  if (!open) return null

  const paperOpts = Object.entries(PAPER_SIZES)
  const scaleOpts = Object.entries(ARCH_SCALES)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex">
      {/* Left sidebar — controls */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Print to Scale</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="p-4 space-y-5 flex-1">
          {/* Paper Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Paper Size</label>
            <select value={paperKey} onChange={e => setPaperKey(e.target.value)}
              className="w-full rounded-lg border-slate-300 text-sm">
              <optgroup label="US Architectural">
                {paperOpts.filter(([k]) => k.startsWith('ARCH')).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </optgroup>
              <optgroup label="US ANSI">
                {paperOpts.filter(([k]) => k.startsWith('ANSI')).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </optgroup>
              <optgroup label="ISO">
                {paperOpts.filter(([k]) => k.startsWith('A')).filter(([k]) => !k.startsWith('ARCH') && !k.startsWith('ANSI')).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Orientation</label>
            <div className="flex gap-2">
              {['landscape', 'portrait'].map(o => (
                <button key={o} onClick={() => setOrientation(o)}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                    orientation === o ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  <div className={`mx-auto mb-1 border-2 rounded-sm ${orientation === o ? 'border-indigo-400' : 'border-slate-300'}`}
                    style={{ width: o === 'landscape' ? 28 : 20, height: o === 'landscape' ? 20 : 28 }} />
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Scale</label>
            <select value={scaleKey} onChange={e => setScaleKey(e.target.value)}
              className="w-full rounded-lg border-slate-300 text-sm">
              {scaleOpts.map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {layout && !layout.fits && (
              <div className="mt-2 flex items-start gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Plan does not fit at this scale. Choose a smaller scale or larger paper.</span>
              </div>
            )}
            {layout && layout.fits && (
              <p className="mt-1.5 text-xs text-green-600">
                Plan: {layout.plan.printW.toFixed(1)}" × {layout.plan.printH.toFixed(1)}" — fits on sheet
              </p>
            )}
          </div>

          {/* Title Block fields */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Title Block</h3>
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Project Name</label>
                <input type="text" value={meta.projectName} onChange={e => setMeta(m => ({ ...m, projectName: e.target.value }))}
                  className="w-full rounded-md border-slate-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Client Name</label>
                <input type="text" value={meta.clientName} onChange={e => setMeta(m => ({ ...m, clientName: e.target.value }))}
                  className="w-full rounded-md border-slate-300 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">Drawn By</label>
                  <input type="text" value={meta.drawnBy} onChange={e => setMeta(m => ({ ...m, drawnBy: e.target.value }))}
                    className="w-full rounded-md border-slate-300 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">Date</label>
                  <input type="text" value={meta.date} onChange={e => setMeta(m => ({ ...m, date: e.target.value }))}
                    className="w-full rounded-md border-slate-300 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">Sheet Number</label>
                  <input type="text" value={meta.sheetNumber} onChange={e => setMeta(m => ({ ...m, sheetNumber: e.target.value }))}
                    className="w-full rounded-md border-slate-300 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">Sheet Title</label>
                  <input type="text" value={meta.sheetTitle} onChange={e => setMeta(m => ({ ...m, sheetTitle: e.target.value }))}
                    className="w-full rounded-md border-slate-300 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Firm Name</label>
                <input type="text" value={meta.firmName} onChange={e => setMeta(m => ({ ...m, firmName: e.target.value }))}
                  className="w-full rounded-md border-slate-300 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <button onClick={handleExportPDF} disabled={exporting || !layout?.fits}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <Download className="w-4 h-4" />
            {exporting ? 'Generating PDF...' : 'Export PDF'}
          </button>
          <button onClick={handlePrint} disabled={!layout?.fits}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Right side — preview */}
      <div className="flex-1 bg-slate-700 flex flex-col">
        {/* Preview toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
          <span className="text-sm text-slate-300">
            Preview — {PAPER_SIZES[paperKey]?.label} @ {ARCH_SCALES[scaleKey]?.label}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreviewZoom(z => Math.max(0.3, z - 0.15))} className="p-1 text-slate-400 hover:text-white"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs text-slate-400 w-10 text-center">{Math.round(previewZoom * 100)}%</span>
            <button onClick={() => setPreviewZoom(z => Math.min(3, z + 0.15))} className="p-1 text-slate-400 hover:text-white"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => setPreviewZoom(1)} className="p-1 text-slate-400 hover:text-white"><Maximize2 className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Preview canvas container */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8">
          <div ref={previewRef} className="flex items-center justify-center" />
        </div>
      </div>
    </div>
  )
}
