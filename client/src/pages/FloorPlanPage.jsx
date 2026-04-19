import React, { useState } from 'react'
import FloorPlanEditor from '../components/FloorPlanEditor'

export default function FloorPlanPage({ setPage }) {
  const [projectId] = useState(1) // Default project for now

  return (
    <div className="h-full">
      <FloorPlanEditor
        projectId={projectId}
        onSave={(data) => {
          console.log('Floor plan saved:', data)
        }}
        onClose={() => setPage('challenges')}
      />
    </div>
  )
}
