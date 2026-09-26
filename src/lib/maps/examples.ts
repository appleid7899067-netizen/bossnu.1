import type { MindMapData } from "@/lib/types";

export const EXAMPLE_MAPS: { id: string; data: MindMapData }[] = [
  {
    id: "ex-water",
    data: {
      topic: "The water cycle",
      summary:
        "Water travels from oceans and lakes into the air, into clouds, and back down to Earth — again and again.",
      branches: [
        {
          id: "evaporation",
          label: "Evaporation",
          tone: "sky",
          children: [
            {
              id: "sun-heat",
              label: "Sun warms water",
              note: "Heat from the sun turns liquid water into an invisible gas called vapor.",
            },
            {
              id: "vapor-rises",
              label: "Vapor rises",
              note: "Warm vapor is light, so it floats up into the cooler air above us.",
            },
          ],
        },
        {
          id: "condensation",
          label: "Condensation",
          tone: "sage",
          children: [
            {
              id: "cool-air",
              label: "Air cools",
              note: "High up, the air is colder, so vapor slows down and becomes tiny droplets.",
            },
            {
              id: "clouds",
              label: "Clouds form",
              note: "Billions of droplets cling to dust and gather into clouds we can see.",
            },
          ],
        },
        {
          id: "precipitation",
          label: "Precipitation",
          tone: "ink",
          children: [
            {
              id: "drops-grow",
              label: "Drops grow heavy",
              note: "Droplets bump together until they are too heavy to stay in the cloud.",
            },
            {
              id: "rain-snow",
              label: "Rain or snow",
              note: "Water falls as rain, snow, or hail, depending on how cold the air is.",
            },
          ],
        },
        {
          id: "collection",
          label: "Collection",
          tone: "clay",
          children: [
            {
              id: "rivers",
              label: "Rivers and lakes",
              note: "Fallen water gathers in streams, rivers, lakes, and the soil.",
            },
            {
              id: "ocean",
              label: "Back to the ocean",
              note: "Much of it flows back to the sea, ready to evaporate once more.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "ex-bees",
    data: {
      topic: "How bees make honey",
      summary:
        "Honey begins as flower nectar. Bees collect it, share it, dry it, and store it as food for the hive.",
      branches: [
        {
          id: "forage",
          label: "Foraging",
          tone: "sand",
          children: [
            {
              id: "flowers",
              label: "Visit flowers",
              note: "Worker bees sip nectar with a long tongue and carry pollen on their legs.",
            },
            {
              id: "sac",
              label: "Nectar sac",
              note: "Nectar is stored in a special stomach so the bee can fly it home.",
            },
          ],
        },
        {
          id: "hive",
          label: "In the hive",
          tone: "sage",
          children: [
            {
              id: "share",
              label: "Pass it on",
              note: "Foragers give nectar to house bees, who chew it with enzymes.",
            },
            {
              id: "dry",
              label: "Fan and dry",
              note: "Bees fan their wings to evaporate water until the nectar thickens.",
            },
          ],
        },
        {
          id: "store",
          label: "Storage",
          tone: "clay",
          children: [
            {
              id: "comb",
              label: "Wax comb",
              note: "Thick honey is placed in hexagonal wax cells built by the colony.",
            },
            {
              id: "cap",
              label: "Capped cells",
              note: "A wax lid seals each cell so honey keeps through the winter.",
            },
          ],
        },
      ],
    },
  },
];
