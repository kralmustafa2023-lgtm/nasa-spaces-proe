export type Asset = {
  id: string;
  label: string;
  sourcePage: string;
  localPath: string;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  optional: boolean;
  status: AssetStatus;
};

export type AssetStatus = 'ok' | 'needs-manual' | 'fallback' | 'missing';

export const assets = [
  { id: 'shuttle', label: 'Space Shuttle', sourcePage: 'https://science.nasa.gov/3d-resources/space-shuttle-d/', localPath: '/models/shuttle.glb', scale: 37, position: [0, 1.3, -5], rotation: [0, Math.PI / 2, 0], optional: false, status: 'ok' },
  { id: 'vab', label: 'Vehicle Assembly Building', sourcePage: 'https://science.nasa.gov/3d-resources/vehicle-assembly-building-vab/', localPath: '/models/vab.glb', scale: 160, position: [-4, 0, -5], rotation: [0, 0, 0], optional: false, status: 'ok' },
  { id: 'starMap', label: 'Yale Bright Star Map', sourcePage: 'https://science.nasa.gov/3d-resources/yale-bright-star-map/', localPath: '/models/starMap.glb', scale: 100, position: [0, 0, 0], rotation: [0, 0, 0], optional: true, status: 'missing' },
  { id: 'astronaut', label: 'Astronaut', sourcePage: 'https://science.nasa.gov/3d-resources/astronaut/', localPath: '/models/astronaut.glb', scale: 1.8, position: [-4, 0, -3], rotation: [0, 0, 0], optional: true, status: 'ok' },
  { id: 'missionControlRoom', label: 'JSC Mission Control Room', sourcePage: 'https://science.nasa.gov/3d-resources/jsc-mission-control-room/', localPath: '/models/missionControlRoom.glb', scale: 25, position: [4, 0, -4], rotation: [0, 0, 0], optional: true, status: 'ok' },
  { id: 'landsat8', label: 'Landsat 8', sourcePage: 'https://science.nasa.gov/3d-resources/landsat-8/', localPath: '/models/landsat8.glb', scale: 9, position: [-7, 5, -19], rotation: [0.2, 0.4, 0], optional: true, status: 'ok' },
  { id: 'markIIISuit', label: 'Mark III Spacesuit', sourcePage: 'https://science.nasa.gov/3d-resources/mark-iii-spacesuit/', localPath: '/models/markIIISuit.glb', scale: 2.1, position: [4, 0, -3], rotation: [0, 0, 0], optional: true, status: 'ok' },
  { id: 'issInternal', label: 'ISS Internal', sourcePage: 'https://science.nasa.gov/3d-resources/international-space-station-iss-e-internal/', localPath: '/models/issInternal.glb', scale: 4, position: [5, 0, -4], rotation: [0, 0, 0], optional: false, status: 'ok' },
  { id: 'jason1', label: 'Jason-1', sourcePage: 'https://science.nasa.gov/3d-resources/jason-1/', localPath: '/models/jason1.glb', scale: 7, position: [8, 4, -22], rotation: [0, -0.7, 0.2], optional: true, status: 'ok' },
  { id: 'headquarters', label: 'NASA Headquarters', sourcePage: 'https://science.nasa.gov/3d-resources/headquarters-building/', localPath: '/models/headquarters.glb', scale: 25, position: [4, 0, -5], rotation: [0, 0, 0], optional: false, status: 'ok' },
] satisfies Asset[];

export type AssetId = typeof assets[number]['id'];
