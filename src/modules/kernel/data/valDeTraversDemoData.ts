import type { 
  BrandDNAReport, 
  Territory 
} from '@/modules/shared/types';

export const valDeTraversTerritory: Territory = {
  id: 'val-de-travers-001',
  name: 'Val-de-Travers',
  slug: 'val-de-travers',
  description: 'Région mythique du Jura neuchâtelois, berceau de l\'absinthe et paradis des amoureux de la nature.',
  region: 'Neuchâtel',
  country: 'Suisse',
  status: 'active',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-12-01')
};

export const valDeTraversBrandDNA: BrandDNAReport = {
  id: 'dna-vdt-001',
  territoryId: 'val-de-travers-001',
  generatedAt: new Date('2024-12-01'),
  
  summary: {
    headline: "L'authenticité jurassienne entre tradition et nature sauvage",
    description: "Le Val-de-Travers se distingue par une identité forte ancrée dans son patrimoine naturel exceptionnel et sa culture artisanale unique. L'analyse révèle une perception dominante d'authenticité, de calme et de découverte, avec l'absinthe comme marqueur culturel distinctif.",
    keyInsights: [
      "L'absinthe reste le symbole identitaire n°1 (mentionnée dans 34% des contenus)",
      "Les Gorges de l'Areuse génèrent 45% de l'engagement visuel",
      "Fort sentiment de découverte et d'aventure douce",
      "Communauté locale très engagée et protectrice de l'identité",
      "Saisonnalité marquée : pic d'intérêt de mai à octobre"
    ],
    sentimentScore: 0.78,
    engagementRate: 4.2,
    totalPosts: 2847,
    totalImages: 1923,
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-11-30')
    }
  },

  visualIdentity: {
    dominantColors: {
      primary: [
        { h: 142, s: 45, l: 35, hex: '#3D7A4A', frequency: 0.28 },
        { h: 200, s: 55, l: 45, hex: '#3A7CA5', frequency: 0.22 },
        { h: 35, s: 60, l: 50, hex: '#CC8833', frequency: 0.18 }
      ],
      secondary: [
        { h: 30, s: 25, l: 85, hex: '#E8DED4', frequency: 0.15 },
        { h: 210, s: 15, l: 75, hex: '#B8C4D0', frequency: 0.12 }
      ],
      accent: [
        { h: 150, s: 70, l: 40, hex: '#1FA463', frequency: 0.05 }
      ]
    },
    sceneCategories: [
      { 
        name: 'Paysages naturels', 
        confidence: 0.92, 
        count: 845,
        examples: ['gorges-areuse-1.jpg', 'foret-automne.jpg', 'prairie-fleurs.jpg']
      },
      { 
        name: 'Architecture rurale', 
        confidence: 0.85, 
        count: 423,
        examples: ['ferme-traditionnelle.jpg', 'village-motiers.jpg']
      },
      { 
        name: 'Gastronomie locale', 
        confidence: 0.88, 
        count: 312,
        examples: ['absinthe-ritual.jpg', 'fromage-local.jpg']
      },
      { 
        name: 'Activités outdoor', 
        confidence: 0.82, 
        count: 287,
        examples: ['randonnee-creux.jpg', 'velo-montagne.jpg']
      },
      { 
        name: 'Patrimoine industriel', 
        confidence: 0.78, 
        count: 156,
        examples: ['distillerie-absinthe.jpg', 'mines-asphalte.jpg']
      }
    ],
    visualThemes: [
      { 
        name: 'Nature préservée', 
        description: 'Forêts denses, rivières cristallines, biodiversité',
        weight: 0.35,
        keywords: ['forêt', 'rivière', 'nature', 'sauvage', 'vert']
      },
      { 
        name: 'Terroir authentique', 
        description: 'Productions locales, savoir-faire artisanal',
        weight: 0.25,
        keywords: ['absinthe', 'artisan', 'tradition', 'local', 'terroir']
      },
      { 
        name: 'Aventure douce', 
        description: 'Randonnées, découvertes, exploration accessible',
        weight: 0.22,
        keywords: ['randonnée', 'découverte', 'sentier', 'exploration']
      },
      { 
        name: 'Patrimoine vivant', 
        description: 'Histoire locale, culture préservée',
        weight: 0.18,
        keywords: ['histoire', 'patrimoine', 'musée', 'tradition']
      }
    ],
    moodBoard: [
      { imageUrl: '/placeholder.svg', caption: 'Gorges de l\'Areuse au petit matin', category: 'nature', score: 0.95 },
      { imageUrl: '/placeholder.svg', caption: 'Rituel de l\'absinthe', category: 'gastronomie', score: 0.92 },
      { imageUrl: '/placeholder.svg', caption: 'Creux-du-Van panoramique', category: 'nature', score: 0.90 },
      { imageUrl: '/placeholder.svg', caption: 'Village de Môtiers', category: 'architecture', score: 0.88 },
      { imageUrl: '/placeholder.svg', caption: 'Sentier des gorges', category: 'outdoor', score: 0.87 },
      { imageUrl: '/placeholder.svg', caption: 'Distillerie traditionnelle', category: 'patrimoine', score: 0.85 }
    ]
  },

  semanticProfile: {
    topics: [
      { name: 'Nature & Paysages', weight: 0.32, relatedTerms: ['gorges', 'forêt', 'creux-du-van', 'areuse', 'panorama'], sentiment: 0.85 },
      { name: 'Absinthe & Terroir', weight: 0.24, relatedTerms: ['fée verte', 'distillerie', 'tradition', 'artisanal', 'dégustation'], sentiment: 0.82 },
      { name: 'Randonnée & Outdoor', weight: 0.18, relatedTerms: ['sentier', 'balade', 'marche', 'vtt', 'escalade'], sentiment: 0.88 },
      { name: 'Patrimoine & Culture', weight: 0.15, relatedTerms: ['histoire', 'musée', 'mines', 'rousseau', 'architecture'], sentiment: 0.75 },
      { name: 'Gastronomie locale', weight: 0.11, relatedTerms: ['fromage', 'saucisse', 'restaurant', 'produits locaux', 'ferme'], sentiment: 0.80 }
    ],
    sentimentDistribution: {
      positive: 0.68,
      neutral: 0.25,
      negative: 0.07
    },
    emotionalTones: [
      { emotion: 'Émerveillement', intensity: 0.42, examples: ['Vue à couper le souffle', 'Magique', 'Incroyable'] },
      { emotion: 'Sérénité', intensity: 0.28, examples: ['Paisible', 'Ressourçant', 'Calme absolu'] },
      { emotion: 'Nostalgie', intensity: 0.18, examples: ['Retour aux sources', 'Comme autrefois', 'Traditions'] },
      { emotion: 'Curiosité', intensity: 0.12, examples: ['À découvrir', 'Surprenant', 'Méconnu'] }
    ],
    keyPhrases: [
      { phrase: 'Creux-du-Van', frequency: 423, context: 'destination phare' },
      { phrase: 'Fée verte', frequency: 312, context: 'absinthe traditionnelle' },
      { phrase: 'Gorges de l\'Areuse', frequency: 287, context: 'randonnée populaire' },
      { phrase: 'nature préservée', frequency: 198, context: 'argument différenciateur' },
      { phrase: 'authenticité', frequency: 167, context: 'valeur perçue' }
    ],
    narrativeThemes: [
      { theme: 'La découverte d\'un joyau caché', description: 'Récit de surprise et de révélation d\'un lieu méconnu', prevalence: 0.35 },
      { theme: 'Le retour aux sources', description: 'Reconnexion avec la nature et les traditions', prevalence: 0.28 },
      { theme: 'L\'aventure accessible', description: 'Expériences outdoor pour tous les niveaux', prevalence: 0.22 },
      { theme: 'La transmission du savoir-faire', description: 'Préservation des traditions locales', prevalence: 0.15 }
    ]
  },

  audienceMatrix: {
    tribes: [
      {
        id: 'tribe-nature-lovers',
        name: 'Les Contemplatifs Verts',
        description: 'Amoureux de la nature recherchant calme et ressourcement en pleine nature',
        size: 12400,
        percentage: 0.35,
        characteristics: ['Sensibilité écologique', 'Recherche de calme', 'Photographie nature', 'Slow tourisme'],
        preferredContent: ['Paysages panoramiques', 'Faune et flore', 'Conseils photo', 'Spots secrets'],
        engagementPattern: {
          peakHours: [7, 8, 18, 19, 20],
          preferredFormats: ['Photos haute résolution', 'Vidéos contemplatives', 'Stories'],
          interactionTypes: [
            { type: 'like', percentage: 0.65 },
            { type: 'save', percentage: 0.22 },
            { type: 'comment', percentage: 0.13 }
          ]
        },
        color: '#3D7A4A'
      },
      {
        id: 'tribe-adventurers',
        name: 'Les Explorateurs Actifs',
        description: 'Sportifs et aventuriers cherchant des défis outdoor accessibles',
        size: 8900,
        percentage: 0.25,
        characteristics: ['Pratique sportive régulière', 'Recherche de nouveaux spots', 'Communauté active', 'Partage d\'expériences'],
        preferredContent: ['Itinéraires détaillés', 'Niveau de difficulté', 'Conseils pratiques', 'Challenges'],
        engagementPattern: {
          peakHours: [6, 7, 12, 17, 18],
          preferredFormats: ['Reels dynamiques', 'Cartes GPS', 'Guides pratiques'],
          interactionTypes: [
            { type: 'like', percentage: 0.45 },
            { type: 'share', percentage: 0.30 },
            { type: 'comment', percentage: 0.25 }
          ]
        },
        color: '#3A7CA5'
      },
      {
        id: 'tribe-culture-seekers',
        name: 'Les Curieux Culturels',
        description: 'Passionnés d\'histoire et de patrimoine local',
        size: 7100,
        percentage: 0.20,
        characteristics: ['Intérêt historique', 'Tourisme culturel', 'Gastronomie locale', 'Artisanat'],
        preferredContent: ['Histoires locales', 'Portraits d\'artisans', 'Visites guidées', 'Traditions'],
        engagementPattern: {
          peakHours: [9, 10, 14, 15, 20, 21],
          preferredFormats: ['Articles longs', 'Documentaires', 'Interviews'],
          interactionTypes: [
            { type: 'like', percentage: 0.50 },
            { type: 'comment', percentage: 0.30 },
            { type: 'share', percentage: 0.20 }
          ]
        },
        color: '#CC8833'
      },
      {
        id: 'tribe-locals',
        name: 'Les Ambassadeurs Locaux',
        description: 'Habitants et habitués défendant l\'identité du territoire',
        size: 4200,
        percentage: 0.12,
        characteristics: ['Attachement territorial', 'Connaissance approfondie', 'Réseau local', 'Fierté régionale'],
        preferredContent: ['Actualités locales', 'Événements', 'Reconnaissance du patrimoine', 'Débats'],
        engagementPattern: {
          peakHours: [7, 12, 13, 18, 19, 21],
          preferredFormats: ['Posts communautaires', 'Événements', 'Discussions'],
          interactionTypes: [
            { type: 'comment', percentage: 0.45 },
            { type: 'share', percentage: 0.35 },
            { type: 'like', percentage: 0.20 }
          ]
        },
        color: '#1FA463'
      },
      {
        id: 'tribe-foodies',
        name: 'Les Épicuriens Terroir',
        description: 'Gastronomes en quête d\'expériences culinaires authentiques',
        size: 2800,
        percentage: 0.08,
        characteristics: ['Passion gastronomique', 'Produits locaux', 'Expériences sensorielles', 'Partage culinaire'],
        preferredContent: ['Recettes traditionnelles', 'Adresses secrètes', 'Producteurs locaux', 'Dégustations'],
        engagementPattern: {
          peakHours: [11, 12, 18, 19, 20],
          preferredFormats: ['Photos culinaires', 'Vidéos de préparation', 'Reviews'],
          interactionTypes: [
            { type: 'save', percentage: 0.40 },
            { type: 'like', percentage: 0.35 },
            { type: 'comment', percentage: 0.25 }
          ]
        },
        color: '#8B4513'
      }
    ],
    overlapMatrix: [
      [1.0, 0.35, 0.25, 0.20, 0.15],
      [0.35, 1.0, 0.20, 0.30, 0.10],
      [0.25, 0.20, 1.0, 0.45, 0.40],
      [0.20, 0.30, 0.45, 1.0, 0.35],
      [0.15, 0.10, 0.40, 0.35, 1.0]
    ],
    totalReach: 35400
  },

  recommendations: [
    {
      id: 'rec-001',
      category: 'content',
      priority: 'high',
      title: 'Capitaliser sur le Creux-du-Van',
      description: 'Le Creux-du-Van génère le plus d\'engagement mais reste sous-exploité en termes de storytelling.',
      actionItems: [
        'Créer une série de contenus "Les secrets du Creux-du-Van"',
        'Développer un guide des meilleurs points de vue par saison',
        'Collaborer avec des photographes nature pour du contenu premium'
      ],
      expectedImpact: 'Augmentation de 25% de l\'engagement sur les contenus nature'
    },
    {
      id: 'rec-002',
      category: 'visual',
      priority: 'high',
      title: 'Adopter la palette identitaire',
      description: 'Les couleurs naturelles (verts, bleus, ocres) résonnent fortement avec l\'audience.',
      actionItems: [
        'Définir une charte visuelle basée sur la palette extraite',
        'Appliquer des filtres cohérents sur tous les visuels',
        'Créer des templates aux couleurs du territoire'
      ],
      expectedImpact: 'Cohérence visuelle améliorée et reconnaissance de marque +30%'
    },
    {
      id: 'rec-003',
      category: 'audience',
      priority: 'medium',
      title: 'Activer les Ambassadeurs Locaux',
      description: 'Cette tribu a le plus fort taux de partage mais représente seulement 12% de l\'audience.',
      actionItems: [
        'Créer un programme d\'ambassadeurs officiels',
        'Organiser des événements exclusifs pour les locaux',
        'Valoriser leur contenu sur les canaux officiels'
      ],
      expectedImpact: 'Amplification organique de 40% via le bouche-à-oreille'
    },
    {
      id: 'rec-004',
      category: 'timing',
      priority: 'medium',
      title: 'Optimiser le calendrier de publication',
      description: 'Les pics d\'engagement varient fortement selon les tribus ciblées.',
      actionItems: [
        'Publier le contenu nature entre 7h-8h et 18h-20h',
        'Réserver les contenus culturels pour 14h-15h et 20h-21h',
        'Planifier les contenus gastronomiques autour des repas'
      ],
      expectedImpact: 'Taux d\'engagement +18% grâce à un timing optimisé'
    },
    {
      id: 'rec-005',
      category: 'engagement',
      priority: 'low',
      title: 'Développer le contenu interactif',
      description: 'Le taux de commentaires reste faible (13% en moyenne).',
      actionItems: [
        'Poser des questions ouvertes dans les légendes',
        'Créer des sondages et quiz sur les stories',
        'Lancer des challenges photo mensuels'
      ],
      expectedImpact: 'Taux de commentaires doublé en 3 mois'
    }
  ]
};
