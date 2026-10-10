/* Topics: the desks of the paper. Each topic has a colour, an icon, its own sections, and a keyword
   test used to keep only on-topic stories from mixed feeds ("topic stories only" on a source).
   Section keys are unique across all topics. Order here = default order in the general paper. */
(function (root) {
  const AG = (root.AG = root.AG || {});

  const T = [
    {
      id: 'world', name: 'World', icon: '🌍', color: '#4f8cff', tag: 'What happened out there',
      keep: /\b(war|election|president|prime minister|minister|government|parliament|un|united nations|summit|treaty|border|refugee\w*|protest\w*|ceasefire|sanction\w*|diplomat\w*|military|troops|country|countries|international|global)\b/i,
      sections: [
        { key: 'w-conflict', name: 'Conflict & Security', re: /\b(war|attack\w*|strike\w*|missile\w*|troops|military|ceasefire|hostage\w*|killed|bomb\w*|drone\w*|army|militant\w*|terror\w*)\b/i },
        { key: 'w-politics', name: 'Politics & Diplomacy', re: /\b(election\w*|vote\w*|president|prime minister|parliament|minister|government|summit|talks|diplomat\w*|sanction\w*|treaty|party|opposition|coalition)\b/i },
        { key: 'w-people', name: 'People & Planet', re: /\b(climate|flood\w*|earthquake|wildfire\w*|storm\w*|hurricane|cyclone|drought|refugee\w*|migrant\w*|famine|aid|humanitarian|heatwave)\b/i }
      ],
      other: { key: 'w-more', name: 'Around the World' }
    },
    {
      id: 'india', name: 'India', icon: '🇮🇳', color: '#ff8a3d', tag: 'News from home',
      keep: /\b(india\w*|delhi|mumbai|bengaluru|bangalore|chennai|kolkata|hyderabad|gujarat|maharashtra|kerala|punjab|bihar|uttar pradesh|lok sabha|rajya sabha|modi|bjp|congress|supreme court|rbi|isro)\b/i,
      sections: [
        { key: 'in-politics', name: 'Politics', re: /\b(bjp|congress|aap|tmc|election\w*|poll\w*|lok sabha|rajya sabha|assembly|minister|chief minister|cm|modi|rahul gandhi|party|opposition|parliament)\b/i },
        { key: 'in-law', name: 'Courts & Governance', re: /\b(supreme court|high court|court|judge|verdict|bail|cbi|ed|police|arrest\w*|case|fir|law|bill|policy|scheme)\b/i },
        { key: 'in-states', name: 'States & Cities', re: /\b(delhi|mumbai|bengaluru|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|vadodara|surat|gujarat|maharashtra|karnataka|kerala|tamil nadu|bihar|punjab|rajasthan|uttar pradesh|west bengal|assam|odisha|telangana|city|district|village)\b/i }
      ],
      other: { key: 'in-more', name: 'Across India' }
    },
    {
      id: 'finance', name: 'Finance', icon: '📈', color: '#22c55e', tag: 'Money, markets and the economy',
      keep: /\b(market\w*|stock\w*|shares?|sensex|nifty|nasdaq|dow|s&p|invest\w*|econom\w*|inflation|gdp|bank\w*|rbi|fed|interest rates?|rupee|dollar|earnings|profit\w*|revenue|ipo|crypto\w*|bitcoin|fund\w*|tax\w*|budget|business|compan(y|ies)|startup\w*)\b/i,
      sections: [
        { key: 'f-markets', name: 'Markets', re: /\b(sensex|nifty|stocks?|shares?|markets?|nasdaq|dow|s&p|index|indices|rally|sell-?off|bonds?|yields?|commodit\w*|gold|crude|oil prices?|rupee|forex|ipo)\b/i },
        { key: 'f-economy', name: 'Economy & Policy', re: /\b(econom\w*|gdp|inflation|cpi|rbi|fed|federal reserve|central bank|interest rates?|repo rate|fiscal|budget|tax\w*|gst|trade|tariff\w*|exports?|imports?|jobs|unemployment|growth)\b/i },
        { key: 'f-companies', name: 'Companies', re: /\b(compan(y|ies)|ceo|earnings|quarter\w*|profit\w*|revenue|results|merger|acquisition|deal|startup\w*|layoffs?|funding|valuation|tata|reliance|adani|infosys|apple|microsoft|google|amazon|tesla|nvidia)\b/i },
        { key: 'f-money', name: 'Your Money', re: /\b(personal finance|mutual funds?|sip|savings?|loan\w*|emi|credit cards?|insurance|pension|retirement|epf|ppf|fixed deposit|fd|home loan|income tax|itr)\b/i },
        { key: 'f-crypto', name: 'Crypto', re: /\b(crypto\w*|bitcoin|ethereum|blockchain|token\w*|stablecoin\w*|binance|coinbase)\b/i }
      ],
      other: { key: 'f-more', name: 'Business' }
    },
    {
      id: 'tech', name: 'Technology', icon: '💻', color: '#a78bfa', tag: 'Gadgets, AI and the internet',
      keep: /\b(tech\w*|ai|artificial intelligence|software|app|apps|smartphone\w*|iphone|android|google|apple|microsoft|meta|openai|anthropic|chip\w*|semiconductor\w*|startup\w*|cyber\w*|hack\w*|internet|online|gadget\w*|laptop\w*|robot\w*|computer\w*)\b/i,
      sections: [
        { key: 't-ai', name: 'AI', re: /\b(ai|artificial intelligence|machine learning|chatbot\w*|llm\w*|openai|anthropic|claude|chatgpt|gemini|copilot|deepmind|model\w*|neural)\b/i },
        { key: 't-gadgets', name: 'Gadgets', re: /\b(iphone|android|smartphone\w*|phone\w*|laptop\w*|tablet\w*|watch|earbuds|headphones|camera\w*|pixel|galaxy|oneplus|xiaomi|review|gadget\w*|console\w*|playstation|xbox|nintendo)\b/i },
        { key: 't-security', name: 'Security & Privacy', re: /\b(cyber\w*|hack\w*|breach\w*|ransomware|malware|privacy|password\w*|scam\w*|fraud|vulnerab\w*|surveillance|data leak)\b/i },
        { key: 't-biz', name: 'Big Tech & Startups', re: /\b(google|apple|microsoft|meta|amazon|nvidia|samsung|tesla|x|twitter|startup\w*|funding|ipo|antitrust|regulat\w*|chip\w*|semiconductor\w*)\b/i }
      ],
      other: { key: 't-more', name: 'Tech' }
    },
    {
      id: 'science', name: 'Science', icon: '🔬', color: '#14b8a6', tag: 'Discoveries and ideas',
      keep: /\b(scien\w*|study|studies|research\w*|discover\w*|physic\w*|chemi\w*|biolog\w*|species|fossil\w*|evolution|genes?|genetic\w*|climate|ocean\w*|brain|cells?|quantum|experiment\w*)\b/i,
      sections: [
        { key: 's-life', name: 'Life & Nature', re: /\b(species|animal\w*|bird\w*|fish|insect\w*|plant\w*|fossil\w*|dinosaur\w*|evolution|ecolog\w*|genes?|genetic\w*|dna|cells?|bacteria|virus\w*|brain|biolog\w*)\b/i },
        { key: 's-earth', name: 'Earth & Climate', re: /\b(climate|warming|carbon|emission\w*|ocean\w*|ice|glacier\w*|volcano\w*|earthquake\w*|weather|atmospher\w*|pollution|forest\w*|biodiversity)\b/i },
        { key: 's-physics', name: 'Physics & Matter', re: /\b(physic\w*|quantum|particle\w*|atom\w*|laser\w*|material\w*|chemi\w*|energy|fusion|superconduct\w*|math\w*|computer science)\b/i }
      ],
      other: { key: 's-more', name: 'Science' }
    },
    {
      id: 'sports', name: 'Sports', icon: '🏏', color: '#ef4444', tag: 'Scores, stars and stories',
      keep: /\b(match\w*|cricket|football|soccer|tennis|f1|formula 1|grand prix|olympic\w*|hockey|kabaddi|badminton|chess|golf|nba|ipl|world cup|league|tournament|champion\w*|coach|captain|wicket\w*|goal\w*|score\w*|innings|final)\b/i,
      sections: [
        { key: 'sp-cricket', name: 'Cricket', re: /\b(cricket|test match|odi|t20\w*|ipl|wicket\w*|innings|bcci|icc|ashes|batt(er|ing|ed)|bowl(er|ing|ed)|century|kohli|rohit|bumrah)\b/i },
        { key: 'sp-football', name: 'Football', re: /\b(football|soccer|premier league|la liga|serie a|bundesliga|champions league|uefa|fifa|goal\w*|striker|midfielder|isl|manchester|liverpool|arsenal|chelsea|barcelona|real madrid)\b/i },
        { key: 'sp-tennis', name: 'Tennis', re: /\b(tennis|wimbledon|us open|french open|roland garros|australian open|atp|wta|djokovic|alcaraz|sinner|swiatek|sabalenka)\b/i },
        { key: 'sp-motor', name: 'Motorsport', re: /\b(f1|formula (1|one)|grand prix|gp|motogp|verstappen|hamilton|leclerc|norris|piastri|ferrari|mclaren|red bull|mercedes|qualifying|pole|podium)\b/i }
      ],
      other: { key: 'sp-more', name: 'More Sport' }
    },
    {
      id: 'astronomy', name: 'Astronomy', icon: '🔭', color: '#e9b65a', tag: 'The sky and beyond',
      keep: /\b(astronom\w*|astrophys\w*|space|spacecraft|cosmo\w*|galax\w*|star|stars|stellar|nebula\w*|planet\w*|exoplanet\w*|moon|lunar|sun|solar|mars|martian|jupiter|saturn|venus|mercury|uranus|neptune|pluto|asteroid\w*|comet\w*|meteor\w*|eclipse|black holes?|supernova\w*|telescope\w*|hubble|webb|jwst|orbit\w*|rocket|launch\w*|astronaut\w*|iss|artemis|rover|lander|probe|universe|dark matter|dark energy|quasar\w*|pulsar\w*|aurora\w*|constellation\w*|night sky|skywatch\w*|apod|cosmic|interstellar|kuiper|europa|titan|enceladus|milky way|isro|nasa|esa)\b/i,
      sections: [
        { key: 'sky', name: 'Skywatching', re: /\b(night sky|skywatch\w*|how to see|see the|visible|meteor shower|eclipse|full moon|harvest moon|new moon|moon phase|conjunction|occultation|aurora\w*|constellation\w*|this week'?s sky|observ(e|ing) (the|tonight)|binoculars|stargaz\w*|planets? (at|in the) (dawn|dusk|evening|morning))\b/i },
        { key: 'solar', name: 'Solar System', re: /\b(mars|martian|jupiter|saturn|venus|mercury|uranus|neptune|pluto|asteroid\w*|comet\w*|sun|solar|sunspot\w*|lunar|moon|europa|titan|enceladus|io|ganymede|kuiper|jezero|meteorite\w*)\b/i },
        { key: 'missions', name: 'Missions & Spaceflight', re: /\b(launch\w*|rocket\w*|spacecraft|mission|astronaut\w*|iss|space station|artemis|spacex|starship|orbiter|rover|lander|probe|satellite\w*|flyby|gravity assist|crew|isro|gaganyaan)\b/i },
        { key: 'deep', name: 'Deep Space', re: /\b(galax\w*|black holes?|nebula\w*|stars?|stellar|supernova\w*|exoplanet\w*|cosmolog\w*|dark matter|dark energy|quasar\w*|pulsar\w*|universe|cluster\w*|webb|hubble|big bang|gravitational waves?|milky way|brown dwarf\w*)\b/i }
      ],
      other: { key: 'frontiers', name: 'Frontiers' }
    },
    {
      id: 'health', name: 'Health', icon: '🩺', color: '#f472b6', tag: 'Body and mind',
      keep: /\b(health\w*|medic\w*|doctor\w*|hospital\w*|disease\w*|patients?|vaccin\w*|cancer|diabetes|heart|mental health|diet|nutrition|fitness|exercise|sleep|drug\w*|therap\w*|virus\w*|covid|who)\b/i,
      sections: [
        { key: 'h-research', name: 'Medical Research', re: /\b(study|trial\w*|research\w*|cancer|alzheimer\w*|dementia|diabetes|heart|vaccin\w*|drug\w*|gene therapy|treatment\w*|fda)\b/i },
        { key: 'h-living', name: 'Living Well', re: /\b(diet|nutrition|food|exercise|fitness|sleep|weight|stress|mental health|anxiety|wellbeing|well-being|habit\w*|walking|running)\b/i }
      ],
      other: { key: 'h-more', name: 'Health' }
    },
    {
      id: 'culture', name: 'Entertainment', icon: '🎬', color: '#f59e0b', tag: 'Films, music and more',
      keep: /\b(film\w*|movie\w*|cinema|bollywood|hollywood|series|show\w*|netflix|actor\w*|actress\w*|music|album\w*|song\w*|singer|concert\w*|book\w*|novel\w*|art\w*|festival|award\w*|oscar\w*|box office|trailer)\b/i,
      sections: [
        { key: 'c-film', name: 'Film & TV', re: /\b(film\w*|movie\w*|cinema|bollywood|hollywood|series|season|netflix|prime video|disney|actor\w*|actress\w*|director|box office|trailer|ott)\b/i },
        { key: 'c-music', name: 'Music', re: /\b(music|album\w*|song\w*|singer|concert\w*|tour|band|rapper|grammy\w*)\b/i }
      ],
      other: { key: 'c-more', name: 'Culture' }
    }
  ];

  AG.TOPICS = T;
  AG.topicById = Object.fromEntries(T.map(t => [t.id, t]));
  const SEC = {};
  for (const t of T) { for (const s of t.sections) SEC[s.key] = { ...s, topic: t.id }; SEC[t.other.key] = { ...t.other, topic: t.id }; }
  AG.SECTIONS = SEC;
  AG.sectionName = (key) => (SEC[key] ? SEC[key].name : '');
  AG.sectionTopic = (key) => (SEC[key] ? SEC[key].topic : '');
  /** Section order: by topic, then the topic's own order. */
  AG.SECTION_ORDER = T.flatMap(t => [...t.sections.map(s => ({ key: s.key, name: s.name, topic: t.id })), { ...t.other, topic: t.id }]);

  /** Which section of a topic a story belongs to. Headline first, then headline + excerpt. */
  AG.classifyIn = function (topicId, title, excerpt) {
    const t = AG.topicById[topicId] || AG.topicById.world, both = `${title} ${excerpt}`;
    for (const s of t.sections) if (s.re.test(title)) return s.key;
    for (const s of t.sections) if (s.re.test(both)) return s.key;
    return t.other.key;
  };
  /** Edition kind: 'all' or the chosen topics joined. Each kind keeps its own "since last edition". */
  AG.editionKind = (topics) => (!topics || !topics.length || topics.includes('all') ? 'all' : [...topics].sort().join('+'));
  AG.kindLabel = (kind) => (kind === 'all' ? 'Everything' : kind.split('+').map(id => AG.topicById[id]?.name || id).join(' + '));
})(typeof window !== 'undefined' ? window : globalThis);
