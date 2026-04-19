import React, { useState } from 'react'
import RoomViewer3D from '../components/RoomViewer3D'

export default function RoomViewerPage({ setPage }) {
  return (
    <div className="h-[calc(100vh-64px)]">
      <RoomViewer3D
        roomDimensions={{ width: 20, depth: 16, height: 10 }}
        furniture={[]}
        wallColor="#F5F0E8"
        floorColor="#8B6914"
        onFurnitureSelect={(item) => console.log('Selected:', item)}
      />
    </div>
  )
}
