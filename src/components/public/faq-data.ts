import type { FaqItem } from "@/components/public/schema";

/**
 * Local-intent FAQ used on the home page and mirrored into FAQPage JSON-LD.
 * Answers must contain business facts from config only — and no prices.
 */
export const HOME_FAQS: FaqItem[] = [
  {
    question: "How long does a phone screen repair take?",
    answer:
      "Most phone screen and battery repairs are done on the spot, often within 30 to 60 minutes — many customers drop their phone off and pick it up after a lap of Orion Springfield Central. Bigger jobs like tablets, laptops or water damage can take longer; we'll give you a realistic time frame before we start.",
  },
  {
    question: "Do you use genuine parts?",
    answer:
      "We offer a choice of part quality on most repairs: genuine service-pack parts, OEM grade, premium aftermarket and standard aftermarket. We'll explain the difference for your exact device so you can pick the option that suits your budget — every tier comes with its own parts warranty.",
  },
  {
    question: "What warranty do I get on repairs?",
    answer:
      "Warranty depends on the part quality you choose: up to 12 months on genuine service-pack parts, up to 6 months on OEM-grade and premium aftermarket parts, and 90 days on standard aftermarket parts. The warranty covers part defects and our workmanship. See our warranty page for full details.",
  },
  {
    question: "Where are you located in Orion Springfield Central?",
    answer:
      "You'll find us at Kiosk K1 inside Orion Springfield Central, 1 Main St, Springfield Central QLD 4300 — near Foot Locker, inside the Big W mall. We're open seven days, following centre trading hours.",
  },
  {
    question: "Do I need an appointment?",
    answer:
      "No appointment needed — walk-ins are welcome seven days a week. If you'd like to know the likely cost first, request a free quote online and we'll email you an estimate before you come in.",
  },
  {
    question: "Can you fix water damaged phones?",
    answer:
      "Yes. Water damage is unpredictable, so we start with a free assessment: we open the device, clean the boards and connectors, and test what has survived. We'll tell you honestly whether a repair is worthwhile and can often recover your photos and data even when the phone itself isn't worth saving. Don't charge a wet phone — bring it in as soon as you can.",
  },
  {
    question: "Do you repair drones?",
    answer:
      "Yes — we're one of the few repairers in the Greater Springfield area working on drones. We repair DJI and other popular models: gimbals, cameras, motors, arms, shells and battery or firmware faults. Bring it in for a crash-damage assessment.",
  },
  {
    question: "How do online quotes work?",
    answer:
      "Tell us your device, model and the problem in our quote form and we'll email you an estimate based on the most affordable suitable part option for your repair. The final price is confirmed with a free in-store inspection of the device — no obligation, and you choose your part quality before any work starts.",
  },
  {
    question: "Do you repair smart watches and car keys?",
    answer:
      "Yes. We replace screens and batteries on Apple Watch, Samsung Galaxy Watch and other smart watches, and we repair car key shells, buttons and batteries. Most of these are quick on-the-spot jobs.",
  },
  {
    question: "Can you recover data from a broken phone?",
    answer:
      "In many cases, yes. If the phone powers on but the screen is smashed, we can usually repair the display or extract your photos, contacts and messages. Even some liquid-damaged and dead devices can be temporarily revived for data recovery — bring it in and we'll assess it for free.",
  },
];
