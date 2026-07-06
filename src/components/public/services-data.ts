import {
  Smartphone,
  Tablet,
  Laptop,
  Rocket,
  Watch,
  Cpu,
  type LucideIcon,
} from "lucide-react";

/**
 * Shared service catalogue for the home grid and the /services page.
 * Descriptions only — NEVER add prices here (product rule #1).
 */

export interface ServiceDef {
  anchor: string;
  name: string;
  icon: LucideIcon;
  short: string;
  features: string[];
  /** Longer copy + common repairs for the /services page. */
  detail: string;
  commonRepairs: string[];
}

export const SERVICES: ServiceDef[] = [
  {
    anchor: "phone-repair",
    name: "Phone Repair",
    icon: Smartphone,
    short:
      "Cracked screens, dead batteries and everything in between — for iPhone, Samsung, Google Pixel, OPPO and more.",
    features: [
      "Screen and back glass replacement",
      "Battery replacement with health check",
      "Charging port and speaker repairs",
      "Camera and Face ID / fingerprint repairs",
      "Water damage assessment and treatment",
    ],
    detail:
      "Phones are what we do most, every single day. Most screen and battery repairs are completed on the spot while you shop at Orion Springfield Central — many in under an hour. We repair all major brands including Apple iPhone, Samsung Galaxy, Google Pixel, OPPO, Motorola, Huawei and Xiaomi, and you choose the part quality that suits your budget, each tier backed by its own warranty.",
    commonRepairs: [
      "Screen replacement (LCD / OLED)",
      "Back glass replacement",
      "Battery replacement",
      "Charging port repair",
      "Camera (front and rear) replacement",
      "Speaker, microphone and earpiece repairs",
      "Power and volume button repairs",
      "Water damage cleaning and assessment",
      "Data recovery from damaged phones",
    ],
  },
  {
    anchor: "tablet-repair",
    name: "Tablet & iPad Repair",
    icon: Tablet,
    short:
      "Glass, LCD, battery and charging repairs for iPad, Samsung Galaxy Tab and other tablets.",
    features: [
      "iPad glass and LCD replacement",
      "Samsung Galaxy Tab screen repairs",
      "Battery and charging port replacement",
      "Button and camera repairs",
      "Software and recovery-mode fixes",
    ],
    detail:
      "Tablets need careful hands — large bonded glass panels crack easily and adhesives must be re-seated properly so the screen stays sealed. We repair all iPad generations (including iPad Pro, Air and mini), Samsung Galaxy Tab and most Android tablets. Kids' tablets with smashed digitisers are a daily job for us.",
    commonRepairs: [
      "Touch glass (digitiser) replacement",
      "LCD / display replacement",
      "Battery replacement",
      "Charging port repair",
      "Home button and Touch ID repairs",
      "Stuck-on-logo and software recovery",
    ],
  },
  {
    anchor: "computer-repair",
    name: "Computer & Laptop Repair",
    icon: Laptop,
    short:
      "Laptop screens, batteries, keyboards, upgrades and tune-ups for Windows PCs and Mac.",
    features: [
      "Laptop screen and hinge replacement",
      "Battery, keyboard and trackpad repairs",
      "SSD upgrades and RAM upgrades",
      "Virus removal and system tune-ups",
      "Data backup, transfer and recovery",
    ],
    detail:
      "From a smashed laptop screen to a computer that just feels old and slow, we can help. We service Windows laptops and desktops as well as MacBook and iMac. An SSD upgrade is often the single best value repair you can do to an ageing machine — ask us for an honest assessment before you replace it.",
    commonRepairs: [
      "Laptop screen replacement",
      "Battery and charger (DC jack) repairs",
      "Keyboard and trackpad replacement",
      "Hard drive to SSD upgrades",
      "Operating system reinstall and tune-up",
      "Virus and malware removal",
      "Data backup and recovery",
    ],
  },
  {
    anchor: "drone-repair",
    name: "Drone Repair",
    icon: Rocket,
    short:
      "Crash damage, gimbal and camera repairs for DJI and other popular drones.",
    features: [
      "Crash damage assessment",
      "Gimbal and camera repairs",
      "Motor and propeller replacement",
      "Battery and charging diagnostics",
      "Firmware and calibration issues",
    ],
    detail:
      "One of the few repairers in the Greater Springfield area that works on drones. Whether your DJI clipped a tree or won't calibrate after a hard landing, bring it in for an assessment. We repair gimbals, cameras, motors, arms and shells, and diagnose battery and firmware faults.",
    commonRepairs: [
      "Gimbal replacement and calibration",
      "Camera module replacement",
      "Motor and ESC replacement",
      "Arm, shell and landing gear repairs",
      "Propeller replacement",
      "Battery and charging faults",
    ],
  },
  {
    anchor: "watch-carkey-repair",
    name: "Watch & Car Key Repair",
    icon: Watch,
    short:
      "Smart watch screens and batteries, plus car key shells, buttons and batteries.",
    features: [
      "Apple Watch and Galaxy Watch screens",
      "Smart watch battery replacement",
      "Watch battery replacement",
      "Car key shell and button repairs",
      "Car key battery replacement",
    ],
    detail:
      "Cracked Apple Watch or Galaxy Watch glass, a smart watch that won't hold charge, a car key with a snapped shell or worn-out buttons — small repairs that make a big difference. Most watch and car key jobs are done on the spot while you wait.",
    commonRepairs: [
      "Smart watch screen replacement",
      "Smart watch battery replacement",
      "Classic watch battery replacement",
      "Car key shell replacement",
      "Car key button and battery repairs",
    ],
  },
  {
    anchor: "it-solutions",
    name: "IT Solutions",
    icon: Cpu,
    short:
      "Setup, data transfer, email and network help for homes and small businesses.",
    features: [
      "New device setup and data transfer",
      "Email and account configuration",
      "Home and small business networking",
      "Printer and peripheral setup",
      "Ongoing tech support and advice",
    ],
    detail:
      "Technology should work for you, not against you. We help households and small businesses around Springfield with device setup, data migration, email problems, Wi-Fi and network issues, printers and general tech advice — explained in plain English, without the jargon.",
    commonRepairs: [
      "New phone / computer setup and data transfer",
      "Email and cloud account configuration",
      "Wi-Fi and network troubleshooting",
      "Printer and peripheral setup",
      "Software installation and licensing help",
      "General tech support for small business",
    ],
  },
];
