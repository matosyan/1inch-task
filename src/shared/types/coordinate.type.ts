export type Coordinate = {
  crs?: {
    type: 'name';
    properties: {
      name: 'EPSG:4326';
    };
  };
  type: 'Point';
  coordinates: [number, number];
};

export type CoordinateShort = {
  lat: number;
  lng: number;
};

export type CoordinateLong = {
  latitude: number;
  longitude: number;
};
