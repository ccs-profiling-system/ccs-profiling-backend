import { Database } from '../index';
import { rooms } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface RoomSeed {
  name: string;
  building: string;
  capacity: number;
  type: string;
  facilities: string[];
  status: string;
}

const roomSeeds: RoomSeed[] = [
  // Main Building - Lecture Rooms
  {
    name: 'Room 101',
    building: 'Main Building',
    capacity: 40,
    type: 'lecture',
    facilities: ['projector', 'whiteboard', 'aircon', 'speakers'],
    status: 'available',
  },
  {
    name: 'Room 102',
    building: 'Main Building',
    capacity: 40,
    type: 'lecture',
    facilities: ['projector', 'whiteboard', 'aircon', 'speakers'],
    status: 'available',
  },
  {
    name: 'Room 103',
    building: 'Main Building',
    capacity: 35,
    type: 'lecture',
    facilities: ['projector', 'whiteboard', 'aircon'],
    status: 'available',
  },
  {
    name: 'Room 201',
    building: 'Main Building',
    capacity: 45,
    type: 'lecture',
    facilities: ['projector', 'whiteboard', 'aircon', 'speakers', 'smart_board'],
    status: 'available',
  },
  {
    name: 'Room 202',
    building: 'Main Building',
    capacity: 45,
    type: 'lecture',
    facilities: ['projector', 'whiteboard', 'aircon', 'speakers'],
    status: 'available',
  },

  // Computer Laboratory Building
  {
    name: 'ComLab 1',
    building: 'Computer Laboratory Building',
    capacity: 30,
    type: 'laboratory',
    facilities: ['computers', 'projector', 'whiteboard', 'aircon', 'network'],
    status: 'available',
  },
  {
    name: 'ComLab 2',
    building: 'Computer Laboratory Building',
    capacity: 30,
    type: 'laboratory',
    facilities: ['computers', 'projector', 'whiteboard', 'aircon', 'network'],
    status: 'available',
  },
  {
    name: 'ComLab 3',
    building: 'Computer Laboratory Building',
    capacity: 35,
    type: 'laboratory',
    facilities: ['computers', 'projector', 'whiteboard', 'aircon', 'network', 'server_rack'],
    status: 'available',
  },
  {
    name: 'ComLab 4',
    building: 'Computer Laboratory Building',
    capacity: 25,
    type: 'laboratory',
    facilities: ['computers', 'projector', 'whiteboard', 'aircon', 'network'],
    status: 'available',
  },

  // Science Building
  {
    name: 'Physics Lab',
    building: 'Science Building',
    capacity: 25,
    type: 'laboratory',
    facilities: ['lab_equipment', 'whiteboard', 'aircon', 'safety_equipment'],
    status: 'available',
  },
  {
    name: 'Chemistry Lab',
    building: 'Science Building',
    capacity: 25,
    type: 'laboratory',
    facilities: ['lab_equipment', 'whiteboard', 'aircon', 'safety_equipment', 'fume_hood'],
    status: 'available',
  },

  // Administration Building
  {
    name: 'Conference Room A',
    building: 'Administration Building',
    capacity: 20,
    type: 'conference',
    facilities: ['projector', 'whiteboard', 'aircon', 'conference_table', 'video_conferencing'],
    status: 'available',
  },
  {
    name: 'Conference Room B',
    building: 'Administration Building',
    capacity: 15,
    type: 'conference',
    facilities: ['projector', 'whiteboard', 'aircon', 'conference_table'],
    status: 'available',
  },
  {
    name: 'Auditorium',
    building: 'Administration Building',
    capacity: 200,
    type: 'auditorium',
    facilities: ['projector', 'sound_system', 'aircon', 'stage', 'lighting'],
    status: 'available',
  },

  // Library Building
  {
    name: 'Study Room 1',
    building: 'Library Building',
    capacity: 10,
    type: 'study_room',
    facilities: ['whiteboard', 'aircon', 'tables'],
    status: 'available',
  },
  {
    name: 'Study Room 2',
    building: 'Library Building',
    capacity: 10,
    type: 'study_room',
    facilities: ['whiteboard', 'aircon', 'tables'],
    status: 'available',
  },
  {
    name: 'Study Room 3',
    building: 'Library Building',
    capacity: 8,
    type: 'study_room',
    facilities: ['whiteboard', 'tables'],
    status: 'available',
  },

  // Engineering Building
  {
    name: 'Room E101',
    building: 'Engineering Building',
    capacity: 40,
    type: 'lecture',
    facilities: ['projector', 'whiteboard', 'aircon', 'speakers'],
    status: 'available',
  },
  {
    name: 'Room E102',
    building: 'Engineering Building',
    capacity: 40,
    type: 'lecture',
    facilities: ['projector', 'whiteboard', 'aircon', 'speakers'],
    status: 'available',
  },
  {
    name: 'Electronics Lab',
    building: 'Engineering Building',
    capacity: 25,
    type: 'laboratory',
    facilities: ['lab_equipment', 'whiteboard', 'aircon', 'oscilloscopes', 'power_supplies'],
    status: 'available',
  },
  {
    name: 'Robotics Lab',
    building: 'Engineering Building',
    capacity: 20,
    type: 'laboratory',
    facilities: ['lab_equipment', 'whiteboard', 'aircon', 'workbenches', 'tools'],
    status: 'available',
  },
];

export async function seedRooms(db: Database) {
  const createdRooms: { id: string; name: string }[] = [];

  console.log('  Creating rooms...');

  for (const seed of roomSeeds) {
    const id = generateUUIDv7();

    const [room] = await db
      .insert(rooms)
      .values({
        id,
        name: seed.name,
        building: seed.building,
        capacity: seed.capacity,
        type: seed.type,
        facilities: seed.facilities,
        status: seed.status,
      })
      .returning({ id: rooms.id, name: rooms.name });

    createdRooms.push(room);
    console.log(`  - Created room: ${seed.name} (${seed.building})`);
  }

  return createdRooms;
}
