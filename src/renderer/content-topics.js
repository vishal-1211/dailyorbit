/* Bundled library for every topic beyond astronomy: people for Page 3, did-you-know facts, quiz
   questions and meme cards. Loaded after content.js; tags the astronomy entries and adds the rest.
   Kept to well-established facts. */
(function (root) {
  const AG = (root.AG = root.AG || {});
  const C = AG.Content;
  for (const p of C.PEOPLE) p.topic ||= 'astronomy';
  for (const f of C.FACTS) f.topic ||= 'astronomy';
  for (const q of C.QUIZ) q.topic ||= 'astronomy';

  // [topic, id, name, years, role, born (MM-DD or ''), bio]
  const PEOPLE = [
    ['world', 'mandela', 'Nelson Mandela', '1918–2013', 'Statesman', '07-18', 'Spent 27 years in prison for opposing apartheid, then became South Africa’s first democratically elected president in 1994 and led a peaceful transition.'],
    ['world', 'annan', 'Kofi Annan', '1938–2018', 'Diplomat', '04-08', 'Ghanaian diplomat who served as UN Secretary-General from 1997 to 2006 and shared the 2001 Nobel Peace Prize with the United Nations.'],
    ['world', 'maathai', 'Wangari Maathai', '1940–2011', 'Environmentalist', '04-01', 'Founded Kenya’s Green Belt Movement, which planted tens of millions of trees, and became the first African woman to win the Nobel Peace Prize (2004).'],
    ['world', 'eroosevelt', 'Eleanor Roosevelt', '1884–1962', 'Diplomat & activist', '10-11', 'Chaired the UN commission that drafted the Universal Declaration of Human Rights, adopted in 1948.'],
    ['world', 'hammarskjold', 'Dag Hammarskjöld', '1905–1961', 'Diplomat', '07-29', 'Second UN Secretary-General. Died in a plane crash on a peace mission in Africa and was awarded the Nobel Peace Prize after his death.'],
    ['world', 'malala', 'Malala Yousafzai', 'born 1997', 'Education activist', '07-12', 'Campaigner for girls’ education in Pakistan who survived an attack in 2012 and became the youngest Nobel Peace Prize laureate, at 17.'],
    ['india', 'gandhi', 'Mahatma Gandhi', '1869–1948', 'Leader of the freedom movement', '10-02', 'Led India’s independence movement through non-violent resistance; the Salt March of 1930 became one of its defining moments.'],
    ['india', 'ambedkar', 'B. R. Ambedkar', '1891–1956', 'Jurist & social reformer', '04-14', 'Chaired the drafting committee of India’s Constitution and fought all his life against caste discrimination.'],
    ['india', 'nehru', 'Jawaharlal Nehru', '1889–1964', 'First Prime Minister', '11-14', 'India’s first Prime Minister, from 1947 until 1964. His birthday is celebrated as Children’s Day.'],
    ['india', 'patel', 'Sardar Vallabhbhai Patel', '1875–1950', 'First Deputy Prime Minister', '10-31', 'Brought more than 560 princely states into the Indian Union after independence. The Statue of Unity in Gujarat honours him.'],
    ['india', 'kalam', 'A. P. J. Abdul Kalam', '1931–2015', 'Scientist & President', '10-15', 'Aerospace scientist who led India’s missile programme and served as the 11th President, from 2002 to 2007. Known as the “People’s President”.'],
    ['india', 'naidu', 'Sarojini Naidu', '1879–1949', 'Poet & freedom fighter', '02-13', 'Poet known as the “Nightingale of India”, first woman president of the Indian National Congress and first woman governor of an Indian state.'],
    ['finance', 'keynes', 'John Maynard Keynes', '1883–1946', 'Economist', '06-05', 'Argued that governments should spend to fight recessions, and helped design the post-war system of the IMF and World Bank at Bretton Woods.'],
    ['finance', 'buffett', 'Warren Buffett', 'born 1930', 'Investor', '08-30', 'Built Berkshire Hathaway into one of the world’s largest companies by buying good businesses and holding them for decades. Has pledged most of his fortune to charity.'],
    ['finance', 'graham', 'Benjamin Graham', '1894–1976', 'Investor & teacher', '05-09', 'The father of value investing. His book “The Intelligent Investor” introduced “Mr. Market” and the idea of a margin of safety.'],
    ['finance', 'jrdtata', 'J. R. D. Tata', '1904–1993', 'Industrialist & aviator', '07-29', 'Held India’s first commercial pilot licence, founded the airline that became Air India, and led the Tata group for over 50 years.'],
    ['finance', 'jhunjhunwala', 'Rakesh Jhunjhunwala', '1960–2022', 'Investor', '07-05', 'Started investing in the Indian market with a small sum in 1985 and became one of its best-known investors.'],
    ['finance', 'yunus', 'Muhammad Yunus', 'born 1940', 'Economist', '06-28', 'Founded Grameen Bank in Bangladesh, pioneering small loans for the poor; he and the bank shared the 2006 Nobel Peace Prize.'],
    ['tech', 'turing', 'Alan Turing', '1912–1954', 'Mathematician', '06-23', 'Described a universal computing machine in 1936 and helped break German codes in the Second World War. The Turing test of machine intelligence carries his name.'],
    ['tech', 'lovelace', 'Ada Lovelace', '1815–1852', 'Mathematician', '12-10', 'Wrote what is often called the first computer program, for Charles Babbage’s proposed Analytical Engine, and foresaw machines making music.'],
    ['tech', 'hopper', 'Grace Hopper', '1906–1992', 'Computer scientist', '12-09', 'Built one of the first compilers and helped create COBOL. Popularised the word “debugging” after a moth was found in a computer.'],
    ['tech', 'bernerslee', 'Tim Berners-Lee', 'born 1955', 'Inventor of the Web', '06-08', 'Invented the World Wide Web at CERN in 1989 and gave it away free, without a patent.'],
    ['tech', 'jobs', 'Steve Jobs', '1955–2011', 'Entrepreneur', '02-24', 'Co-founded Apple and led the Macintosh, iPod and iPhone, which changed how people use computers and phones.'],
    ['tech', 'torvalds', 'Linus Torvalds', 'born 1969', 'Software engineer', '12-28', 'Started the Linux kernel as a student in 1991 and later created Git, the tool most programmers use to track their code.'],
    ['science', 'curie', 'Marie Curie', '1867–1934', 'Physicist & chemist', '11-07', 'Discovered polonium and radium, and is the only person to win Nobel Prizes in two different sciences (physics 1903, chemistry 1911).'],
    ['science', 'darwin', 'Charles Darwin', '1809–1882', 'Naturalist', '02-12', 'His 1859 book “On the Origin of Species” set out evolution by natural selection, the foundation of modern biology.'],
    ['science', 'einstein', 'Albert Einstein', '1879–1955', 'Physicist', '03-14', 'Gave us relativity and E = mc². His Nobel Prize, though, was for explaining the photoelectric effect.'],
    ['science', 'raman', 'C. V. Raman', '1888–1970', 'Physicist', '11-07', 'Discovered that light changes colour slightly when scattered by molecules — the Raman effect — and won the 1930 Nobel Prize. India marks National Science Day on 28 February for it.'],
    ['science', 'franklin', 'Rosalind Franklin', '1920–1958', 'Chemist', '07-25', 'Her X-ray image “Photo 51” was key evidence for the double-helix structure of DNA.'],
    ['science', 'jcbose', 'Jagadish Chandra Bose', '1858–1937', 'Physicist & biologist', '11-30', 'A pioneer of radio waves and of plant physiology, who built the crescograph to measure how plants grow.'],
    ['sports', 'tendulkar', 'Sachin Tendulkar', 'born 1973', 'Cricketer', '04-24', 'Scored 100 international centuries and played 200 Test matches, both records, in a career of 24 years.'],
    ['sports', 'pele', 'Pelé', '1940–2022', 'Footballer', '10-23', 'The only player to win three FIFA World Cups (1958, 1962, 1970) for Brazil.'],
    ['sports', 'dhyanchand', 'Major Dhyan Chand', '1905–1979', 'Hockey player', '08-29', 'Won Olympic gold with India in 1928, 1932 and 1936. His birthday is India’s National Sports Day.'],
    ['sports', 'serena', 'Serena Williams', 'born 1981', 'Tennis player', '09-26', 'Won 23 Grand Slam singles titles, the most by any woman in the Open Era.'],
    ['sports', 'bolt', 'Usain Bolt', 'born 1986', 'Sprinter', '08-21', 'Holds the 100 m and 200 m world records, set in 2009, and won eight Olympic gold medals.'],
    ['sports', 'anand', 'Viswanathan Anand', 'born 1969', 'Chess grandmaster', '12-11', 'India’s first grandmaster (1988) and a five-time world chess champion.'],
    ['sports', 'senna', 'Ayrton Senna', '1960–1994', 'Racing driver', '03-21', 'Three-time Formula 1 world champion, famous for his speed in qualifying and in the rain.'],
    ['health', 'nightingale', 'Florence Nightingale', '1820–1910', 'Nurse & statistician', '05-12', 'Founded modern nursing and used early statistical charts to show that hospital hygiene saves lives.'],
    ['health', 'fleming', 'Alexander Fleming', '1881–1955', 'Microbiologist', '08-06', 'Discovered penicillin in 1928 after mould killed bacteria in a dish he had left out.'],
    ['health', 'salk', 'Jonas Salk', '1914–1995', 'Virologist', '10-28', 'Developed the first successful polio vaccine (1955) and chose not to patent it.'],
    ['health', 'jenner', 'Edward Jenner', '1749–1823', 'Physician', '05-17', 'Showed in 1796 that cowpox could protect against smallpox, the start of vaccination.'],
    ['health', 'anandibai', 'Anandibai Joshi', '1865–1887', 'Physician', '03-31', 'One of the first Indian women to earn a medical degree, from a college in Philadelphia in 1886.'],
    ['culture', 'ray', 'Satyajit Ray', '1921–1992', 'Film-maker', '05-02', 'Directed the Apu Trilogy and received an honorary Oscar for lifetime achievement in 1992.'],
    ['culture', 'lata', 'Lata Mangeshkar', '1929–2022', 'Singer', '09-28', 'Sang thousands of songs for Indian films over seven decades and received the Bharat Ratna in 2001.'],
    ['culture', 'rahman', 'A. R. Rahman', 'born 1967', 'Composer', '01-06', 'Won two Academy Awards in 2009 for the music of “Slumdog Millionaire”.'],
    ['culture', 'bachchan', 'Amitabh Bachchan', 'born 1942', 'Actor', '10-11', 'One of Indian cinema’s biggest stars since the 1970s, and long-time host of “Kaun Banega Crorepati”.'],
    ['culture', 'tagore', 'Rabindranath Tagore', '1861–1941', 'Poet & composer', '05-07', 'First non-European to win the Nobel Prize in Literature (1913). Wrote the national anthems of India and Bangladesh.'],
    ['culture', 'chaplin', 'Charlie Chaplin', '1889–1977', 'Actor & film-maker', '04-16', 'Created the Tramp, silent cinema’s best-loved character, and made “Modern Times” and “The Great Dictator”.']
  ];
  for (const [topic, id, name, years, role, born, bio] of PEOPLE) C.PEOPLE.push({ topic, id, name, years, role, born, bio });

  const FACTS = {
    world: [
      'The United Nations has 193 member states. Its Charter was signed in San Francisco in 1945.',
      'More than 7,000 languages are spoken in the world today; about 40% of them are endangered.',
      'Russia stretches across 11 time zones, from the Baltic Sea to the Pacific.',
      'Vatican City is the smallest country in the world, at about half a square kilometre.',
      'About 56% of the world’s people now live in cities, up from about 30% in 1950.'
    ],
    india: [
      'India’s Constitution is the longest written constitution of any country.',
      'Indian Railways is one of the world’s largest employers, with over a million staff.',
      'India has 22 languages listed in the Eighth Schedule of its Constitution.',
      'The 2024 general election had about 970 million eligible voters, the largest election ever held.',
      'Chess grew out of an Indian game called chaturanga, played around the 6th century.'
    ],
    finance: [
      'The Bombay Stock Exchange, founded in 1875, is Asia’s oldest stock exchange.',
      'Compound interest is why money doubles in about 72 ÷ (interest rate) years: at 8%, roughly 9 years.',
      'The Reserve Bank of India was set up in 1935 and nationalised in 1949.',
      'The word “bankrupt” comes from the Italian “banca rotta”, a broken bench.',
      'UPI handles billions of payments in India every month, far more than any other real-time payment system.'
    ],
    tech: [
      'The first computer “bug” was a real moth, found in a Harvard computer in 1947.',
      'The first website went online at CERN in 1991, and you can still visit it.',
      'A modern smartphone has far more computing power than the computers that guided Apollo 11.',
      'The QWERTY keyboard layout dates from typewriters of the 1870s.',
      'The first 1 GB hard drive, IBM’s 3380 in 1980, was the size of a refrigerator.'
    ],
    science: [
      'Octopuses have three hearts and blue blood.',
      'Honey found in ancient Egyptian tombs was still edible thousands of years later.',
      'A teaspoon of a neutron star would weigh about a billion tonnes on Earth.',
      'Bananas are slightly radioactive, because they contain potassium-40.',
      'Your body has roughly as many bacterial cells as human ones.'
    ],
    sports: [
      'A Test cricket match can last five days and still end in a draw.',
      'The first modern Olympic Games were held in Athens in 1896.',
      'A football match has 90 minutes of play, but the ball is usually in play for only about 55 to 60 of them.',
      'Formula 1 cars can brake from 200 km/h to a standstill in under four seconds.',
      'Tennis scoring of 15, 30, 40 may come from a clock face used to keep score.'
    ],
    health: [
      'Your heart beats around 100,000 times a day.',
      'Adults need 7 to 9 hours of sleep a night, according to most sleep scientists.',
      'Walking briskly for 30 minutes a day lowers the risk of heart disease.',
      'Smallpox is the only human disease to have been eradicated, declared in 1980.',
      'Babies are born with around 270 bones; many fuse together, leaving adults with 206.'
    ],
    culture: [
      'India makes more films every year than any other country.',
      '“Raja Harishchandra” (1913), by Dadasaheb Phalke, was India’s first full-length feature film.',
      'The first Academy Awards ceremony, in 1929, lasted about 15 minutes.',
      'Tagore’s “Jana Gana Mana” was first sung at a Congress session in Calcutta in 1911.',
      'The best-selling album of all time is Michael Jackson’s “Thriller” (1982).'
    ]
  };
  for (const [topic, list] of Object.entries(FACTS)) list.forEach((text, i) => C.FACTS.push({ id: `f-${topic}${i}`, text, topic }));

  // [topic, question, options, answerIndex, level 1–3, note]
  const QUIZ = [
    ['world', 'How many member states does the United Nations have?', ['193', '150', '206', '171'], 0, 2, 'South Sudan, in 2011, was the latest to join.'],
    ['world', 'Which city is home to the International Court of Justice?', ['The Hague', 'Geneva', 'New York', 'Vienna'], 0, 2, 'It sits in the Peace Palace in The Hague.'],
    ['world', 'Which is the largest country by area?', ['Russia', 'Canada', 'China', 'United States'], 0, 1, 'Russia covers about 17 million square kilometres.'],
    ['world', 'Which ocean is the largest?', ['Pacific', 'Atlantic', 'Indian', 'Southern'], 0, 1, 'The Pacific covers about a third of the Earth’s surface.'],
    ['india', 'Who chaired the drafting committee of the Indian Constitution?', ['B. R. Ambedkar', 'Jawaharlal Nehru', 'Rajendra Prasad', 'Sardar Patel'], 0, 1, 'The Constitution came into force on 26 January 1950.'],
    ['india', 'How many elected seats does the Lok Sabha have?', ['543', '545', '500', '250'], 0, 3, 'Each seat is one parliamentary constituency.'],
    ['india', 'Which state has the longest coastline in India?', ['Gujarat', 'Tamil Nadu', 'Andhra Pradesh', 'Kerala'], 0, 2, 'Its coast runs from the Rann of Kutch to the Gulf of Khambhat.'],
    ['india', 'In which year did India hold its first general election?', ['1951–52', '1947', '1950', '1957'], 0, 2, 'Voting was spread over several months.'],
    ['finance', 'What does IPO stand for?', ['Initial public offering', 'International portfolio order', 'Indexed price option', 'Internal profit outlook'], 0, 1, 'It is when a company first sells shares to the public.'],
    ['finance', 'Which index tracks 50 large companies on India’s National Stock Exchange?', ['Nifty 50', 'Sensex', 'Nasdaq 100', 'FTSE 100'], 0, 1, 'The Sensex tracks 30 companies on the BSE.'],
    ['finance', 'What is the “repo rate”?', ['The rate at which the RBI lends to banks', 'The rate banks pay on savings', 'The tax on share trades', 'The rate of inflation'], 0, 2, 'Raising it usually makes loans more expensive.'],
    ['finance', 'Using the rule of 72, roughly how long does money take to double at 6% a year?', ['12 years', '6 years', '20 years', '72 years'], 0, 2, '72 ÷ 6 = 12.'],
    ['finance', 'A “bear market” means prices have…', ['Fallen 20% or more from a peak', 'Risen 20% or more', 'Stayed flat for a year', 'Doubled'], 0, 2, 'A bull market is the opposite.'],
    ['tech', 'What does “HTTP” stand for?', ['HyperText Transfer Protocol', 'High Transfer Text Process', 'Hosted Text Transfer Program', 'HyperText Transmission Path'], 0, 1, 'The “S” in HTTPS means the connection is encrypted.'],
    ['tech', 'Who invented the World Wide Web?', ['Tim Berners-Lee', 'Bill Gates', 'Vint Cerf', 'Steve Jobs'], 0, 1, 'He wrote the proposal at CERN in 1989.'],
    ['tech', 'What does “AI” stand for?', ['Artificial intelligence', 'Automated internet', 'Advanced integration', 'Analog input'], 0, 1, 'The term was coined for a 1956 workshop at Dartmouth.'],
    ['tech', 'How many bits are in a byte?', ['8', '4', '16', '10'], 0, 1, 'A kilobyte is 1,000 (or 1,024) bytes.'],
    ['tech', 'Which company created the Android operating system before Google bought it?', ['Android Inc.', 'Nokia', 'Samsung', 'BlackBerry'], 0, 3, 'Google bought it in 2005.'],
    ['science', 'What is the chemical symbol for gold?', ['Au', 'Ag', 'Gd', 'Go'], 0, 1, 'From the Latin “aurum”.'],
    ['science', 'What is the powerhouse of the cell?', ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi body'], 0, 1, 'Mitochondria make most of the cell’s energy.'],
    ['science', 'What does DNA stand for?', ['Deoxyribonucleic acid', 'Dinitrogen acid', 'Double nucleic acid', 'Deoxyribose nitrate'], 0, 2, 'Its double-helix shape was described in 1953.'],
    ['science', 'Which gas makes up most of Earth’s atmosphere?', ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Argon'], 0, 2, 'About 78% nitrogen, 21% oxygen.'],
    ['sports', 'How many players does a cricket team have on the field?', ['11', '10', '12', '9'], 0, 1, 'Same as football.'],
    ['sports', 'Which country has won the most FIFA World Cups?', ['Brazil', 'Germany', 'Italy', 'Argentina'], 0, 1, 'Brazil has five titles.'],
    ['sports', 'Which Grand Slam tournament is played on clay?', ['French Open', 'Wimbledon', 'US Open', 'Australian Open'], 0, 2, 'It is held at Roland Garros in Paris.'],
    ['sports', 'In which year did India win its first Cricket World Cup?', ['1983', '1987', '2011', '1975'], 0, 2, 'Kapil Dev’s team beat the West Indies at Lord’s.'],
    ['sports', 'How long is a marathon?', ['42.195 km', '40 km', '26 km', '50 km'], 0, 2, 'The odd distance dates from the 1908 London Olympics.'],
    ['health', 'Which vitamin does your skin make in sunlight?', ['Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin B12'], 0, 1, 'It helps the body absorb calcium.'],
    ['health', 'What is a normal resting heart rate for adults?', ['60–100 beats a minute', '30–50', '110–140', '150–180'], 0, 2, 'Fit athletes are often lower.'],
    ['health', 'Who discovered penicillin?', ['Alexander Fleming', 'Louis Pasteur', 'Edward Jenner', 'Jonas Salk'], 0, 1, 'In 1928, by accident.'],
    ['culture', 'Which Indian film-maker received an honorary Oscar in 1992?', ['Satyajit Ray', 'Raj Kapoor', 'Mrinal Sen', 'Guru Dutt'], 0, 2, 'He accepted it from his hospital bed in Kolkata.'],
    ['culture', 'Who wrote the novel “Malgudi Days”?', ['R. K. Narayan', 'Ruskin Bond', 'Mulk Raj Anand', 'Vikram Seth'], 0, 2, 'Malgudi is a fictional town in South India.'],
    ['culture', 'Which composer won two Oscars for “Slumdog Millionaire”?', ['A. R. Rahman', 'Ilaiyaraaja', 'Shankar Mahadevan', 'Pritam'], 0, 1, 'For the score and for the song “Jai Ho”.']
  ];
  QUIZ.forEach(([topic, q, options, answer, level, note], i) => C.QUIZ.push({ id: `q-${topic}${i}`, topic, q, options, answer, level, note }));

  // Meme cards: [topic, id, test(context), emoji, top line, bottom line]
  C.TOPIC_MEMES = [
    ['finance', 'redday', (c) => /\b(fall|fell|slump\w*|crash\w*|plunge\w*|sell-?off|tumble\w*)\b/.test(c.text), '📉', 'The market: drops 2%.', 'Me, who bought yesterday: “Long-term investor, actually.”'],
    ['finance', 'greenday', (c) => /\b(rally|surge\w*|record high|jump\w*|soar\w*)\b/.test(c.text), '📈', 'Sensex hits a record.', 'Everyone at the office: “I always said buy.”'],
    ['finance', 'emi', () => true, '🧾', 'Salary: credited.', 'EMI, rent and three subscriptions: “We’ll take it from here.”'],
    ['finance', 'sip', () => true, '🐢', 'Me starting a monthly SIP: patience.', 'Me checking it every hour: not patience.'],
    ['tech', 'ai', (c) => /\b(ai|chatbot|model)\b/.test(c.text), '🤖', 'AI: writes a whole app in a minute.', 'Also AI: “Sorry, I can’t open that PDF.”'],
    ['tech', 'update', () => true, '🔄', 'Laptop: “Updating, don’t turn off.”', 'Me, five minutes before a meeting: 🫠'],
    ['tech', 'phone', (c) => /\b(iphone|smartphone|phone)\b/.test(c.text), '📱', 'New phone launch: “Our best camera ever.”', 'Me: photographs my lunch, same as before.'],
    ['tech', 'password', () => true, '🔐', 'Website: “Your password needs a symbol, a number and a capital.”', 'Me: Password1! (again)'],
    ['science', 'study', (c) => /\b(study|studies|research)\b/.test(c.text), '🧪', 'Headline: “Scientists discover…”', 'The study: 12 mice and one very tired PhD student.'],
    ['science', 'octopus', () => true, '🐙', 'Octopus: three hearts.', 'Me: can’t manage one Monday.'],
    ['sports', 'rain', (c) => /\b(rain|washed out|bad light)\b/.test(c.text), '🌧️', 'India vs Pakistan: tickets sold out in minutes.', 'The rain: “Mind if I join?”'],
    ['sports', 'lastover', (c) => /\b(cricket|over|wicket\w*)\b/.test(c.text), '🏏', 'Need 6 off the last ball.', 'Me: standing, sitting, praying, switching off the TV.'],
    ['sports', 'var', (c) => /\b(football|var|penalty|goal)\b/.test(c.text), '🖥️', 'Goal!', 'VAR, four minutes later: “Let’s talk about that toenail.”'],
    ['sports', 'f1', (c) => /\b(f1|grand prix|formula)\b/.test(c.text), '🏎️', 'Driver: “The tyres are gone.”', 'Engineer: “Understood. Push now.”'],
    ['world', 'summit', (c) => /\b(summit|talks|meeting)\b/.test(c.text), '🤝', 'World leaders after a summit: “Productive talks.”', 'Translation: they agreed to meet again.'],
    ['india', 'traffic', () => true, '🛺', 'Maps: “Your destination is 4 km away, 12 minutes.”', 'Indian traffic: “That’s cute.”'],
    ['india', 'monsoon', (c) => /\b(rain|monsoon|flood\w*)\b/.test(c.text), '☔', 'Monsoon: arrives.', 'Every road in the city: becomes a river.'],
    ['health', 'sleep', () => true, '😴', 'Doctor: “Get 8 hours of sleep.”', 'Me at 1 a.m.: “One more episode.”'],
    ['health', 'gym', () => true, '🏋️', 'January me: buys a yearly gym membership.', 'February me: buys a pizza.'],
    ['culture', 'boxoffice', (c) => /\b(box office|crore|collection\w*)\b/.test(c.text), '🎟️', 'Film: makes ₹100 crore on day one.', 'Me: still waiting for it on OTT.'],
    ['culture', 'binge', () => true, '🍿', 'Me: “Just one episode.”', 'Also me, at sunrise: “Season finale already?”']
  ];
  C.MEME_LINKS = {
    astronomy: { label: 'More space memes', url: 'https://www.reddit.com/r/astronomymemes/' },
    tech: { label: 'More tech memes', url: 'https://www.reddit.com/r/ProgrammerHumor/' },
    science: { label: 'More science memes', url: 'https://www.reddit.com/r/sciencememes/' },
    default: { label: 'More memes', url: 'https://www.reddit.com/r/wholesomememes/' }
  };
})(typeof window !== 'undefined' ? window : globalThis);
