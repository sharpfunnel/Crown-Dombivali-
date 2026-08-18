/**
 * Single source of truth for the Lodha Premier Dombivli Manpada landing page.
 * Copy is taken from the client requirements document.
 *
 * TODO(client): the phone/WhatsApp numbers, project address and RERA number
 * below are placeholders — replace them with the live details before launch.
 */

export const project = {
  name: "Lodha Premier Dombivli",
  brand: "Premier Quality Homes",
  fullName: "Lodha Premier Dombivli Manpada",
  locality: "Manpada, Dombivli East",
  /* From the project brochure. */
  address:
    "Lodha Premier Dombivli gallery, Premier Colony Ground, on Kalyan-Shil Road, Dombivli 421 203",
  corporateOffice:
    "One Lodha Place, near Lodha World Towers, Senapati Bapat Marg, Mumbai 400 013",
  reraNumbers: ["P51700048779", "P51700049154"],
  reraUrl: "https://maharera.maharashtra.gov.in",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Premier+Colony+Ground+Kalyan-Shil+Road+Dombivli",
  /** Keyless Google Maps embed — shows the place card and standard map chrome. */
  mapEmbedUrl:
    "https://maps.google.com/maps?q=" +
    encodeURIComponent("Premier Colony Ground, Kalyan-Shil Road, Dombivli 421203") +
    // z=17 → street level, so shop names and the surrounding roads are legible.
    "&t=&z=17&ie=UTF8&iwloc=B&output=embed",
  phone: "+91 84510 47710",
  phoneHref: "+918451047710",
  whatsappNumber: "+91 84510 47710",
  whatsappHref:
    "https://wa.me/918451047710?text=" +
    encodeURIComponent(
      "Hi, I'm interested in Lodha Premier Dombivli. Please share the price sheet and floor plans.",
    ),
  /** Label used on WhatsApp CTAs across the site. */
  whatsappCta: "Chat on WhatsApp: +91 84510 47710",
  email: "sales@crowndombivli.com",
} as const;

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */

export const hero = {
  heading: "Your Dream Home Awaits at Lodha Premier Dombivli, Mumbai.",
  subheading:
    "Premium 1, 2, 3 & 4 BHK Homes, Villas, Bungalows & Duplexes — Starting at ₹54 Lakhs++",
  badges: [
    "100 Acre Township",
    "Metro at Your Doorstep",
    "Starting ₹54 Lakhs++",
    "For NRIs & Mumbai Homebuyers",
    "Possession Starting This Year-End",
    "World-Class Amenities",
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  About + highlights                                                         */
/* -------------------------------------------------------------------------- */

export const about = {
  heading: "Experience Comfortable Modern Living",
  body: "Lodha Premier Dombivli is a thoughtfully planned residential township spread across 100 acres in the heart of the Mumbai metropolitan region, offering premium 1, 2, 3 & 4 BHK homes along with villas, bungalows and duplex residences. Designed for modern Mumbai families and NRI investors alike, Lodha Premier combines excellent connectivity, quality construction, green open spaces, world-class amenities and everyday convenience in one destination.",
} as const;

export type Highlight = { title: string; icon: IconName };

export const projectHighlights: Highlight[] = [
  { title: "100-Acre Residential Township", icon: "township" },
  { title: "1, 2, 3 & 4 BHK, Villas & Duplexes", icon: "home" },
  { title: "Metro Connectivity", icon: "metro" },
  { title: "Clubhouse", icon: "clubhouse" },
  { title: "Temple", icon: "temple" },
  { title: "Landscaped Gardens", icon: "garden" },
  { title: "Open Spaces", icon: "open" },
  { title: "Swimming Pool", icon: "pool" },
  { title: "Gymnasium", icon: "gym" },
  { title: "Community Hall", icon: "hall" },
  { title: "3-Tier Security", icon: "security" },
  { title: "Family-Friendly Community", icon: "family" },
];

/* -------------------------------------------------------------------------- */
/*  Pricing & configurations                                                   */
/* -------------------------------------------------------------------------- */

export type Room = { name: string; size: string };

export type Configuration = {
  id: string;
  type: string;
  carpetArea: string;
  price: string;
  priceNote: string;
  /** Brochure plan reference, e.g. "Typical Unit Plan — Ruby D, E & F". */
  plan: string;
  rooms: Room[];
};

/* Room dimensions are the typical unit plans published in the brochure. */
export const configurations: Configuration[] = [
  {
    id: "1bhk",
    type: "1 BHK",
    carpetArea: "444 sq. ft.",
    price: "₹54 Lakhs",
    priceNote: "++ Taxes & Charges",
    plan: "Typical Unit Plan — Ruby D, E & F",
    rooms: [
      { name: "Living Room", size: "10'0\" × 11'3\"" },
      { name: "Bedroom", size: "9'0\" × 9'3\"" },
      { name: "Kitchen", size: "6'6\" × 4'7\"" },
      { name: "Bath", size: "4'0\" × 3'5\"" },
      { name: "Toilet", size: "4'0\" × 6'4\"" },
      { name: "Foyer", size: "3'5\" wide" },
    ],
  },
  {
    id: "2bhk",
    type: "2 BHK",
    carpetArea: "487 sq. ft.",
    price: "₹59.99 Lakhs",
    priceNote: "+ Taxes",
    plan: "Typical Unit Plan — Coral C & D",
    rooms: [
      { name: "Living Room", size: "10'0\" × 12'10\"" },
      { name: "Master Bedroom", size: "9'0\" × 9'6\"" },
      { name: "Bedroom 02", size: "9'0\" × 9'6\"" },
      { name: "Kitchen", size: "6'3\" × 7'2\"" },
      { name: "Master Toilet", size: "4'4\" × 7'0\"" },
      { name: "Common Toilet", size: "4'5\" × 7'0\"" },
      { name: "Utility", size: "5'0\" × 3'0\"" },
    ],
  },
];

/**
 * The full range of homes at Lodha Premier Dombivli. 1 & 2 BHK carry confirmed starting
 * prices; the larger and premium formats are priced on request.
 *
 * TODO(client): add confirmed starting prices for 3/4 BHK, villas, bungalows
 * and duplexes when available, replacing "Price on request".
 */
export type PropertyType = {
  type: string;
  summary: string;
  price: string;
  priceNote: string;
};

export const propertyTypes: PropertyType[] = [
  { type: "1 BHK", summary: "Compact, efficient homes", price: "₹54 Lakhs", priceNote: "++ onwards*" },
  { type: "2 BHK", summary: "Spacious family homes", price: "₹59.99 Lakhs", priceNote: "onwards*" },
  { type: "3 BHK", summary: "Premium larger residences", price: "Price on request", priceNote: "" },
  { type: "4 BHK", summary: "Expansive luxury homes", price: "Price on request", priceNote: "" },
  { type: "Villas", summary: "Independent villa living", price: "Price on request", priceNote: "" },
  { type: "Bungalows", summary: "Private bungalow homes", price: "Price on request", priceNote: "" },
  { type: "Duplex Homes", summary: "Double-height duplex living", price: "Price on request", priceNote: "" },
];

/** Options for the "Property Preference" dropdown in the enquiry forms. */
export const propertyPreferences = ["1 BHK", "2 BHK", "3 BHK", "4 BHK"];

export const startingPrice = "₹54 Lakhs";

export const pricingNote =
  "All homes start at ₹54 Lakhs++*. Prices are negotiable; taxes and other charges are extra.";

export const bookingDetails = [
  {
    title: "Spot Booking Token",
    value: "₹99,000",
    body: "Reserve your preferred unit today with a nominal spot booking token.",
    icon: "token" as const,
  },
  {
    title: "Exclusive Booking Benefits",
    value: "Available",
    body: "Additional benefits are extended on bookings made during the current phase.",
    icon: "gift" as const,
  },
  {
    title: "Limited Period Offer",
    value: "Ongoing",
    body: "Current pricing and benefits apply for a limited period only.",
    icon: "clock" as const,
  },
  {
    title: "Possession",
    value: "This Year-End",
    body: "Possession for the current phase begins at the end of this year.",
    icon: "key" as const,
  },
];

/* -------------------------------------------------------------------------- */
/*  Amenities                                                                  */
/* -------------------------------------------------------------------------- */

export type AmenityGroup = {
  title: string;
  icon: IconName;
  items: string[];
};

/* Amenity list reconciled with the project brochure. */
export const amenityGroups: AmenityGroup[] = [
  {
    title: "Club Life",
    icon: "clubhouse",
    items: [
      "Grand Clubhouse",
      "Community Hall",
      "Ganesha Temple",
      "Indoor games room — chess, carrom, table tennis",
      "Activity rooms and training classes",
      "Café",
    ],
  },
  {
    title: "Health & Fitness",
    icon: "gym",
    items: [
      "World-class gym",
      "Swimming pool",
      "Sports ground for cricket, football and more",
      "Outdoor play area with swings and slides",
      "Walking areas",
    ],
  },
  {
    title: "Nature & Community",
    icon: "garden",
    items: [
      "Community farm for herbs and vegetables",
      "Landscaped gardens",
      "Green open spaces",
      "Kids play area",
    ],
  },
  {
    title: "Everyday Convenience",
    icon: "hall",
    items: [
      "General stores and retail plaza",
      "Work from home and study spaces",
      "Laundromat",
      "Spaces for small businesses",
      "Multi-level car park",
    ],
  },
  {
    title: "Safety & Services",
    icon: "security",
    items: [
      "Multi-tier security with secured lobby entry",
      "CCTV monitoring for key common areas",
      "State-of-the-art firefighting system",
      "DG power backup for common areas and fire elevator",
      "High-speed elevators",
    ],
  },
  {
    title: "Sustainability",
    icon: "open",
    items: [
      "Waste water recycling",
      "Rain water harvesting",
      "Solar panels for partial common area loads",
      "Towers facing a central courtyard for light and airflow",
    ],
  },
];

/** Interior and fit-out specification, from the brochure. */
export const specifications = [
  "Full-height windows in all rooms for maximum light and ventilation",
  "Living room with a separate dining area",
  "Premium vitrified flooring in living/dining, passage and bedrooms",
  "Kitchen finished with granite platform, stainless steel sink and vitrified flooring",
  "Provision of window AC in bedrooms",
  "Toilets finished with designer tiles in a European design style",
  "Sanitary ware and CP fittings from Jaquar / Cera / Parryware",
  "Provision for cable, telephone and internet connectivity",
  "Ground floor entrance lobby with designer finishes",
];

/** Design partners named in the brochure. */
export const partners = [
  {
    role: "Architecture",
    name: "Kapadia Associates",
    body: "Since 1991, Kapadia Associates has explored the terrain between architecture and design, combining deep design involvement with optimised managerial processes. The firm has won a number of prestigious awards.",
  },
  {
    role: "Landscape Design",
    name: "Prabhakar Bhagwat Associates",
    body: "Arguably the most influential landscape design firm in India, designing some of the nation's most remarkable landscapes for over eight decades, and the recipient of several international awards.",
  },
];

export const clubhouse = {
  heading: "A New Landmark Within the Community",
  highlight:
    "The newly opened clubhouse is designed to enrich everyday life with premium lifestyle experiences.",
  facilities: [
    "Modern Gym",
    "Swimming Pool",
    "Community Hall",
    "Temple",
    "Family Recreation Spaces",
    "Celebration Areas",
  ],
  cta: "Schedule a Clubhouse Visit",
} as const;

export const temple = {
  heading: "A Place of Peace & Positivity",
  body: "The beautifully designed temple within the township provides residents with a peaceful environment for daily prayers and spiritual well-being.",
} as const;

/* -------------------------------------------------------------------------- */
/*  Location                                                                   */
/* -------------------------------------------------------------------------- */

export const locationHighlights = [
  { place: "Metro Station", distance: "At doorstep", icon: "metro" as const },
  { place: "Jupiter Hospital", distance: "Nearby", icon: "hospital" as const },
  {
    place: "Thane Bullet Train Station",
    distance: "4 KM away",
    icon: "train" as const,
  },
];

/** Neighbourhood landmarks listed in the brochure. */
export const neighbourhood = [
  { label: "Malls", items: ["Xperia Mall"] },
  { label: "Supermarkets", items: ["Smart Bazaar", "Hyper Markets"] },
  {
    label: "Schools",
    items: [
      "Lodha World School",
      "Pawar Public School",
      "Shri Ram Universal School",
    ],
  },
  {
    label: "Transport nodes",
    items: [
      "On Kalyan-Shil Road",
      "Close to Dombivli Station",
      "Near upcoming metro & bullet train station",
    ],
  },
  { label: "Hospitals", items: ["Upcoming Jupiter Hospital", "AIMS Medical Centre"] },
];

/* -------------------------------------------------------------------------- */
/*  NRI investors                                                              */
/* -------------------------------------------------------------------------- */

export type NriBenefit = { title: string; body: string; icon: NriIcon };

export const nri = {
  heading: "Investing from abroad? We handle every step.",
  intro:
    "Hundreds of NRI families across the Gulf and USA have booked homes with us without flying down. From live video tours to documentation and repatriation guidance, your dedicated relationship manager takes care of it all — in your timezone.",
  regions: [
    "Dubai",
    "Abu Dhabi",
    "Sharjah",
    "Doha",
    "Riyadh",
    "Jeddah",
    "Kuwait City",
    "Muscat",
    "USA",
  ],
  benefits: [
    {
      title: "Live virtual site tours",
      body: "Walk the project, show flat and clubhouse over a live video call on WhatsApp or Zoom, scheduled to your local time.",
      icon: "video",
    },
    {
      title: "End-to-end documentation",
      body: "PAN, Aadhaar, Power of Attorney and NRE/NRO payment guidance — handled remotely, with e-signing wherever possible.",
      icon: "document",
    },
    {
      title: "NRI home-loan assistance",
      body: "Introductions to banks offering NRI home loans, with help preparing the paperwork lenders ask for.",
      icon: "bank",
    },
    {
      title: "RERA-registered & transparent",
      body: "A MahaRERA-registered project with a written price sheet you can verify from abroad — no surprises.",
      icon: "shield",
    },
    {
      title: "Repatriation-friendly",
      body: "Clear guidance on rental income and resale proceeds under RBI rules, so your investment stays liquid.",
      icon: "exchange",
    },
    {
      title: "Dedicated NRI manager",
      body: "One point of contact across time zones — reachable on WhatsApp, email and call from booking to possession.",
      icon: "headset",
    },
  ] as NriBenefit[],
} as const;

export type NriIcon =
  | "video"
  | "document"
  | "bank"
  | "shield"
  | "exchange"
  | "headset";

export const whyChoose = [
  "Excellent Metro Connectivity",
  "Fast-Developing Location",
  "Affordable Luxury",
  "Modern Lifestyle",
  "Excellent Investment Opportunity",
  "Green Township",
  "Premium Amenities",
  "Family-Friendly Environment",
];

/* -------------------------------------------------------------------------- */
/*  Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export type GalleryItem = {
  category: string;
  caption: string;
  /** null until the client supplies project photography. */
  image: string | null;
  /** true when the photo illustrates the idea rather than showing this project. */
  representative?: boolean;
};

export const galleryCategories = [
  "All",
  "Project Elevation",
  "Clubhouse",
  "Temple",
  "Swimming Pool",
  "Gardens",
  "Open Spaces",
  "Amenities",
  "Exterior Views",
];

/* Every tile is a distinct image — the three project categories use the
   township render, and the wider-context tiles use real Mumbai-region
   photography (flagged `representative`). No image repeats. */
export const gallery: GalleryItem[] = [
  {
    category: "Project Elevation",
    caption: "Tower cluster overlooking the river",
    image: "/images/render-elevation.jpg",
  },
  {
    category: "Clubhouse",
    caption: "Grand clubhouse and sports courts",
    image: "/images/render-clubhouse.jpg",
  },
  {
    category: "Temple",
    caption: "Temple within the township",
    image: "/images/mumbai-ganesha-temple.jpg",
    representative: true,
  },
  {
    category: "Swimming Pool",
    caption: "Resort-style swimming pool",
    image: "/images/pool.jpg",
    representative: true,
  },
  {
    category: "Gardens",
    caption: "Landscaped gardens and walkways",
    image: "/images/render-gardens.jpg",
  },
  {
    category: "Open Spaces",
    caption: "The wider Mumbai metropolitan region",
    image: "/images/mumbai-township-aerial.jpg",
    representative: true,
  },
  {
    category: "Amenities",
    caption: "Mumbai Metro connectivity",
    image: "/images/mumbai-metro.jpg",
    representative: true,
  },
  {
    category: "Exterior Views",
    caption: "Mumbai residential neighbourhood",
    image: "/images/mumbai-residential.jpg",
    representative: true,
  },
];

/* -------------------------------------------------------------------------- */
/*  Budget bands (shared by the site-visit and contact forms)                   */
/* -------------------------------------------------------------------------- */

export const budgetOptions = [
  "Under ₹55 Lakhs",
  "₹55 – ₹65 Lakhs",
  "₹65 – ₹80 Lakhs",
  "₹80 Lakhs and above",
];

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                        */
/* -------------------------------------------------------------------------- */

export const faqs = [
  {
    question: "What configurations are available?",
    answer:
      "Lodha Premier Dombivli offers premium 1, 2, 3 & 4 BHK apartments along with villas, bungalows and duplex homes. The 1 BHK has a carpet area of 444 sq. ft. and the 2 BHK is 487 sq. ft.; larger formats are available on request. Request the price sheet for the full unit-wise breakdown.",
  },
  {
    question: "What is the starting price?",
    answer:
      "Homes at Lodha Premier Dombivli start at ₹54 Lakhs++ for a 1 BHK, and ₹59.99 Lakhs + taxes for a 2 BHK. Pricing for 3 & 4 BHK, villas, bungalows and duplexes is shared on request. Taxes, government charges, registration and other applicable costs are extra.",
  },
  {
    question: "Are prices negotiable?",
    answer:
      "Yes. Pricing is negotiable. Share your requirement through the enquiry form or call us directly and we will discuss the best applicable price for your preferred configuration.",
  },
  {
    question: "What is the booking amount?",
    answer:
      "The spot booking token is ₹99,000. Bookings made during the current phase also qualify for exclusive booking benefits under a limited period offer.",
  },
  {
    question: "What is the possession timeline?",
    answer:
      "Possession for the current phase starts this year-end. Timelines for subsequent phases are shared at the time of booking.",
  },
  {
    question: "What amenities are included?",
    answer:
      "The township includes a grand clubhouse, temple, swimming pool, gymnasium, community hall, landscaped gardens, green open spaces, walking areas, indoor recreation and 3-tier security across a gated, CCTV-monitored community.",
  },
  {
    question: "Is there a clubhouse?",
    answer:
      "Yes — the newly opened clubhouse is already operational. It houses a modern gym, swimming pool, community hall, temple, family recreation spaces and celebration areas. Clubhouse visits can be scheduled on request.",
  },
  {
    question: "Is there a temple inside the project?",
    answer:
      "Yes. A beautifully designed temple sits within the township, giving residents a peaceful environment for daily prayers and spiritual well-being.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Legal                                                                      */
/* -------------------------------------------------------------------------- */

export const disclaimer =
  "The information, images, pricing, specifications, amenities, floor plans, and availability displayed on this website are indicative and subject to change without prior notice. Images shown are for representational purposes only. Taxes, government charges, registration charges, and other applicable costs are extra. Please contact us for the latest pricing, availability, and project details.";

export type IconName =
  | "township"
  | "home"
  | "metro"
  | "clubhouse"
  | "temple"
  | "garden"
  | "open"
  | "pool"
  | "gym"
  | "hall"
  | "security"
  | "family"
  | "hospital"
  | "train";
