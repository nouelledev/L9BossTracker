export type Boss = {
  id: string;
  level: number;
  name: string;
  location: string;
  spawnTime: string;
  isFixedSpawn: boolean;
  respawnCooldown: number | null;
  image: string;
};

export const BOSSES: Boss[] = [
  { id: "32", level: 60, name: "Venatus", location: "Corrupted River Stream", spawnTime: "", isFixedSpawn: false, respawnCooldown: 10, image: "/bosses/venatus.png" },
  { id: "33", level: 65, name: "Viorent", location: "Gill Stream", spawnTime: "", isFixedSpawn: false, respawnCooldown: 10, image: "/bosses/viorent.png" },
  { id: "34", level: 70, name: "Ego", location: "Reclaimed Gathering Point", spawnTime: "", isFixedSpawn: false, respawnCooldown: 21, image: "/bosses/ego.png" },
  { id: "35", level: 70, name: "Clemantis", location: "White Witch's Cradle", spawnTime: "Mon 11:30 & Thu 19:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/clemantis.png" },
  { id: "36", level: 75, name: "Livera", location: "Black Storm Peninsula", spawnTime: "", isFixedSpawn: false, respawnCooldown: 24, image: "/bosses/livera.png" },
  { id: "37", level: 75, name: "Araneo", location: "Lower Tomb of Tyriosa 1F", spawnTime: "", isFixedSpawn: false, respawnCooldown: 24, image: "/bosses/araneo.png" },
  { id: "38", level: 80, name: "Undomiel", location: "Test Subject Lab", spawnTime: "", isFixedSpawn: false, respawnCooldown: 24, image: "/bosses/undomiel.png" },
  { id: "39", level: 80, name: "Saphirus", location: "Moonlight Shackle", spawnTime: "Sun 17:00 & Tue 11:30", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/saphirus.png" },
  { id: "40", level: 80, name: "Neutro", location: "Battlefield of Love and Hatred", spawnTime: "Tue 19:00 & Thu 11:30", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/neutro.png" },
  { id: "41", level: 85, name: "Lady Dalia", location: "Bloody Shadow", spawnTime: "", isFixedSpawn: false, respawnCooldown: 18, image: "/bosses/ladydalia.png" },
  { id: "42", level: 85, name: "General Aquleus", location: "Lower Tomb of Tyriosa 2F", spawnTime: "", isFixedSpawn: false, respawnCooldown: 29, image: "/bosses/generalaquleus.png" },
  { id: "43", level: 85, name: "Thymele", location: "Mark of Rampage", spawnTime: "Mon 19:00 & Wed 11:30", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/thymele.png" },
  { id: "44", level: 88, name: "Amentis", location: "Limestone Cape", spawnTime: "", isFixedSpawn: false, respawnCooldown: 29, image: "/bosses/amentis.png" },
  { id: "45", level: 88, name: "Baron Braudmore", location: "Rosevine Bridge", spawnTime: "", isFixedSpawn: false, respawnCooldown: 32, image: "/bosses/baronbraudmore.png" },
  { id: "46", level: 90, name: "Milavy", location: "Lower Tomb of Tyriosa 3F", spawnTime: "Sat 15:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/milavy.png" },
  { id: "47", level: 93, name: "Wannitas", location: "Snare Swamp", spawnTime: "", isFixedSpawn: false, respawnCooldown: 48, image: "/bosses/wannitas.png" },
  { id: "48", level: 93, name: "Metus", location: "Follower's Field", spawnTime: "", isFixedSpawn: false, respawnCooldown: 48, image: "/bosses/metus.png" },
  { id: "49", level: 93, name: "Duplican", location: "Open-Eyed Puppet's Throne", spawnTime: "", isFixedSpawn: false, respawnCooldown: 48, image: "/bosses/duplican.png" },
  { id: "51", level: 95, name: "Ringor", location: "Torchlight Highway", spawnTime: "Sat 17:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/ringor.png" },
  { id: "50", level: 95, name: "Shuliar", location: "Masquerade of Hounds", spawnTime: "", isFixedSpawn: false, respawnCooldown: 35, image: "/bosses/shuliar.png" },
  { id: "52", level: 95, name: "Roderick", location: "Garbana Underground Waterway 1F", spawnTime: "Fri 19:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/roderick.png" },
  { id: "53", level: 98, name: "Gareth", location: "Deadman's Land District 1", spawnTime: "", isFixedSpawn: false, respawnCooldown: 32, image: "/bosses/gareth.png" },
  { id: "54", level: 98, name: "Titore", location: "Deadman's Land District 2", spawnTime: "", isFixedSpawn: false, respawnCooldown: 37, image: "/bosses/titore.png" },
  { id: "55", level: 98, name: "Larba", location: "Garbana Reclaimed Land", spawnTime: "", isFixedSpawn: false, respawnCooldown: 35, image: "/bosses/larba.png" },
  { id: "56", level: 100, name: "Catena", location: "Deadman's Land District 3", spawnTime: "", isFixedSpawn: false, respawnCooldown: 35, image: "/bosses/catena.png" },
  { id: "57", level: 100, name: "Auraq", location: "Garbana Underground Waterway 2F", spawnTime: "Sun 21:00 & Wed 21:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/auraq.png" },
  { id: "58", level: 100, name: "Secreta", location: "Kallion's Tomb", spawnTime: "", isFixedSpawn: false, respawnCooldown: 62, image: "/bosses/secreta.png" },
  { id: "59", level: 100, name: "Ordo", location: "Successor's Paradise", spawnTime: "", isFixedSpawn: false, respawnCooldown: 62, image: "/bosses/ordo.png" },
  { id: "60", level: 100, name: "Asta", location: "Goldblood Plain", spawnTime: "", isFixedSpawn: false, respawnCooldown: 62, image: "/bosses/asta.png" },
  { id: "61", level: 100, name: "Supore", location: "Goldblood Plain", spawnTime: "", isFixedSpawn: false, respawnCooldown: 62, image: "/bosses/supore.png" },
  { id: "62", level: 120, name: "Chaiflock", location: "Kallion's Tomb", spawnTime: "Sat 22:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/chaiflock.png" },
  { id: "63", level: 120, name: "Benji", location: "Nest of Vengeance", spawnTime: "Sun 21:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/benji.png" },
  { id: "71", level: 130, name: "Libitina", location: "Chapel of Eternal Vassalage", spawnTime: "Mon 21:00 & Sat 21:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/libitina.png" },
  { id: "72", level: 130, name: "Rakajeth", location: "Secreta's Punishment", spawnTime: "Tue 22:00 & Sun 19:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/rakajeth.png" },
  { id: "66", level: 135, name: "Motti", location: "Evelyn's Outer Court", spawnTime: "Wed 19:00 & Sat 19:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/motti.png" },
  { id: "64", level: 135, name: "Icaruthia", location: "Royal Valley", spawnTime: "Tue 21:00 & Fri 21:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/icaruthia.png" },
  { id: "70", level: 140, name: "Tumier", location: "Garbana Underground, Waterway 3F", spawnTime: "Sun 19:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/tumier.png" },
  { id: "68", level: 140, name: "Nevaeh", location: "Celine's Courtyard", spawnTime: "Sun 22:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/nevaeh.png" },
  { id: "73", level: 145, name: "Lucus", location: "Silent Smelter", spawnTime: "Sat 22:00", isFixedSpawn: true, respawnCooldown: null, image: "/bosses/lucus.png" },
];
