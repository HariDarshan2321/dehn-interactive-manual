export const translations = {
  en: {
    // Navigation
    back: 'Back',
    installationGuide: 'Installation Guide',

    // Home page
    welcome: 'Welcome!',
    welcomeDescription: 'Scan your DEHN product QR code to get started with AI-powered installation guidance',
    scanQRCode: 'Scan QR Code',
    scanDescription: 'Point your camera at the QR code on your DEHN product',
    searchProducts: 'Search Products',
    searchDescription: 'Browse our product catalog or search by model number',
    cantScan: "Can't scan?",
    searchManually: 'Search for your product manually',
    tryDemo: '🚀 Try Demo',
    demoDescription: 'Test with our sample QR code',
    openDemoQR: 'Open Demo QR',

    // Features
    aiAssistant: 'AI Assistant',
    aiAssistantDesc: 'Get instant answers',
    videoGuides: 'Video Guides',
    videoGuidesDesc: 'Step-by-step videos',
    photoVerify: 'Photo Verify',
    photoVerifyDesc: 'Smart detection',
    multiLanguage: 'Multi-language',
    multiLanguageDesc: '6 languages',

    // Language selection
    chooseLanguage: 'Choose Language',
    selectLanguage: 'Select your preferred language for installation guidance',
    continueWith: 'Continue with',
    languageChangeNote: 'You can change the language at any time during your session',
    instructionsInLanguage: 'Instructions will be provided in this language',
    preview: 'Preview',
    playing: 'Playing...',

    // Product page
    completeInstallation: 'Complete Installation from 0',
    partialHelp: 'I just need partial help',
    quickLinks: 'Quick Links',
    youtube: '📺 YouTube',
    pdfManual: '📄 PDF Manual',
    estimatedTime: 'Estimated Time',
    difficulty: 'Difficulty',
    warningText: 'Installation by qualified electrician only. Follow national safety regulations (IEC 60364-5-53).',

    // Installation steps
    stepOf: 'Step {current} of {total}',
    progress: 'Progress',
    complete: '% Complete',
    detailedInstructions: 'Detailed Instructions',
    toolsRequired: 'Tools Required',
    safetyNote: 'Safety Note',
    takePhotoVerify: '📷 Take Photo to Verify',
    watchVideo: '▶️ Watch Video',
    askAI: '🤖 Ask AI',
    markComplete: 'Mark Complete & Continue →',
    allSteps: 'All Steps',

    // AI Assistant
    aiAssistantTitle: 'AI Assistant',
    aiGreeting: '👋 Hi! I\'m your AI assistant for the {productName}. How can I help you with the installation?',
    whatTools: '"What tools do I need?"',
    safetyPrecautions: '"Safety precautions?"',
    wireSpecs: '"Wire specifications?"',
    troubleshooting: '"Troubleshooting help"',
    askAnything: 'Ask me anything about this installation...',
    send: 'Send',

    // Camera
    analyzingInstallation: 'Analyzing installation...',
    aiVerifying: 'AI is verifying your installation step',
    installationVerified: '✅ Installation verified! Great work!',

    // Steps content
    steps: {
      safetyPreparation: {
        title: 'Safety Preparation',
        description: 'Turn off main power and prepare workspace',
        details: 'Switch off the main circuit breaker. Ensure the work area is clean and well-lit. Gather all necessary tools.',
        safetyNotes: 'Always verify power is off before starting work',
        tools: ['Screwdriver', 'Multimeter', 'Safety gloves']
      },
      mountDINRail: {
        title: 'Mount on DIN Rail',
        description: 'Install the device on standard DIN rail',
        details: 'Position the device on the DIN rail. Press down until you hear a click. Ensure it\'s securely mounted.',
        safetyNotes: 'Ensure DIN rail is properly grounded',
        tools: ['DIN rail', 'Mounting clips']
      },
      wireConnections: {
        title: 'Wire Connections',
        description: 'Connect L1, L2, L3, N/PE conductors',
        details: 'Connect conductors according to wiring diagram. Use 7Nm torque. Wire cross-sections: min 16mm², max 35mm².',
        safetyNotes: 'Double-check all connections before energizing',
        tools: ['Wire strippers', 'Torque screwdriver', 'Multimeter']
      },
      finalTesting: {
        title: 'Final Testing',
        description: 'Test installation and verify operation',
        details: 'Check all connections. Verify grounding. Test with multimeter. Restore power and check LED indicators.',
        safetyNotes: 'Verify all safety systems before final energization',
        tools: ['Multimeter', 'LED tester']
      }
    }
  },

  de: {
    // Navigation
    back: 'Zurück',
    installationGuide: 'Installationsanleitung',

    // Home page
    welcome: 'Willkommen!',
    welcomeDescription: 'Scannen Sie den QR-Code Ihres DEHN-Produkts, um mit der KI-gestützten Installationsanleitung zu beginnen',
    scanQRCode: 'QR-Code scannen',
    scanDescription: 'Richten Sie Ihre Kamera auf den QR-Code Ihres DEHN-Produkts',
    searchProducts: 'Produkte suchen',
    searchDescription: 'Durchsuchen Sie unseren Produktkatalog oder suchen Sie nach Modellnummer',
    cantScan: 'Können Sie nicht scannen?',
    searchManually: 'Suchen Sie Ihr Produkt manuell',
    tryDemo: '🚀 Demo testen',
    demoDescription: 'Testen Sie mit unserem Beispiel-QR-Code',
    openDemoQR: 'Demo-QR öffnen',

    // Features
    aiAssistant: 'KI-Assistent',
    aiAssistantDesc: 'Sofortige Antworten',
    videoGuides: 'Video-Anleitungen',
    videoGuidesDesc: 'Schritt-für-Schritt Videos',
    photoVerify: 'Foto-Verifikation',
    photoVerifyDesc: 'Intelligente Erkennung',
    multiLanguage: 'Mehrsprachig',
    multiLanguageDesc: '6 Sprachen',

    // Language selection
    chooseLanguage: 'Sprache wählen',
    selectLanguage: 'Wählen Sie Ihre bevorzugte Sprache für die Installationsanleitung',
    continueWith: 'Weiter mit',
    languageChangeNote: 'Sie können die Sprache jederzeit während Ihrer Sitzung ändern',
    instructionsInLanguage: 'Anweisungen werden in dieser Sprache bereitgestellt',
    preview: 'Vorschau',
    playing: 'Wird abgespielt...',

    // Product page
    completeInstallation: 'Vollständige Installation von 0',
    partialHelp: 'Ich brauche nur teilweise Hilfe',
    quickLinks: 'Schnellzugriff',
    youtube: '📺 YouTube',
    pdfManual: '📄 PDF-Handbuch',
    estimatedTime: 'Geschätzte Zeit',
    difficulty: 'Schwierigkeit',
    warningText: 'Installation nur durch qualifizierte Elektriker. Befolgen Sie nationale Sicherheitsvorschriften (IEC 60364-5-53).',

    // Installation steps
    stepOf: 'Schritt {current} von {total}',
    progress: 'Fortschritt',
    complete: '% Abgeschlossen',
    detailedInstructions: 'Detaillierte Anweisungen',
    toolsRequired: 'Benötigte Werkzeuge',
    safetyNote: 'Sicherheitshinweis',
    takePhotoVerify: '📷 Foto zur Verifikation',
    watchVideo: '▶️ Video ansehen',
    askAI: '🤖 KI fragen',
    markComplete: 'Als abgeschlossen markieren & Weiter →',
    allSteps: 'Alle Schritte',

    // AI Assistant
    aiAssistantTitle: 'KI-Assistent',
    aiGreeting: '👋 Hallo! Ich bin Ihr KI-Assistent für das {productName}. Wie kann ich Ihnen bei der Installation helfen?',
    whatTools: '"Welche Werkzeuge brauche ich?"',
    safetyPrecautions: '"Sicherheitsvorkehrungen?"',
    wireSpecs: '"Drahtspezifikationen?"',
    troubleshooting: '"Fehlerbehebung"',
    askAnything: 'Fragen Sie mich alles über diese Installation...',
    send: 'Senden',

    // Camera
    analyzingInstallation: 'Installation wird analysiert...',
    aiVerifying: 'KI überprüft Ihren Installationsschritt',
    installationVerified: '✅ Installation verifiziert! Großartige Arbeit!',

    // Steps content
    steps: {
      safetyPreparation: {
        title: 'Sicherheitsvorbereitung',
        description: 'Hauptstrom ausschalten und Arbeitsplatz vorbereiten',
        details: 'Schalten Sie den Hauptschutzschalter aus. Stellen Sie sicher, dass der Arbeitsbereich sauber und gut beleuchtet ist. Sammeln Sie alle notwendigen Werkzeuge.',
        safetyNotes: 'Überprüfen Sie immer, dass der Strom ausgeschaltet ist, bevor Sie mit der Arbeit beginnen',
        tools: ['Schraubendreher', 'Multimeter', 'Sicherheitshandschuhe']
      },
      mountDINRail: {
        title: 'Auf DIN-Schiene montieren',
        description: 'Gerät auf Standard-DIN-Schiene installieren',
        details: 'Positionieren Sie das Gerät auf der DIN-Schiene. Drücken Sie nach unten, bis Sie ein Klicken hören. Stellen Sie sicher, dass es sicher montiert ist.',
        safetyNotes: 'Stellen Sie sicher, dass die DIN-Schiene ordnungsgemäß geerdet ist',
        tools: ['DIN-Schiene', 'Befestigungsclips']
      },
      wireConnections: {
        title: 'Drahtverbindungen',
        description: 'L1, L2, L3, N/PE Leiter anschließen',
        details: 'Verbinden Sie die Leiter gemäß Schaltplan. Verwenden Sie 7Nm Drehmoment. Drahtquerschnitte: min 16mm², max 35mm².',
        safetyNotes: 'Überprüfen Sie alle Verbindungen doppelt vor der Energieversorgung',
        tools: ['Abisolierzange', 'Drehmomentschraubendreher', 'Multimeter']
      },
      finalTesting: {
        title: 'Abschließende Prüfung',
        description: 'Installation testen und Betrieb überprüfen',
        details: 'Überprüfen Sie alle Verbindungen. Überprüfen Sie die Erdung. Testen Sie mit Multimeter. Stellen Sie die Stromversorgung wieder her und überprüfen Sie die LED-Anzeigen.',
        safetyNotes: 'Überprüfen Sie alle Sicherheitssysteme vor der endgültigen Energieversorgung',
        tools: ['Multimeter', 'LED-Tester']
      }
    }
  },

  fr: {
    // Navigation
    back: 'Retour',
    installationGuide: 'Guide d\'installation',

    // Home page
    welcome: 'Bienvenue!',
    welcomeDescription: 'Scannez le code QR de votre produit DEHN pour commencer avec les instructions d\'installation alimentées par l\'IA',
    scanQRCode: 'Scanner le code QR',
    scanDescription: 'Pointez votre caméra vers le code QR de votre produit DEHN',
    searchProducts: 'Rechercher des produits',
    searchDescription: 'Parcourez notre catalogue de produits ou recherchez par numéro de modèle',
    cantScan: 'Impossible de scanner?',
    searchManually: 'Recherchez votre produit manuellement',
    tryDemo: '🚀 Essayer la démo',
    demoDescription: 'Testez avec notre exemple de code QR',
    openDemoQR: 'Ouvrir le QR de démo',

    // Features
    aiAssistant: 'Assistant IA',
    aiAssistantDesc: 'Réponses instantanées',
    videoGuides: 'Guides vidéo',
    videoGuidesDesc: 'Vidéos étape par étape',
    photoVerify: 'Vérification photo',
    photoVerifyDesc: 'Détection intelligente',
    multiLanguage: 'Multilingue',
    multiLanguageDesc: '6 langues',

    // Language selection
    chooseLanguage: 'Choisir la langue',
    selectLanguage: 'Sélectionnez votre langue préférée pour les instructions d\'installation',
    continueWith: 'Continuer avec',
    languageChangeNote: 'Vous pouvez changer de langue à tout moment pendant votre session',
    instructionsInLanguage: 'Les instructions seront fournies dans cette langue',
    preview: 'Aperçu',
    playing: 'En cours de lecture...',

    // Product page
    completeInstallation: 'Installation complète depuis 0',
    partialHelp: 'J\'ai juste besoin d\'aide partielle',
    quickLinks: 'Liens rapides',
    youtube: '📺 YouTube',
    pdfManual: '📄 Manuel PDF',
    estimatedTime: 'Temps estimé',
    difficulty: 'Difficulté',
    warningText: 'Installation par un électricien qualifié uniquement. Suivez les réglementations de sécurité nationales (IEC 60364-5-53).',

    // Installation steps
    stepOf: 'Étape {current} sur {total}',
    progress: 'Progrès',
    complete: '% Terminé',
    detailedInstructions: 'Instructions détaillées',
    toolsRequired: 'Outils requis',
    safetyNote: 'Note de sécurité',
    takePhotoVerify: '📷 Prendre une photo pour vérifier',
    watchVideo: '▶️ Regarder la vidéo',
    askAI: '🤖 Demander à l\'IA',
    markComplete: 'Marquer comme terminé & Continuer →',
    allSteps: 'Toutes les étapes',

    // AI Assistant
    aiAssistantTitle: 'Assistant IA',
    aiGreeting: '👋 Salut! Je suis votre assistant IA pour le {productName}. Comment puis-je vous aider avec l\'installation?',
    whatTools: '"Quels outils ai-je besoin?"',
    safetyPrecautions: '"Précautions de sécurité?"',
    wireSpecs: '"Spécifications des fils?"',
    troubleshooting: '"Aide au dépannage"',
    askAnything: 'Demandez-moi tout sur cette installation...',
    send: 'Envoyer',

    // Camera
    analyzingInstallation: 'Analyse de l\'installation...',
    aiVerifying: 'L\'IA vérifie votre étape d\'installation',
    installationVerified: '✅ Installation vérifiée! Excellent travail!',

    // Steps content
    steps: {
      safetyPreparation: {
        title: 'Préparation de sécurité',
        description: 'Couper l\'alimentation principale et préparer l\'espace de travail',
        details: 'Éteignez le disjoncteur principal. Assurez-vous que la zone de travail est propre et bien éclairée. Rassemblez tous les outils nécessaires.',
        safetyNotes: 'Vérifiez toujours que l\'alimentation est coupée avant de commencer le travail',
        tools: ['Tournevis', 'Multimètre', 'Gants de sécurité']
      },
      mountDINRail: {
        title: 'Monter sur rail DIN',
        description: 'Installer l\'appareil sur rail DIN standard',
        details: 'Positionnez l\'appareil sur le rail DIN. Appuyez jusqu\'à entendre un clic. Assurez-vous qu\'il est solidement monté.',
        safetyNotes: 'Assurez-vous que le rail DIN est correctement mis à la terre',
        tools: ['Rail DIN', 'Clips de montage']
      },
      wireConnections: {
        title: 'Connexions de fils',
        description: 'Connecter les conducteurs L1, L2, L3, N/PE',
        details: 'Connectez les conducteurs selon le schéma de câblage. Utilisez un couple de 7Nm. Sections de fil: min 16mm², max 35mm².',
        safetyNotes: 'Vérifiez toutes les connexions avant la mise sous tension',
        tools: ['Dénudeurs de fils', 'Tournevis à couple', 'Multimètre']
      },
      finalTesting: {
        title: 'Test final',
        description: 'Tester l\'installation et vérifier le fonctionnement',
        details: 'Vérifiez toutes les connexions. Vérifiez la mise à la terre. Testez avec un multimètre. Rétablissez l\'alimentation et vérifiez les indicateurs LED.',
        safetyNotes: 'Vérifiez tous les systèmes de sécurité avant la mise sous tension finale',
        tools: ['Multimètre', 'Testeur LED']
      }
    }
  }
};

export function useTranslation(language: string = 'en') {
  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = translations[language as keyof typeof translations] || translations.en;

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      return key; // Return key if translation not found
    }

    if (params) {
      return value.replace(/\{(\w+)\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  return { t };
}
