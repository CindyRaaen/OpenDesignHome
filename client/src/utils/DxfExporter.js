/**
 * DXF Exporter for Floor Plans
 * Converts floor plan data (walls, doors, windows, furniture, dimensions) to DXF format (R14/AC1014)
 * Uses real-world coordinates: 1 grid unit = 0.5 feet = 6 inches
 */

export function exportFloorPlanToDXF(walls, doors, windows, furniture, dimensions, scaleFactor = 0.5) {
  let dxf = '';

  // SECTION HEADER
  dxf += 'SECTION\n';
  dxf += '  2\nHEADER\n';
  dxf += '  9\n$ACADVER\n  1\nAC1014\n'; // DXF R14
  dxf += '  9\n$INSUNITS\n 70\n     1\n'; // 1 = Inches
  dxf += '  9\n$EXTMIN\n 10\n0.0\n 20\n0.0\n';
  dxf += '  9\n$EXTMAX\n 10\n' + (walls[0]?.end?.x || 1000).toFixed(2) + '\n 20\n' + (walls[0]?.end?.y || 1000).toFixed(2) + '\n';
  dxf += '  9\n$LIMMIN\n 10\n0.0\n 20\n0.0\n';
  dxf += '  9\n$LIMMAX\n 10\n' + (walls[0]?.end?.x || 1000).toFixed(2) + '\n 20\n' + (walls[0]?.end?.y || 1000).toFixed(2) + '\n';
  dxf += 'ENDSEC\n';

  // SECTION TABLES
  dxf += 'SECTION\n';
  dxf += '  2\nTABLES\n';

  // Layer table
  dxf += 'TABLE\n';
  dxf += '  2\nLAYER\n';
  dxf += ' 70\n     6\n'; // 6 layers
  dxf += createLayerEntry('WALLS', 7); // White/Black
  dxf += createLayerEntry('DOORS', 1); // Red
  dxf += createLayerEntry('WINDOWS', 5); // Blue
  dxf += createLayerEntry('FURNITURE', 3); // Green
  dxf += createLayerEntry('DIMENSIONS', 2); // Yellow
  dxf += createLayerEntry('GRID', 8); // Gray
  dxf += 'ENDTAB\n';

  // Style table (for dimension text)
  dxf += 'TABLE\n';
  dxf += '  2\nSTYLE\n';
  dxf += ' 70\n     1\n';
  dxf += '  0\nSTYLE\n';
  dxf += '  2\nSTANDARD\n';
  dxf += ' 70\n     0\n';
  dxf += ' 40\n0.0\n';
  dxf += ' 41\n1.0\n';
  dxf += ' 50\n0.0\n';
  dxf += ' 71\n     0\n';
  dxf += '  3\ntxt\n';
  dxf += '  4\n\n';
  dxf += 'ENDTAB\n';

  dxf += 'ENDTAB\n'; // Close main tables
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';

  // Actually close TABLES section properly
  dxf = dxf.substring(0, dxf.lastIndexOf('ENDTAB\n')); // Remove extra ENDTAB lines
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDTAB\n';
  dxf += 'ENDSEC\n';

  // SECTION ENTITIES
  dxf += 'SECTION\n';
  dxf += '  2\nENTITIES\n';

  // Export walls as LINE or ARC entities
  if (walls && Array.isArray(walls)) {
    walls.forEach((wall, index) => {
      const start = wall.start || { x: 0, y: 0 };
      const end = wall.end || { x: 0, y: 0 };
      const startX = convertCoordinate(start.x, scaleFactor);
      const startY = convertCoordinate(start.y, scaleFactor);
      const endX = convertCoordinate(end.x, scaleFactor);
      const endY = convertCoordinate(end.y, scaleFactor);

      if (wall.curve) {
        // Curved wall - export as ARC
        const radius = wall.curve.radius || 50;
        const centerX = convertCoordinate(wall.curve.center?.x || start.x, scaleFactor);
        const centerY = convertCoordinate(wall.curve.center?.y || start.y, scaleFactor);
        const startAngle = wall.curve.startAngle || 0;
        const endAngle = wall.curve.endAngle || 90;

        dxf += '  0\nARC\n';
        dxf += '  8\nWALLS\n';
        dxf += ' 62\n     7\n'; // Color 7
        dxf += ' 10\n' + centerX.toFixed(4) + '\n';
        dxf += ' 20\n' + centerY.toFixed(4) + '\n';
        dxf += ' 40\n' + radius.toFixed(4) + '\n';
        dxf += ' 50\n' + startAngle.toFixed(2) + '\n';
        dxf += ' 51\n' + endAngle.toFixed(2) + '\n';
      } else {
        // Straight wall - export as LINE
        dxf += '  0\nLINE\n';
        dxf += '  8\nWALLS\n';
        dxf += ' 62\n     7\n'; // Color 7
        dxf += ' 10\n' + startX.toFixed(4) + '\n';
        dxf += ' 20\n' + startY.toFixed(4) + '\n';
        dxf += ' 11\n' + endX.toFixed(4) + '\n';
        dxf += ' 21\n' + endY.toFixed(4) + '\n';
      }
    });
  }

  // Export doors as ARC entities (swing arc)
  if (doors && Array.isArray(doors)) {
    doors.forEach((door) => {
      const x = convertCoordinate(door.x || 0, scaleFactor);
      const y = convertCoordinate(door.y || 0, scaleFactor);
      const width = door.width || 36; // inches
      const swing = door.swing || 90; // degrees
      const radius = width;

      dxf += '  0\nARC\n';
      dxf += '  8\nDOORS\n';
      dxf += ' 62\n     1\n'; // Color 1 = Red
      dxf += ' 10\n' + x.toFixed(4) + '\n';
      dxf += ' 20\n' + y.toFixed(4) + '\n';
      dxf += ' 40\n' + radius.toFixed(4) + '\n';
      dxf += ' 50\n0.0\n'; // Start angle
      dxf += ' 51\n' + swing.toFixed(2) + '\n'; // End angle
    });
  }

  // Export windows as LINE entities
  if (windows && Array.isArray(windows)) {
    windows.forEach((window) => {
      const x1 = convertCoordinate(window.x1 || 0, scaleFactor);
      const y1 = convertCoordinate(window.y1 || 0, scaleFactor);
      const x2 = convertCoordinate(window.x2 || 100, scaleFactor);
      const y2 = convertCoordinate(window.y2 || 0, scaleFactor);

      dxf += '  0\nLINE\n';
      dxf += '  8\nWINDOWS\n';
      dxf += ' 62\n     5\n'; // Color 5 = Blue
      dxf += ' 10\n' + x1.toFixed(4) + '\n';
      dxf += ' 20\n' + y1.toFixed(4) + '\n';
      dxf += ' 11\n' + x2.toFixed(4) + '\n';
      dxf += ' 21\n' + y2.toFixed(4) + '\n';
    });
  }

  // Export furniture as INSERT or RECTANGLE entities with labels
  if (furniture && Array.isArray(furniture)) {
    furniture.forEach((item) => {
      const x = convertCoordinate(item.x || 0, scaleFactor);
      const y = convertCoordinate(item.y || 0, scaleFactor);
      const width = item.width || 36;
      const depth = item.depth || 24;

      // Draw furniture as LWPOLYLINE (lightweight polyline for rectangle)
      dxf += '  0\nLWPOLYLINE\n';
      dxf += '  8\nFURNITURE\n';
      dxf += ' 62\n     3\n'; // Color 3 = Green
      dxf += ' 90\n     4\n'; // 4 vertices
      dxf += ' 70\n     1\n'; // Closed polyline
      // Top-left
      dxf += ' 10\n' + x.toFixed(4) + '\n';
      dxf += ' 20\n' + y.toFixed(4) + '\n';
      // Top-right
      dxf += ' 10\n' + (x + width).toFixed(4) + '\n';
      dxf += ' 20\n' + y.toFixed(4) + '\n';
      // Bottom-right
      dxf += ' 10\n' + (x + width).toFixed(4) + '\n';
      dxf += ' 20\n' + (y + depth).toFixed(4) + '\n';
      // Bottom-left
      dxf += ' 10\n' + x.toFixed(4) + '\n';
      dxf += ' 20\n' + (y + depth).toFixed(4) + '\n';

      // Add label text
      if (item.name) {
        const labelX = x + width / 2;
        const labelY = y + depth / 2;
        dxf += '  0\nTEXT\n';
        dxf += '  8\nFURNITURE\n';
        dxf += ' 62\n     3\n'; // Color 3 = Green
        dxf += ' 10\n' + labelX.toFixed(4) + '\n';
        dxf += ' 20\n' + labelY.toFixed(4) + '\n';
        dxf += ' 40\n6.0\n'; // Text height (1/2 inch)
        dxf += '  1\n' + item.name + '\n';
        dxf += ' 50\n0.0\n'; // Rotation angle
        dxf += ' 72\n     1\n'; // Horizontal center alignment
      }
    });
  }

  // Export dimensions as DIMENSION entities
  if (dimensions && Array.isArray(dimensions)) {
    dimensions.forEach((dim) => {
      const x1 = convertCoordinate(dim.x1 || 0, scaleFactor);
      const y1 = convertCoordinate(dim.y1 || 0, scaleFactor);
      const x2 = convertCoordinate(dim.x2 || 100, scaleFactor);
      const y2 = convertCoordinate(dim.y2 || 0, scaleFactor);
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 + 10; // Offset for visibility

      dxf += '  0\nLINEAR\n'; // Use LINEAR for 2D dimensions
      dxf += '  8\nDIMENSIONS\n';
      dxf += ' 62\n     2\n'; // Color 2 = Yellow
      dxf += ' 10\n' + x1.toFixed(4) + '\n';
      dxf += ' 20\n' + y1.toFixed(4) + '\n';
      dxf += ' 11\n' + x2.toFixed(4) + '\n';
      dxf += ' 21\n' + y2.toFixed(4) + '\n';
      dxf += ' 12\n' + midX.toFixed(4) + '\n';
      dxf += ' 22\n' + midY.toFixed(4) + '\n';

      // Add measurement text if available
      if (dim.text) {
        dxf += '  0\nTEXT\n';
        dxf += '  8\nDIMENSIONS\n';
        dxf += ' 62\n     2\n'; // Color 2 = Yellow
        dxf += ' 10\n' + midX.toFixed(4) + '\n';
        dxf += ' 20\n' + midY.toFixed(4) + '\n';
        dxf += ' 40\n4.0\n'; // Text height (smaller for dimensions)
        dxf += '  1\n' + dim.text + '\n';
        dxf += ' 50\n0.0\n'; // Rotation angle
      }
    });
  }

  dxf += 'ENDSEC\n';

  // EOF
  dxf += '  0\nEOF\n';

  return dxf;
}

/**
 * Convert pixel coordinates to inches using scaleFactor
 * scaleFactor: 1 grid unit = scaleFactor feet = scaleFactor * 12 inches
 */
function convertCoordinate(pixelValue, scaleFactor) {
  // Assuming 1 pixel = 1 grid unit
  // 1 grid unit = scaleFactor feet = scaleFactor * 12 inches
  return pixelValue * scaleFactor * 12;
}

/**
 * Helper to create a layer entry in DXF format
 */
function createLayerEntry(layerName, colorCode) {
  let entry = '';
  entry += '  0\nLAYER\n';
  entry += '  2\n' + layerName + '\n';
  entry += ' 70\n     0\n'; // Flags: not frozen, not locked
  entry += ' 62\n' + colorCode.toString().padStart(6) + '\n'; // Color code
  entry += '  6\nCONTINUOUS\n'; // Linetype
  return entry;
}

/**
 * Trigger download of DXF file in browser
 */
export function downloadDXF(dxfContent, filename = 'floorplan.dxf') {
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
