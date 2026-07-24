/**
 * Single source of truth for the Crown Dombivli Manpada landing page.
 * Copy is taken from the client requirements document.
 *
 * TODO(client): the phone/WhatsApp numbers, project address and RERA number
 * below are placeholders — replace them with the live details before launch.
 */

export const project = {
  name: "Crown Dombivli",
  brand: "Crown Quality Homes",
  fullName: "Crown Dombivli Manpada",
  locality: "Manpada, Dombivli East",
  /* From the project brochure. */
  address:
    "Crown Dombivli gallery, Premier Colony Ground, on Kalyan-Shil Road, Dombivli 421 203",
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
  phone: "+91 90000 00000",
  phoneHref: "+919000000000",
  whatsappHref:
    "https://wa.me/919000000000?text=" +
    encodeURIComponent(
      "Hi, I'm interested in Crown Dombivli Manpada. Please share the price sheet and brochure.",
    ),
  email: "sales@crowndombivli.com",
  brochureHref: "#lead-form",
} as const;

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */

export const hero = {
  heading: "Your Dream Home Awaits at Crown Dombivli, Manpada.",
  subheading: "Premium 1 & 2 BHK Homes Starting at ₹39.99 Lakhs*",
  badges: [
    "17 Acre Township",
    "Metro at Your Doorstep",
    "Starting ₹39.99 Lakhs*",
    "Negotiable Pricing",
    "Possession Starting This Year-End",
    "World-Class Amenities",
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  About + highlights                                                         */
/* -------------------------------------------------------------------------- */

export const about = {
  heading: "Experience Comfortable Modern Living",
  body: "Crown Dombivli Manpada is a thoughtfully planned residential township spread across 17 acres, offering premium 1 & 2 BHK homes designed for modern families. The project combines excellent connectivity, quality construction, green open spaces, premium amenities, and everyday convenience in one destination.",
} as const;

export type Highlight = { title: string; icon: IconName };

export const projectHighlights: Highlight[] = [
  { title: "17-Acre Residential Township", icon: "township" },
  { title: "Premium 1 & 2 BHK Homes", icon: "home" },
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
    carpetArea: "322 sq. ft.",
    price: "₹39.99 Lakhs",
    priceNote: "+ Taxes",
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

export const pricingNote = "Prices are negotiable.";

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
  { place: "Metro Station", distance: "0 Minutes", icon: "metro" as const },
  { place: "Jupiter Hospital", distance: "Nearby", icon: "hospital" as const },
  {
    place: "Thane Bullet Train Station",
    distance: "4 KM",
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

/* One image per category. Views are taken from the project's own township
   render, so the gallery shows this development rather than stock imagery. */
export const gallery: GalleryItem[] = [
  {
    category: "Project Elevation",
    caption: "Tower cluster overlooking the river",
    image: "/images/render-elevation.jpg",
  },
  {
    category: "Clubhouse",
    caption: "Grand clubhouse",
    image: "/images/render-clubhouse.jpg",
  },
  {
    category: "Temple",
    caption: "Ganesha temple",
    image: "/images/mumbai-ganesha-temple.jpg",
    representative: true,
  },
  { category: "Swimming Pool", caption: "Swimming pool", image: null },
  {
    category: "Gardens",
    caption: "Landscaped gardens and walkways",
    image: "/images/render-gardens.jpg",
  },
  {
    category: "Open Spaces",
    caption: "Sports ground and play areas",
    image: "/images/render-sports.jpg",
  },
  {
    category: "Amenities",
    caption: "Retail plaza and common areas",
    image: "/images/amenities.png",
    representative: true,
  },
  {
    category: "Exterior Views",
    caption: "Approach from Kalyan-Shil Road",
    image: "/images/render-exterior.jpg",
  },
];

/* -------------------------------------------------------------------------- */
/*  Budget bands (shared by the site-visit and contact forms)                   */
/* -------------------------------------------------------------------------- */

export const budgetOptions = [
  "Under ₹40 Lakhs",
  "₹40 – ₹50 Lakhs",
  "₹50 – ₹60 Lakhs",
  "₹60 Lakhs and above",
];

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                        */
/* -------------------------------------------------------------------------- */

export const faqs = [
  {
    question: "What configurations are available?",
    answer:
      "Crown Dombivli Manpada offers premium 1 BHK and 2 BHK homes. The 1 BHK has a carpet area of 322 sq. ft. and the 2 BHK has a carpet area of 487 sq. ft. Request the price sheet for the full unit-wise breakdown.",
  },
  {
    question: "What is the starting price?",
    answer:
      "1 BHK homes start at ₹39.99 Lakhs + taxes and 2 BHK homes start at ₹59.99 Lakhs + taxes. Taxes, government charges, registration charges and other applicable costs are extra.",
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
