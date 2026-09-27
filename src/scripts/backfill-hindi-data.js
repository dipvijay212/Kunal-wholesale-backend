const { sequelize, Category, Product } = require('../models');

const FABRIC_MAP = {
  'banarasi silk': { en: 'Banarasi Silk', hi: 'बनारसी सिल्क' },
  'kanjivaram silk': { en: 'Kanjivaram Silk', hi: 'कांचीपुरम सिल्क' },
  'tussar silk': { en: 'Tussar Silk', hi: 'टसर सिल्क' },
  'tissue silk': { en: 'Tissue Silk', hi: 'टिश्यू सिल्क' },
  'chanderi cotton silk': { en: 'Chanderi Cotton Silk', hi: 'चंदेरी कॉटन सिल्क' },
  'georgette': { en: 'Georgette', hi: 'जॉर्जेट' },
  'chiffon': { en: 'Chiffon', hi: 'शिफॉन' },
  'organza': { en: 'Organza', hi: 'ऑर्गेंजा' },
  'cotton': { en: 'Cotton', hi: 'कॉटन' },
  'linen': { en: 'Linen', hi: 'लिनन' },
  'crepe': { en: 'Crepe', hi: 'क्रेप' },
};

const COLOR_MAP = {
  red: { en: 'Red', hi: 'लाल' },
  crimson: { en: 'Crimson Red', hi: 'लाल' },
  yellow: { en: 'Yellow', hi: 'पीला' },
  pink: { en: 'Pink', hi: 'गुलाबी' },
  green: { en: 'Green', hi: 'हरा' },
  wine: { en: 'Wine', hi: 'वाइन' },
  maroon: { en: 'Maroon', hi: 'मैरून' },
  blue: { en: 'Blue', hi: 'नीला' },
  navy: { en: 'Navy Blue', hi: 'नेवी ब्लू' },
  gold: { en: 'Gold', hi: 'गोल्डन' },
  ivory: { en: 'Ivory', hi: 'आइवरी' },
  mustard: { en: 'Mustard', hi: 'मस्टर्ड' },
  rust: { en: 'Rust', hi: 'रस्ट' },
  lavender: { en: 'Lavender', hi: 'लैवेंडर' },
  silver: { en: 'Silver', hi: 'सिल्वर' },
  black: { en: 'Black', hi: 'काला' },
};

const CATEGORY_MAP = {
  'banarasi-silk': {
    nameEn: 'Banarasi Silk',
    nameHi: 'बनारसी सिल्क',
    descEn: 'Luxurious handcrafted Banarasi silk sarees with rich zari work.',
    descHi: 'बनारस के कारीगरों द्वारा तैयार की गई रिच जरी वर्क वाली बनारसी सिल्क साड़ियां।',
  },
  'banarasi-sarees': {
    nameEn: 'Banarasi Silk',
    nameHi: 'बनारसी सिल्क',
    descEn: 'Luxurious handcrafted Banarasi silk sarees with rich zari work.',
    descHi: 'बनारस के कारीगरों द्वारा तैयार की गई रिच जरी वर्क वाली बनारसी सिल्क साड़ियां।',
  },
  'kanjivaram-silk': {
    nameEn: 'Kanjivaram Silk',
    nameHi: 'कांचीपुरम सिल्क',
    descEn: 'Traditional pure mulberry silk sarees from Kanchipuram.',
    descHi: 'कांचीपुरम की पारंपरिक शुद्ध मलबरी सिल्क साड़ियां।',
  },
  'silk-sarees': {
    nameEn: 'Kanjivaram Silk',
    nameHi: 'कांचीपुरम सिल्क',
    descEn: 'Traditional pure mulberry silk sarees from Kanchipuram.',
    descHi: 'कांचीपुरम की पारंपरिक शुद्ध मलबरी सिल्क साड़ियां।',
  },
  'georgette': {
    nameEn: 'Georgette',
    nameHi: 'जॉर्जेट',
    descEn: 'Lightweight flowy georgette sarees with intricate embroidery.',
    descHi: 'हल्की और आरामदायक जॉर्जेट साड़ियां खूबसूरत एम्ब्रॉयडरी वर्क के साथ।',
  },
  'georgette-sarees': {
    nameEn: 'Georgette',
    nameHi: 'जॉर्जेट',
    descEn: 'Lightweight flowy georgette sarees with intricate embroidery.',
    descHi: 'हल्की और आरामदायक जॉर्जेट साड़ियां खूबसूरत एम्ब्रॉयडरी वर्क के साथ।',
  },
  'organza': {
    nameEn: 'Organza',
    nameHi: 'ऑर्गेंजा',
    descEn: 'Sheer elegant organza sarees with floral prints and embroidery.',
    descHi: 'प्रीमियम और खूबसूरत ऑर्गेंजा साड़ियां शानदार फ्लोरल प्रिंट्स के साथ।',
  },
  'organza-sarees': {
    nameEn: 'Organza',
    nameHi: 'ऑर्गेंजा',
    descEn: 'Sheer elegant organza sarees with floral prints and embroidery.',
    descHi: 'प्रीमियम और खूबसूरत ऑर्गेंजा साड़ियां शानदार फ्लोरल प्रिंट्स के साथ।',
  },
  'cotton-sarees': {
    nameEn: 'Cotton Handloom',
    nameHi: 'कॉटन हैंडलूम',
    descEn: 'Pure handloom cotton and Chanderi sarees for daily and office wear.',
    descHi: 'प्योर हैंडलूम कॉटन और चंदेरी साड़ियों का खूबसूरत कलेक्शन।',
  },
  'printed-sarees': {
    nameEn: 'Printed Sarees',
    nameHi: 'प्रिंटेड साड़ियां',
    descEn: 'Modern and digital printed sarees for daily and boutique collections.',
    descHi: 'डेली वियर और बुटीक के लिए आधुनिक डिजिटल प्रिंटेड साड़ियां।',
  },
  'embroidered-sarees': {
    nameEn: 'Embroidered Sarees',
    nameHi: 'एम्ब्रॉयडरी साड़ियां',
    descEn: 'Fine hand and machine embroidered sarees with designer borders.',
    descHi: 'शानदार डिजाइनर बॉर्डर और बारीक एम्ब्रॉयडरी वाली खूबसूरत साड़ियां।',
  },
  'party-wear': {
    nameEn: 'Party Wear',
    nameHi: 'पार्टी वियर साड़ियां',
    descEn: 'Glamorous party wear sarees crafted with modern aesthetics.',
    descHi: 'पार्टी और खास शाम के कार्यक्रमों के लिए ग्लैमरस पार्टी वियर साड़ियां।',
  },
  'bridal-sarees': {
    nameEn: 'Bridal & Wedding',
    nameHi: 'ब्राइडल व शादी साड़ियां',
    descEn: 'Grand bridal and wedding sarees with intricate zari and stone work.',
    descHi: 'शादी और खास मौकों के लिए हैवी जरी और स्टोन वर्क वाली ब्राइडल साड़ियां।',
  },
  'chiffon-sarees': {
    nameEn: 'Chiffon',
    nameHi: 'शिफॉन',
    descEn: 'Featherlight soft chiffon sarees with delicate borders.',
    descHi: 'मुलायम और हल्की शिफॉन साड़ियां खूबसूरत बॉर्डर के साथ।',
  },
};

const PRODUCT_MAP = {
  'KS-SLK-1001': {
    nameEn: 'Aaranya Temple Border Kanjivaram Saree',
    nameHi: 'आरण्या टेम्पल बॉर्डर कांचीपुरम साड़ी',
    descEn: 'Pure Kanchipuram mulberry silk featuring traditional temple gopuram borders and rich gold zari pallu.',
    descHi: 'पारंपरिक मंदिर गोपुरम बॉर्डर और रिच गोल्ड जरी पल्लू के साथ तैयार की गई शुद्ध कांचीपुरम मलबरी सिल्क साड़ी।',
    shortEn: 'Pure Kanchipuram silk with temple border.',
    shortHi: 'टेम्पल बॉर्डर वाली शुद्ध कांचीपुरम सिल्क साड़ी।',
    fabricEn: 'Kanjivaram Silk',
    fabricHi: 'कांचीपुरम सिल्क',
    colorEn: 'Wine',
    colorHi: 'वाइन',
  },
  'KS-SLK-1002': {
    nameEn: 'Meenakshi Korvai Silk Saree',
    nameHi: 'मीनाक्षी कोरवई सिल्क साड़ी',
    descEn: 'Authentic Korvai interlocking weave with contrast dual-tone borders and intricate peacock motifs.',
    descHi: 'कंट्रास्ट डुअल-टोन बॉर्डर और बारीक मोर के डिजाइन वाली शुद्ध कोरवई बुनाई सिल्क साड़ी।',
    shortEn: 'Authentic Korvai weave silk saree.',
    shortHi: 'कंट्रास्ट बॉर्डर वाली प्रामाणिक कोरवई सिल्क साड़ी।',
    fabricEn: 'Kanjivaram Silk',
    fabricHi: 'कांचीपुरम सिल्क',
    colorEn: 'Sindoor Red',
    colorHi: 'लाल',
  },
  'KS-SLK-1003': {
    nameEn: 'Sanjh Tussar Handloom Saree',
    nameHi: 'सांझ टसर हैंडलूम साड़ी',
    descEn: 'Organic wild tussar silk handloom with tribal geometric border and breathable natural texture.',
    descHi: 'ट्राइबल ज्योमैट्रिक बॉर्डर और नेचुरल टेक्सचर वाली ऑर्गेनिक वाइल्ड टसर सिल्क हैंडलूम साड़ी।',
    shortEn: 'Handloom tussar silk with natural sheen.',
    shortHi: 'प्राकृतिक चमक वाली शुद्ध टसर सिल्क हैंडलूम साड़ी।',
    fabricEn: 'Tussar Silk',
    fabricHi: 'टसर सिल्क',
    colorEn: 'Antique Ochre',
    colorHi: 'मस्टर्ड',
  },
  'KS-BNS-1004': {
    nameEn: 'Aarna Katan Banarasi Silk Saree',
    nameHi: 'आरना कटान बनारसी सिल्क साड़ी',
    descEn: 'Pure Katan silk woven on traditional handlooms with all-over floral jaal and antique gold kadwa zari.',
    descHi: 'ट्रेडिशनल हैंडलूम पर बुनी गई फ्लोरल जाल और एंटीक गोल्ड कड़वा जरी वाली शुद्ध कटान बनारसी साड़ी।',
    shortEn: 'Pure Katan silk with gold jaal.',
    shortHi: 'गोल्डन जाल वर्क वाली शुद्ध कटान बनारसी साड़ी।',
    fabricEn: 'Banarasi Silk',
    fabricHi: 'बनारसी सिल्क',
    colorEn: 'Emerald Green',
    colorHi: 'हरा',
  },
  'KS-BNS-1005': {
    nameEn: 'Meher Tanchoi Banarasi Saree',
    nameHi: 'मेहर तनछोई बनारसी साड़ी',
    descEn: 'Satin-finish Tanchoi weave with delicate paisley and floral motifs in tonal silk threads.',
    descHi: 'सैटिन-फिनिश तनछोई बुनाई और बारीक पैस्ले डिजाइन वाली खूबसूरत बनारसी साड़ी।',
    shortEn: 'Tanchoi weave satin silk saree.',
    shortHi: 'सॉफ्ट सैटिन फिनिश वाली तनछोई बनारसी साड़ी।',
    fabricEn: 'Banarasi Silk',
    fabricHi: 'बनारसी सिल्क',
    colorEn: 'Deep Wine',
    colorHi: 'वाइन',
  },
  'KS-BNS-1006': {
    nameEn: 'Noor Silver Zari Banarasi Saree',
    nameHi: 'नूर सिल्वर जरी बनारसी साड़ी',
    descEn: 'Contemporary silver zari brocade on midnight navy silk with floral border and statement pallu.',
    descHi: 'नेवी ब्लू सिल्क पर मॉडर्न सिल्वर जरी ब्रोकेड और फ्लोरल बॉर्डर वाली शानदार साड़ी।',
    shortEn: 'Silver zari weave Banarasi silk.',
    shortHi: 'सिल्वर जरी वर्क वाली रिच बनारसी साड़ी।',
    fabricEn: 'Banarasi Silk',
    fabricHi: 'बनारसी सिल्क',
    colorEn: 'Midnight Navy',
    colorHi: 'नेवी ब्लू',
  },
  'KS-GRG-1007': {
    nameEn: 'Rhea Sequin Georgette Saree',
    nameHi: 'रिया सीक्विन जॉर्जेट साड़ी',
    descEn: 'Lightweight viscose georgette embellished with tone-on-tone micro sequins and scalloped border.',
    descHi: 'माइक्रो सीक्विन वर्क और स्कैलप्ड बॉर्डर वाली हल्की विस्कोस जॉर्जेट पार्टी वियर साड़ी।',
    shortEn: 'Micro sequin embroidered georgette.',
    shortHi: 'सीक्विन वर्क वाली हल्की जॉर्जेट साड़ी।',
    fabricEn: 'Georgette',
    fabricHi: 'जॉर्जेट',
    colorEn: 'Rani Pink',
    colorHi: 'गुलाबी',
  },
  'KS-GRG-1008': {
    nameEn: 'Kaia Mirror Work Georgette Saree',
    nameHi: 'काइया मिरर वर्क जॉर्जेट साड़ी',
    descEn: 'Real foil mirror work on flowy georgette with Resham thread embroidery for festive occasions.',
    descHi: 'त्योहार और संगीत फंक्शन के लिए रेशम कढ़ाई और असली फॉइल मिरर वर्क वाली फ्लोई जॉर्जेट साड़ी।',
    shortEn: 'Foil mirror work on georgette.',
    shortHi: 'मिरर वर्क और रेशम कढ़ाई वाली जॉर्जेट साड़ी।',
    fabricEn: 'Georgette',
    fabricHi: 'जॉर्जेट',
    colorEn: 'Mustard',
    colorHi: 'मस्टर्ड',
  },
  'KS-CTN-1009': {
    nameEn: 'Mira Handloom Chanderi Cotton Silk Saree',
    nameHi: 'मीरा हैंडलूम चंदेरी कॉटन सिल्क साड़ी',
    descEn: 'Handwoven Chanderi cotton silk with delicate gold zari bootis and tissue border.',
    descHi: 'बारीक जरी बूटी और टिशू बॉर्डर वाली हाथ से बुनी चंदेरी कॉटन सिल्क साड़ी।',
    shortEn: 'Handwoven Chanderi with zari booti.',
    shortHi: 'जरी बूटी वर्क वाली हाथ से बुनी चंदेरी कॉटन सिल्क साड़ी।',
    fabricEn: 'Chanderi Cotton Silk',
    fabricHi: 'चंदेरी कॉटन सिल्क',
    colorEn: 'Champagne Gold',
    colorHi: 'गोल्डन',
  },
  'KS-ORG-1010': {
    nameEn: 'Anandi Pastel Organza Embroidered Saree',
    nameHi: 'आनंदी पेस्टल ऑर्गेंजा एम्ब्रॉयडरी साड़ी',
    descEn: 'Crisp sheer organza with delicate floral thread embroidery and hand-finished cutwork pallu.',
    descHi: 'फ्लोरल थ्रेड एम्ब्रॉयडरी और हैंड-फिनिश्ड कटवर्क पल्लू वाली सॉफ्ट ऑर्गेंजा साड़ी।',
    shortEn: 'Cutwork embroidered pastel organza.',
    shortHi: 'कटवर्क एम्ब्रॉयडरी वाली पेस्टल ऑर्गेंजा साड़ी।',
    fabricEn: 'Organza',
    fabricHi: 'ऑर्गेंजा',
    colorEn: 'Blush',
    colorHi: 'गुलाबी',
  },
  'KS-BRL-1011': {
    nameEn: 'Riddhi Heirloom Bridal Zardozi Silk Saree',
    nameHi: 'ऋद्धि ब्राइडल जरदोजी सिल्क साड़ी',
    descEn: 'Masterpiece bridal saree in crimson silk with heavy handcrafted zardozi, dabka, and pearl work.',
    descHi: 'शादी के लिए स्पेशल हैवी जरदोजी, दबका और पर्ल वर्क वाली मास्टरपीस ब्राइडल सिल्क साड़ी।',
    shortEn: 'Heavy handcrafted bridal zardozi saree.',
    shortHi: 'हैवी जरदोजी वर्क वाली ब्राइडल सिल्क साड़ी।',
    fabricEn: 'Banarasi Silk',
    fabricHi: 'बनारसी सिल्क',
    colorEn: 'Sindoor Red',
    colorHi: 'लाल',
  },
  'KS-TSS-1012': {
    nameEn: 'Tara Pure Tissue Silk Metallic Saree',
    nameHi: 'तारा प्योर टिश्यू सिल्क मेटैलिक साड़ी',
    descEn: 'Luminous pure metallic tissue silk with subtle self-weaving and understated modern luxury.',
    descHi: 'शानदार मेटैलिक चमक और सेल्फ-वीविंग वाली प्योर टिश्यू सिल्क साड़ी।',
    shortEn: 'Luminous metallic pure tissue silk.',
    shortHi: 'शानदार चमक वाली प्योर टिश्यू सिल्क साड़ी।',
    fabricEn: 'Tissue Silk',
    fabricHi: 'टिश्यू सिल्क',
    colorEn: 'Gold',
    colorHi: 'गोल्डन',
  },
};

async function backfill() {
  try {
    await sequelize.authenticate();
    console.log('[Backfill] Database connection established.');

    // 1. Update Categories
    const categories = await Category.findAll();
    for (const cat of categories) {
      const mapping = CATEGORY_MAP[cat.slug] || {
        nameEn: cat.name,
        nameHi: cat.name,
        descEn: cat.description,
        descHi: cat.description,
      };

      cat.nameEn = mapping.nameEn || cat.name;
      cat.nameHi = mapping.nameHi || cat.name;
      cat.descriptionEn = mapping.descEn || cat.description;
      cat.descriptionHi = mapping.descHi || cat.description;
      await cat.save();
      console.log(`[Backfill] Updated Category: ${cat.slug} -> name_hi: ${cat.nameHi}`);
    }

    // 2. Update Products
    const products = await Product.findAll();
    for (const p of products) {
      const mapping = PRODUCT_MAP[p.productCode];

      if (mapping) {
        p.nameEn = mapping.nameEn;
        p.nameHi = mapping.nameHi;
        p.descriptionEn = mapping.descEn;
        p.descriptionHi = mapping.descHi;
        p.shortDescriptionEn = mapping.shortEn;
        p.shortDescriptionHi = mapping.shortHi;
        p.fabricEn = mapping.fabricEn;
        p.fabricHi = mapping.fabricHi;
        p.colorEn = mapping.colorEn;
        p.colorHi = mapping.colorHi;
      } else {
        // Derive intelligently from name & fabric
        const fabricLower = (p.fabric || '').toLowerCase();
        const fabricMatch = FABRIC_MAP[fabricLower];
        const colorLower = (p.color || '').toLowerCase();
        const colorMatch = COLOR_MAP[colorLower];

        p.nameEn = p.nameEn || p.name;
        p.nameHi = p.nameHi || p.name;
        p.descriptionEn = p.descriptionEn || p.description;
        p.descriptionHi = p.descriptionHi || p.description;
        p.shortDescriptionEn = p.shortDescriptionEn || p.shortDescription;
        p.shortDescriptionHi = p.shortDescriptionHi || p.shortDescription;
        p.fabricEn = p.fabricEn || (fabricMatch ? fabricMatch.en : p.fabric);
        p.fabricHi = p.fabricHi || (fabricMatch ? fabricMatch.hi : p.fabric);
        p.colorEn = p.colorEn || (colorMatch ? colorMatch.en : p.color);
        p.colorHi = p.colorHi || (colorMatch ? colorMatch.hi : p.color);
      }

      await p.save();
      console.log(`[Backfill] Updated Product ${p.productCode} -> name_hi: ${p.nameHi}, fabric_hi: ${p.fabricHi}`);
    }

    console.log('[Backfill] All categories and products successfully updated with Hindi data.');
    process.exit(0);
  } catch (err) {
    console.error('[Backfill Error]', err);
    process.exit(1);
  }
}

backfill();
