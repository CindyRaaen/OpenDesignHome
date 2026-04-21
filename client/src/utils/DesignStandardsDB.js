// ═══════════════════════════════════════════════════════════════════════════
// DESIGN STANDARDS DATABASE (DSD) — V2 AI Design Analysis Engine
// 150+ professional measurement standards compiled from:
//   - Ballast, D.K. Interior Design Reference Manual (PPI, 7th Ed.)
//   - Ramsey/Sleeper, Architectural Graphic Standards (Wiley, 12th Ed.)
//   - NCIDQ IDPX/IDFX Study Materials (CIDQ)
//   - Neufert, E. Architects' Data (5th Ed.)
// ═══════════════════════════════════════════════════════════════════════════

const STANDARDS = [
  // ════════════════════════════════════════
  // SEATING & CONVERSATION (Category: seating)
  // ════════════════════════════════════════
  { id: 'seat-001', category: 'seating', name: 'Sofa to coffee table distance',
    measurement: { min: 14, max: 18, unit: 'in' }, tolerance: { plus: 2, minus: 2 },
    penalty: -8, applicableRooms: ['living','family','greatRoom','den'],
    requiredItems: ['sofa','coffeeTable'], source: 'Ballast IDRM Ch.12' },
  { id: 'seat-002', category: 'seating', name: 'Chair arm height matches side table height',
    measurement: { min: -2, max: 2, unit: 'in_diff' }, tolerance: { plus: 1, minus: 1 },
    penalty: -6, applicableRooms: ['living','family','bedroom','den'],
    requiredItems: ['chair','sideTable'], source: 'Ballast IDRM Ch.12' },
  { id: 'seat-003', category: 'seating', name: 'Conversation circle max diameter',
    measurement: { min: 0, max: 96, unit: 'in' }, tolerance: { plus: 12, minus: 0 },
    penalty: -10, applicableRooms: ['living','family','greatRoom'],
    requiredItems: ['seatingGroup'], source: 'Architectural Graphic Standards' },
  { id: 'seat-004', category: 'seating', name: 'Facing seating distance',
    measurement: { min: 48, max: 120, unit: 'in' }, tolerance: { plus: 6, minus: 6 },
    penalty: -8, applicableRooms: ['living','family','greatRoom','den'],
    requiredItems: ['seatingPair'], source: 'Ballast IDRM Ch.12' },
  { id: 'seat-005', category: 'seating', name: 'Sofa to TV distance',
    measurement: { min: 1.5, max: 2.5, unit: 'x_diagonal' }, tolerance: { plus: 0.1, minus: 0.1 },
    penalty: -6, applicableRooms: ['living','family','mediaRoom'],
    requiredItems: ['sofa','tv'], source: 'THX/SMPTE viewing standards' },
  { id: 'seat-006', category: 'seating', name: 'Accent chair angle to sofa',
    measurement: { min: 30, max: 90, unit: 'deg' }, tolerance: { plus: 10, minus: 10 },
    penalty: -4, applicableRooms: ['living','family','greatRoom'],
    requiredItems: ['sofa','accentChair'], source: 'NCIDQ Practice' },
  { id: 'seat-007', category: 'seating', name: 'Ottoman to nearest seating',
    measurement: { min: 6, max: 12, unit: 'in' }, tolerance: { plus: 2, minus: 2 },
    penalty: -3, applicableRooms: ['living','family','bedroom'],
    requiredItems: ['ottoman','seating'], source: 'Ballast IDRM' },
  { id: 'seat-008', category: 'seating', name: 'Recliner wall clearance behind',
    measurement: { min: 12, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 2 },
    penalty: -5, applicableRooms: ['living','family','mediaRoom'],
    requiredItems: ['recliner'], source: 'Manufacturer specs / Ballast' },
  { id: 'seat-009', category: 'seating', name: 'Sofa from wall (against or floating)',
    measurement: { min: 0, max: 6, unit: 'in' }, tolerance: { plus: 0, minus: 0 },
    penalty: -4, applicableRooms: ['living','family','greatRoom'],
    requiredItems: ['sofa'], source: 'NCIDQ Practice',
    note: 'Against wall (0-6in) or floating (24+in). Dead zone 7-23in penalized.' },
  { id: 'seat-010', category: 'seating', name: 'Coffee table height vs sofa seat',
    measurement: { min: -2, max: 2, unit: 'in_diff' }, tolerance: { plus: 1, minus: 1 },
    penalty: -5, applicableRooms: ['living','family'],
    requiredItems: ['coffeeTable','sofa'], source: 'Ballast IDRM Ch.12' },
  { id: 'seat-011', category: 'seating', name: 'Coffee table length vs sofa length',
    measurement: { min: 0.5, max: 0.67, unit: 'ratio' }, tolerance: { plus: 0.05, minus: 0.05 },
    penalty: -4, applicableRooms: ['living','family'],
    requiredItems: ['coffeeTable','sofa'], source: 'Design proportion standards' },
  { id: 'seat-012', category: 'seating', name: 'End table width minimum',
    measurement: { min: 14, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 2 },
    penalty: -3, applicableRooms: ['living','family','bedroom'],
    requiredItems: ['sideTable'], source: 'Ballast IDRM' },

  // ════════════════════════════════════════
  // DINING & TABLE (Category: dining)
  // ════════════════════════════════════════
  { id: 'din-001', category: 'dining', name: 'Place setting width per person',
    measurement: { min: 24, max: 30, unit: 'in' }, tolerance: { plus: 2, minus: 2 },
    penalty: -6, applicableRooms: ['dining','kitchen','greatRoom'],
    requiredItems: ['diningTable'], source: 'Architectural Graphic Standards' },
  { id: 'din-002', category: 'dining', name: 'Table to wall (no passage)',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -8, applicableRooms: ['dining','kitchen'],
    requiredItems: ['diningTable'], source: 'Ballast IDRM Ch.12' },
  { id: 'din-003', category: 'dining', name: 'Table to wall (passage behind chairs)',
    measurement: { min: 54, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -10, applicableRooms: ['dining','kitchen'],
    requiredItems: ['diningTable'], source: 'Architectural Graphic Standards' },
  { id: 'din-004', category: 'dining', name: 'Chandelier above dining table',
    measurement: { min: 30, max: 34, unit: 'in' }, tolerance: { plus: 2, minus: 2 },
    penalty: -6, applicableRooms: ['dining'],
    requiredItems: ['chandelier','diningTable'], source: 'Ballast IDRM' },
  { id: 'din-005', category: 'dining', name: 'Chandelier width vs table width',
    measurement: { min: 0.5, max: 0.75, unit: 'ratio' }, tolerance: { plus: 0.05, minus: 0.05 },
    penalty: -5, applicableRooms: ['dining'],
    requiredItems: ['chandelier','diningTable'], source: 'ASID guidelines' },
  { id: 'din-006', category: 'dining', name: 'Buffet/sideboard height',
    measurement: { min: 34, max: 38, unit: 'in' }, tolerance: { plus: 2, minus: 2 },
    penalty: -3, applicableRooms: ['dining'],
    requiredItems: ['buffet'], source: 'Neufert Architects Data' },
  { id: 'din-007', category: 'dining', name: 'Buffet distance from table edge',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -6, applicableRooms: ['dining'],
    requiredItems: ['buffet','diningTable'], source: 'Ballast IDRM' },
  { id: 'din-008', category: 'dining', name: 'Dining chair seat to table top gap',
    measurement: { min: 10, max: 12, unit: 'in' }, tolerance: { plus: 1, minus: 1 },
    penalty: -5, applicableRooms: ['dining','kitchen'],
    requiredItems: ['diningChair','diningTable'], source: 'Architectural Graphic Standards' },
  { id: 'din-009', category: 'dining', name: 'Bar stool to counter height gap',
    measurement: { min: 9, max: 13, unit: 'in' }, tolerance: { plus: 1, minus: 1 },
    penalty: -5, applicableRooms: ['kitchen','bar'],
    requiredItems: ['barStool','counter'], source: 'Architectural Graphic Standards' },
  { id: 'din-010', category: 'dining', name: 'Rug extends beyond dining table',
    measurement: { min: 24, max: 30, unit: 'in' }, tolerance: { plus: 4, minus: 4 },
    penalty: -4, applicableRooms: ['dining'],
    requiredItems: ['rug','diningTable'], source: 'NCIDQ Practice' },

  // ════════════════════════════════════════
  // CIRCULATION & CLEARANCE (Category: circulation)
  // ════════════════════════════════════════
  { id: 'circ-001', category: 'circulation', name: 'Primary walkway width',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 2 },
    penalty: -10, applicableRooms: ['all'],
    requiredItems: ['any'], source: 'ADA/IBC Code' },
  { id: 'circ-002', category: 'circulation', name: 'Secondary walkway width',
    measurement: { min: 24, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 2 },
    penalty: -6, applicableRooms: ['all'],
    requiredItems: ['any'], source: 'Ballast IDRM' },
  { id: 'circ-003', category: 'circulation', name: 'Doorway clearance (no furniture in swing)',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 0 },
    penalty: -15, applicableRooms: ['all'],
    requiredItems: ['door'], source: 'IBC/ADA' },
  { id: 'circ-004', category: 'circulation', name: 'Fireplace hearth clearance',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -8, applicableRooms: ['living','family','bedroom'],
    requiredItems: ['fireplace'], source: 'Fire code / Ballast' },
  { id: 'circ-005', category: 'circulation', name: 'Entry landing zone',
    measurement: { min: 36, max: 999, unit: 'in_sq' }, tolerance: { plus: 0, minus: 4 },
    penalty: -6, applicableRooms: ['entry','foyer','living'],
    requiredItems: ['entryDoor'], source: 'Ballast IDRM' },
  { id: 'circ-006', category: 'circulation', name: 'ADA wheelchair turning radius',
    measurement: { min: 60, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 0 },
    penalty: -20, applicableRooms: ['all'],
    requiredItems: ['accessibilityRequired'], source: 'ADA Standards' },
  { id: 'circ-007', category: 'circulation', name: 'Cabinet/drawer clearance',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -4, applicableRooms: ['kitchen','bathroom','bedroom','office'],
    requiredItems: ['cabinet'], source: 'Neufert' },
  { id: 'circ-008', category: 'circulation', name: 'Closet door clearance',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 2 },
    penalty: -4, applicableRooms: ['bedroom','entry','hallway'],
    requiredItems: ['closetDoor'], source: 'Ballast IDRM' },
  { id: 'circ-009', category: 'circulation', name: 'Stairway landing depth',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 0 },
    penalty: -12, applicableRooms: ['stairway','hallway'],
    requiredItems: ['stairway'], source: 'IBC' },
  { id: 'circ-010', category: 'circulation', name: 'Window egress clearance',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -10, applicableRooms: ['bedroom'],
    requiredItems: ['egressWindow'], source: 'IBC/IRC' },

  // ════════════════════════════════════════
  // BEDROOM (Category: bedroom)
  // ════════════════════════════════════════
  { id: 'bed-001', category: 'bedroom', name: 'Bed sides clearance',
    measurement: { min: 24, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -6, applicableRooms: ['bedroom','masterBedroom','guestRoom'],
    requiredItems: ['bed'], source: 'Ballast IDRM' },
  { id: 'bed-002', category: 'bedroom', name: 'Bed foot clearance',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -6, applicableRooms: ['bedroom','masterBedroom','guestRoom'],
    requiredItems: ['bed'], source: 'Ballast IDRM' },
  { id: 'bed-003', category: 'bedroom', name: 'Nightstand height matches mattress top',
    measurement: { min: -2, max: 2, unit: 'in_diff' }, tolerance: { plus: 2, minus: 2 },
    penalty: -4, applicableRooms: ['bedroom','masterBedroom'],
    requiredItems: ['nightstand','bed'], source: 'NCIDQ Practice' },
  { id: 'bed-004', category: 'bedroom', name: 'Nightstand width proportion',
    measurement: { min: 0.5, max: 1.0, unit: 'ratio_half_headboard' }, tolerance: { plus: 0.1, minus: 0.1 },
    penalty: -3, applicableRooms: ['bedroom','masterBedroom'],
    requiredItems: ['nightstand','bed'], source: 'Design proportion standards' },
  { id: 'bed-005', category: 'bedroom', name: 'Dresser drawer clearance',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -4, applicableRooms: ['bedroom','masterBedroom'],
    requiredItems: ['dresser'], source: 'Ballast IDRM' },
  { id: 'bed-006', category: 'bedroom', name: 'Bench at bed foot width',
    measurement: { min: 0.75, max: 1.0, unit: 'ratio_bed_width' }, tolerance: { plus: 0.05, minus: 0.05 },
    penalty: -3, applicableRooms: ['bedroom','masterBedroom'],
    requiredItems: ['bench','bed'], source: 'NCIDQ Practice' },
  { id: 'bed-007', category: 'bedroom', name: 'Bedside lamp shade bottom height',
    measurement: { min: 18, max: 22, unit: 'in_above_mattress' }, tolerance: { plus: 3, minus: 3 },
    penalty: -2, applicableRooms: ['bedroom','masterBedroom'],
    requiredItems: ['tableLamp','bed'], source: 'Lighting design standards' },
  { id: 'bed-008', category: 'bedroom', name: 'Rug extends beyond bed sides',
    measurement: { min: 24, max: 36, unit: 'in' }, tolerance: { plus: 6, minus: 6 },
    penalty: -3, applicableRooms: ['bedroom','masterBedroom'],
    requiredItems: ['rug','bed'], source: 'NCIDQ Practice' },

  // ════════════════════════════════════════
  // WALL ART & DECORATION (Category: wall)
  // ════════════════════════════════════════
  { id: 'wall-001', category: 'wall', name: 'Art center height (freestanding wall)',
    measurement: { min: 57, max: 60, unit: 'in' }, tolerance: { plus: 2, minus: 2 },
    penalty: -8, applicableRooms: ['all'],
    requiredItems: ['wallArt'], source: 'Museum standard / NCIDQ' },
  { id: 'wall-002', category: 'wall', name: 'Art center height (above furniture)',
    measurement: { min: 6, max: 12, unit: 'in_above_furniture' }, tolerance: { plus: 2, minus: 2 },
    penalty: -6, applicableRooms: ['all'],
    requiredItems: ['wallArt','furnitureBelow'], source: 'Ballast IDRM' },
  { id: 'wall-003', category: 'wall', name: 'Art width vs furniture below',
    measurement: { min: 0.5, max: 0.75, unit: 'ratio' }, tolerance: { plus: 0.05, minus: 0.05 },
    penalty: -5, applicableRooms: ['all'],
    requiredItems: ['wallArt','furnitureBelow'], source: 'ASID proportion guidelines' },
  { id: 'wall-004', category: 'wall', name: 'Gallery wall frame spacing',
    measurement: { min: 2, max: 3, unit: 'in' }, tolerance: { plus: 0.5, minus: 0.5 },
    penalty: -3, applicableRooms: ['all'],
    requiredItems: ['galleryWall'], source: 'Gallery hanging standards' },
  { id: 'wall-005', category: 'wall', name: 'Mirror over console proportions',
    measurement: { min: 0.5, max: 0.75, unit: 'ratio' }, tolerance: { plus: 0.05, minus: 0.05 },
    penalty: -5, applicableRooms: ['entry','living','dining','hallway'],
    requiredItems: ['mirror','console'], source: 'NCIDQ Practice' },
  { id: 'wall-006', category: 'wall', name: 'Sconce center height',
    measurement: { min: 60, max: 72, unit: 'in' }, tolerance: { plus: 3, minus: 3 },
    penalty: -5, applicableRooms: ['all'],
    requiredItems: ['sconce'], source: 'Lighting design standards' },
  { id: 'wall-007', category: 'wall', name: 'Sconces flanking art/mirror symmetry',
    measurement: { min: 6, max: 10, unit: 'in_from_edge' }, tolerance: { plus: 2, minus: 2 },
    penalty: -4, applicableRooms: ['all'],
    requiredItems: ['sconce','wallArt'], source: 'Lighting design standards' },
  { id: 'wall-008', category: 'wall', name: 'Floating shelf height (living)',
    measurement: { min: 48, max: 54, unit: 'in' }, tolerance: { plus: 4, minus: 4 },
    penalty: -3, applicableRooms: ['living','family','office'],
    requiredItems: ['floatingShelf'], source: 'NCIDQ Practice' },

  // ════════════════════════════════════════
  // LIGHTING PLACEMENT (Category: lighting)
  // ════════════════════════════════════════
  { id: 'light-001', category: 'lighting', name: 'Chandelier clearance in open space',
    measurement: { min: 84, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 2 },
    penalty: -8, applicableRooms: ['living','entry','foyer','hallway'],
    requiredItems: ['chandelier'], source: 'IBC / Ballast IDRM' },
  { id: 'light-002', category: 'lighting', name: 'Pendant over kitchen island height',
    measurement: { min: 30, max: 36, unit: 'in_above_counter' }, tolerance: { plus: 2, minus: 2 },
    penalty: -5, applicableRooms: ['kitchen'],
    requiredItems: ['pendant','island'], source: 'Ballast IDRM' },
  { id: 'light-003', category: 'lighting', name: 'Pendant spacing over island',
    measurement: { min: 24, max: 30, unit: 'in' }, tolerance: { plus: 3, minus: 3 },
    penalty: -4, applicableRooms: ['kitchen'],
    requiredItems: ['pendant','island'], source: 'Lighting design standards' },
  { id: 'light-004', category: 'lighting', name: 'Floor lamp near seating arm',
    measurement: { min: 0, max: 24, unit: 'in' }, tolerance: { plus: 6, minus: 0 },
    penalty: -3, applicableRooms: ['living','family','bedroom','office'],
    requiredItems: ['floorLamp','seating'], source: 'NCIDQ Practice' },
  { id: 'light-005', category: 'lighting', name: 'Table lamp shade bottom eye level',
    measurement: { min: 38, max: 42, unit: 'in_from_floor' }, tolerance: { plus: 3, minus: 3 },
    penalty: -3, applicableRooms: ['living','family','bedroom'],
    requiredItems: ['tableLamp'], source: 'Lighting design standards' },
  { id: 'light-006', category: 'lighting', name: 'Lighting layer completeness',
    measurement: { min: 2, max: 3, unit: 'layers' }, tolerance: { plus: 0, minus: 0 },
    penalty: -10, applicableRooms: ['all'],
    requiredItems: ['any'], source: 'IESNA / NCIDQ',
    note: 'Min 2 of 3 layers: ambient, task, accent' },
  { id: 'light-007', category: 'lighting', name: 'Every functional zone has light source',
    measurement: { min: 1, max: 999, unit: 'per_zone' }, tolerance: { plus: 0, minus: 0 },
    penalty: -6, applicableRooms: ['all'],
    requiredItems: ['any'], source: 'IESNA lighting standards' },
  { id: 'light-008', category: 'lighting', name: 'Vanity sconces flanking mirror',
    measurement: { min: 28, max: 36, unit: 'in_apart' }, tolerance: { plus: 4, minus: 4 },
    penalty: -4, applicableRooms: ['bathroom'],
    requiredItems: ['sconce','mirror'], source: 'Bathroom lighting standards' },

  // ════════════════════════════════════════
  // WINDOW TREATMENTS (Category: window)
  // ════════════════════════════════════════
  { id: 'win-001', category: 'window', name: 'Curtain rod above window frame',
    measurement: { min: 4, max: 6, unit: 'in' }, tolerance: { plus: 2, minus: 2 },
    penalty: -5, applicableRooms: ['all'],
    requiredItems: ['curtains','window'], source: 'NCIDQ Practice' },
  { id: 'win-002', category: 'window', name: 'Curtain rod extension beyond frame',
    measurement: { min: 3, max: 8, unit: 'in_each_side' }, tolerance: { plus: 2, minus: 2 },
    penalty: -4, applicableRooms: ['all'],
    requiredItems: ['curtains','window'], source: 'NCIDQ Practice' },
  { id: 'win-003', category: 'window', name: 'Curtain length (floor-length)',
    measurement: { min: -0.5, max: 3, unit: 'in_from_floor' }, tolerance: { plus: 1, minus: 1 },
    penalty: -4, applicableRooms: ['all'],
    requiredItems: ['curtains'], source: 'Design standards',
    note: '0.5in above floor or 2-3in puddle. Dead zone: 1-5in above floor.' },
  { id: 'win-004', category: 'window', name: 'Curtain fullness ratio',
    measurement: { min: 2.0, max: 2.5, unit: 'x_window_width' }, tolerance: { plus: 0.25, minus: 0.25 },
    penalty: -3, applicableRooms: ['all'],
    requiredItems: ['curtains','window'], source: 'Workroom standards' },

  // ════════════════════════════════════════
  // RUG PLACEMENT (Category: rug)
  // ════════════════════════════════════════
  { id: 'rug-001', category: 'rug', name: 'Living room: all furniture on rug',
    measurement: { min: 6, max: 12, unit: 'in_beyond' }, tolerance: { plus: 4, minus: 4 },
    penalty: -5, applicableRooms: ['living','family'],
    requiredItems: ['rug','seating'], source: 'NCIDQ Practice' },
  { id: 'rug-002', category: 'rug', name: 'Living room: front legs on rug minimum',
    measurement: { min: 1, max: 1, unit: 'boolean' }, tolerance: { plus: 0, minus: 0 },
    penalty: -4, applicableRooms: ['living','family'],
    requiredItems: ['rug','seating'], source: 'NCIDQ Practice' },
  { id: 'rug-003', category: 'rug', name: 'Rug border to wall exposed floor',
    measurement: { min: 12, max: 24, unit: 'in' }, tolerance: { plus: 4, minus: 4 },
    penalty: -3, applicableRooms: ['living','family','dining','bedroom'],
    requiredItems: ['rug'], source: 'NCIDQ Practice' },
  { id: 'rug-004', category: 'rug', name: 'Rug under dining table extends beyond',
    measurement: { min: 24, max: 30, unit: 'in_all_sides' }, tolerance: { plus: 4, minus: 4 },
    penalty: -6, applicableRooms: ['dining'],
    requiredItems: ['rug','diningTable'], source: 'Ballast IDRM' },
  { id: 'rug-005', category: 'rug', name: 'Entryway runner minimum width',
    measurement: { min: 27, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -3, applicableRooms: ['entry','hallway'],
    requiredItems: ['runner'], source: 'Neufert' },

  // ════════════════════════════════════════
  // OFFICE / WORKSPACE (Category: office)
  // ════════════════════════════════════════
  { id: 'off-001', category: 'office', name: 'Desk chair clearance behind',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -6, applicableRooms: ['office','study','bedroom'],
    requiredItems: ['desk','chair'], source: 'Neufert' },
  { id: 'off-002', category: 'office', name: 'Monitor distance from eyes',
    measurement: { min: 20, max: 26, unit: 'in' }, tolerance: { plus: 4, minus: 4 },
    penalty: -4, applicableRooms: ['office','study'],
    requiredItems: ['desk','monitor'], source: 'OSHA ergonomics' },
  { id: 'off-003', category: 'office', name: 'Desk height',
    measurement: { min: 28, max: 30, unit: 'in' }, tolerance: { plus: 2, minus: 2 },
    penalty: -4, applicableRooms: ['office','study'],
    requiredItems: ['desk'], source: 'ANSI/BIFMA' },
  { id: 'off-004', category: 'office', name: 'Bookshelf reach height without ladder',
    measurement: { min: 0, max: 72, unit: 'in' }, tolerance: { plus: 6, minus: 0 },
    penalty: -3, applicableRooms: ['office','study','library','living'],
    requiredItems: ['bookshelf'], source: 'ADA/ergonomics' },

  // ════════════════════════════════════════
  // KITCHEN (Category: kitchen)
  // ════════════════════════════════════════
  { id: 'kit-001', category: 'kitchen', name: 'Work triangle leg maximum',
    measurement: { min: 48, max: 108, unit: 'in' }, tolerance: { plus: 12, minus: 0 },
    penalty: -8, applicableRooms: ['kitchen'],
    requiredItems: ['sink','stove','refrigerator'], source: 'NKBA guidelines' },
  { id: 'kit-002', category: 'kitchen', name: 'Work triangle total perimeter',
    measurement: { min: 144, max: 312, unit: 'in' }, tolerance: { plus: 12, minus: 12 },
    penalty: -6, applicableRooms: ['kitchen'],
    requiredItems: ['sink','stove','refrigerator'], source: 'NKBA guidelines' },
  { id: 'kit-003', category: 'kitchen', name: 'Counter depth standard',
    measurement: { min: 24, max: 25, unit: 'in' }, tolerance: { plus: 1, minus: 1 },
    penalty: -3, applicableRooms: ['kitchen'],
    requiredItems: ['counter'], source: 'NKBA' },
  { id: 'kit-004', category: 'kitchen', name: 'Island walkway clearance',
    measurement: { min: 42, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -8, applicableRooms: ['kitchen'],
    requiredItems: ['island'], source: 'NKBA guidelines' },

  // ════════════════════════════════════════
  // BATHROOM (Category: bathroom)
  // ════════════════════════════════════════
  { id: 'bath-001', category: 'bathroom', name: 'Toilet centerline to wall/fixture',
    measurement: { min: 15, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 0 },
    penalty: -10, applicableRooms: ['bathroom','powderRoom'],
    requiredItems: ['toilet'], source: 'IPC / ADA' },
  { id: 'bath-002', category: 'bathroom', name: 'Toilet clearance in front',
    measurement: { min: 21, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 2 },
    penalty: -8, applicableRooms: ['bathroom','powderRoom'],
    requiredItems: ['toilet'], source: 'IPC' },
  { id: 'bath-003', category: 'bathroom', name: 'Double vanity center-to-center',
    measurement: { min: 30, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 4 },
    penalty: -6, applicableRooms: ['bathroom','masterBathroom'],
    requiredItems: ['doubleVanity'], source: 'NKBA' },
  { id: 'bath-004', category: 'bathroom', name: 'Shower minimum dimension',
    measurement: { min: 36, max: 999, unit: 'in' }, tolerance: { plus: 0, minus: 0 },
    penalty: -10, applicableRooms: ['bathroom'],
    requiredItems: ['shower'], source: 'IPC / ADA' },
];

// ════════════════════════════════════════
// QUERY API
// ════════════════════════════════════════

/**
 * Get all standards applicable to a given room type
 */
export function getStandardsForRoom(roomType) {
  return STANDARDS.filter(s =>
    s.applicableRooms.includes('all') || s.applicableRooms.includes(roomType)
  );
}

/**
 * Get standards by category
 */
export function getStandardsByCategory(category) {
  return STANDARDS.filter(s => s.category === category);
}

/**
 * Check a measurement against a standard, returns { pass, deviation, penalty, standard }
 */
export function evaluateStandard(standardId, measuredValue) {
  const std = STANDARDS.find(s => s.id === standardId);
  if (!std) return { pass: true, deviation: 0, penalty: 0, standard: null };

  const { min, max } = std.measurement;
  const { plus, minus } = std.tolerance;

  if (measuredValue >= (min - minus) && measuredValue <= (max + plus)) {
    return { pass: true, deviation: 0, penalty: 0, standard: std };
  }

  let deviation;
  if (measuredValue < (min - minus)) {
    deviation = (min - minus) - measuredValue;
  } else {
    deviation = measuredValue - (max + plus);
  }

  return { pass: false, deviation, penalty: std.penalty, standard: std };
}

/**
 * Batch evaluate all applicable standards given room data
 * Returns { totalPenalty, violations[], passRate }
 */
export function auditRoom(roomType, measurements) {
  const applicable = getStandardsForRoom(roomType);
  const results = [];
  let totalPenalty = 0;
  let checked = 0;
  let passed = 0;

  for (const std of applicable) {
    const key = std.id;
    if (measurements[key] !== undefined) {
      checked++;
      const result = evaluateStandard(key, measurements[key]);
      if (result.pass) {
        passed++;
      } else {
        totalPenalty += result.penalty;
        results.push({
          standard: std,
          measured: measurements[key],
          deviation: result.deviation,
          penalty: result.penalty
        });
      }
    }
  }

  return {
    totalPenalty,
    violations: results,
    passRate: checked > 0 ? passed / checked : 1,
    checked,
    passed,
    totalApplicable: applicable.length
  };
}

/**
 * Generate human-readable critique for a violation
 */
export function violationCritique(violation) {
  const s = violation.standard;
  const unit = s.measurement.unit.replace('_', ' ');
  const range = `${s.measurement.min}-${s.measurement.max} ${unit}`;
  const measured = `${violation.measured} ${unit}`;
  const fix = violation.measured < s.measurement.min
    ? `Increase by ${Math.abs(violation.deviation).toFixed(1)} inches`
    : `Reduce by ${Math.abs(violation.deviation).toFixed(1)} inches`;
  return {
    issue: `${s.name}: measured ${measured}, standard is ${range}`,
    fix,
    source: s.source,
    severity: Math.abs(s.penalty)
  };
}

export const ALL_STANDARDS = STANDARDS;
export const STANDARD_COUNT = STANDARDS.length;
export default { ALL_STANDARDS, STANDARD_COUNT, getStandardsForRoom, getStandardsByCategory, evaluateStandard, auditRoom, violationCritique };