// Dit bestand bevat de 5 computer-tegenstanders van Throttle Rush: alleen data, geen logica.
// Stel hier de moeilijkheid bij: skill 1.0 = perfect rijden, 0.8 = nog net netjes (zie docs/design/fase4-tegenstanders.md).
// line = voorkeurslijn in meter naast de middenlijn (+ = rechts), useShortcut = neemt de dirt-shortcut.

export const OPPONENTS = [
  {
    name: "Baron von Burnout",   // de sterke rivaal: rijdt altijd te hard en kijkt je daarbij verveeld aan
    typeKey: "sport",
    color: 0xd9269d,             // magenta
    skill: 0.95,
    line: -2,
    useShortcut: false,
  },
  {
    name: "Modder Mo",           // vindt dat asfalt voor watjes is; neemt elke afsnijding met een grijns
    typeKey: "cross",
    color: 0x7ed321,             // limoengroen
    skill: 0.9,
    line: 1.5,
    useShortcut: true,
  },
  {
    name: "Tante Turbo",         // gaat uit de bocht met stijl, maar komt er altijd weer vlot uit
    typeKey: "sport",
    color: 0x7b3fe4,             // paars
    skill: 0.88,
    line: 3,
    useShortcut: false,
  },
  {
    name: "Opa Oliebol",         // rustige bonk die niemand ruimte geeft en nooit haast heeft
    typeKey: "cruiser",
    color: 0x2f5fe0,             // koningsblauw
    skill: 0.94,
    line: 0,
    useShortcut: false,
  },
  {
    name: "Slakke Sam",          // is hier vooral voor de gezelligheid en stopt graag voor een foto
    typeKey: "cross",
    color: 0xf4f1e8,             // ivoorwit
    skill: 0.81,
    line: -3.5,
    useShortcut: true,
  },
];
