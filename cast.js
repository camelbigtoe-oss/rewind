// The REWIND TV cast: rival VJs (beat them in Ratings War to recruit them as co-hosts),
// Gold Records (achievements), channel themes and the collectible milk caps.
const Cast = (() => {
  "use strict";
  // perk ids are handled in rounds.js
  const PERKS = {
    fifty: { name: "SCRATCH", icon: "💿", desc: "Scratch out two wrong answers." },
    poll: { name: "STUDIO POLL", icon: "📊", desc: "The studio audience votes. They're usually right." },
    freeze: { name: "PAUSE", icon: "⏸️", desc: "Freeze the clock for this question." },
    rewind: { name: "REWIND", icon: "⏪", desc: "Got it wrong? Rewind the tape and try again." },
    spoiler: { name: "SPOILER", icon: "🙊", desc: "Blurts out the answer, but you only get half points." },
    skip: { name: "CHANNEL HOP", icon: "📡", desc: "Swap this question for a new one, streak kept." },
    local: { name: "LOCAL KNOWLEDGE", icon: "🥝", desc: "Passive: never misses a Down Under question. Shows you the answer." },
    double: { name: "MONEY TALKS", icon: "💰", desc: "Double points on this question." },
  };
  const VJ = {
    remix: {
      name: "Kid Remix", style: "Cartoon Kung Fu", tag: "Saturday-morning cartoon fanatic. Eats cereal for every meal.", fav: "toons", lv: 2, acc: 0.52, speed: 7500, perk: "fifty",
      stats: { tv: 30, toons: 70, music: 35, movies: 40, toys: 50, oz: 20 },
      spec: { badge: "burst", topC: "#ff8a1a", top2: "#ffd21f", icon: "🥣", pat: "dots" },
      lines: { intro: ["Yo! It's Kid Remix, and it's my timeslot now!", "Cartoons are life. You ready to lose?"], win: ["Booyah! Back to the cereal!", "That's all, folks!"], lose: ["Aww, man! You're way too fresh.", "No fair! I want a rematch after cartoons."], right: ["Easy peasy!", "Called it!"], wrong: ["Wait, what?", "Bogus!"] },
    },
    tiff: {
      name: "Tiffani (with an i)", style: "Gossip Psychic", tag: "Knows every teen drama, every couple, every break-up.", fav: "tv", lv: 4, acc: 0.58, speed: 7000, perk: "poll",
      stats: { tv: 75, toons: 35, music: 55, movies: 50, toys: 25, oz: 35 },
      spec: { badge: "heart", topC: "#ff5ab0", top2: "#ffffff", icon: "💅", pat: "stripes" },
      lines: { intro: ["Um, like, this is MY show?", "As if you could beat me."], win: ["Whatever! See ya, wouldn't wanna be ya.", "Talk to the hand!"], lose: ["Ugh, as IF! Fine. You're totally all that.", "I'm, like, so over this."], right: ["Duh.", "So obvious."], wrong: ["Ugh, whatever!", "That question was bogus."] },
    },
    gus: {
      name: "Grunge Gus", style: "Feedback Brawler", tag: "Flannel-wearing music snob. Liked them before they were famous.", fav: "music", lv: 6, acc: 0.62, speed: 8000, perk: "freeze",
      stats: { tv: 40, toons: 30, music: 85, movies: 45, toys: 35, oz: 40 },
      spec: { badge: "splat", topC: "#4a6a3a", top2: "#2a2a3a", icon: "🎸", pat: "checker" },
      lines: { intro: ["...Oh. Hey. I guess we're doing this.", "Your favourite band sold out, man."], win: ["Whatever, man. Never mind.", "That was so mainstream of you."], lose: ["Huh. You're actually alright.", "Bummer. Respect though."], right: ["Obviously.", "Deep cut."], wrong: ["Meh.", "Didn't care anyway."] },
    },
    spinz: {
      name: "DJ Spinz", style: "Turntable Combat", tag: "Mixes beats, fixes mistakes. Can rewind anything.", fav: "music", lv: 8, acc: 0.65, speed: 6000, perk: "rewind",
      stats: { tv: 50, toons: 45, music: 80, movies: 55, toys: 50, oz: 45 },
      spec: { badge: "circle", topC: "#5a5aff", top2: "#ff5ab0", icon: "🎧", pat: "swirl" },
      lines: { intro: ["Wiki-wiki! DJ Spinz on the ones and twos!", "Let's get this party jumpin'!"], win: ["Drop the mic! Peace out!", "That's how we do it!"], lose: ["Yo, you got skills! Respect.", "Pull up! Pull up! You win this one."], right: ["Boom!", "Too easy!"], wrong: ["Record scratch!", "Off beat!"] },
    },
    moxie: {
      name: "Mama Moxie", style: "Blockbuster Fury", tag: "Has seen every movie twice. Will spoil the ending.", fav: "movies", lv: 10, acc: 0.68, speed: 6500, perk: "spoiler",
      stats: { tv: 60, toons: 50, music: 55, movies: 88, toys: 40, oz: 50 },
      spec: { badge: "star", topC: "#ff4a3a", top2: "#ffd21f", icon: "🍿", pat: "stars" },
      lines: { intro: ["Grab your popcorn, sugar. This won't take long.", "I've seen how this ends. You lose."], win: ["And... scene! Roll credits!", "Two thumbs down for you, honey."], lose: ["Plot twist! Didn't see that coming.", "Well, butter my popcorn. You're good."], right: ["Classic!", "Seen it."], wrong: ["Must've been the sequel.", "Oops, wrong reel."] },
    },
    pete: {
      name: "Pixel Pete", style: "Cheat-Code Cyborg", tag: "Gamer. Has every cheat code memorised.", fav: "toys", lv: 12, acc: 0.7, speed: 5500, perk: "skip",
      stats: { tv: 45, toons: 60, music: 45, movies: 60, toys: 92, oz: 40 },
      spec: { badge: "tv", topC: "#4ad04a", top2: "#2a2a3a", icon: "🕹️", pat: "zigzag" },
      lines: { intro: ["Player 2 has entered the game.", "Up, up, down, down... you're going down."], win: ["GAME OVER! Insert coin to continue.", "High score is mine!"], lose: ["Aww, I need an extra life.", "You found the secret level. GG."], right: ["Combo!", "Power-up!"], wrong: ["Lag!", "My controller's broken!"] },
    },
    sheila: {
      name: "Sheila Static", style: "Outback Commando", tag: "From across the ditch. Never misses a Down Under question.", fav: "oz", lv: 14, acc: 0.72, speed: 5500, perk: "local",
      stats: { tv: 65, toons: 55, music: 65, movies: 60, toys: 50, oz: 96 },
      spec: { badge: "shield", topC: "#1ad0b0", top2: "#ffd21f", icon: "🦘", pat: "dots" },
      lines: { intro: ["G'day! Hope you've done your homework, mate.", "Sweet as. Let's go."], win: ["Too easy! Hooroo!", "Chur, thanks for playing!"], lose: ["Strewth! You're a natural.", "Fair dinkum, you won that."], right: ["Easy as.", "Choice!"], wrong: ["Yeah, nah.", "Bugger!"] },
    },
    couch: {
      name: "Captain Couch", style: "Sofa Sumo", tag: "Hasn't left the sofa since 1991. Changes channel at lightning speed.", fav: "tv", lv: 17, acc: 0.75, speed: 5000, perk: "double",
      stats: { tv: 95, toons: 80, music: 60, movies: 75, toys: 70, oz: 55 },
      spec: { badge: "cloud", topC: "#8a5a33", top2: "#ff8a1a", icon: "🛋️", pat: "stripes" },
      lines: { intro: ["Don't touch that remote. I've got this.", "Thirty years of TV. Bring it."], win: ["Click. Channel changed. You're done.", "Back to my show."], lose: ["Whoa. Even I didn't know that.", "I need to get off this couch."], right: ["Saw that one.", "Rerun."], wrong: ["Must've been asleep.", "Ad break, sorry."] },
    },
    exec: {
      name: "The Network Exec", style: "Corporate Cancellation", tag: "Owns REWIND TV. Cancels shows for fun. The final boss.", fav: "tv", lv: 25, acc: 0.82, speed: 4500, perk: "double", boss: true,
      stats: { tv: 95, toons: 90, music: 90, movies: 95, toys: 88, oz: 85 },
      spec: { badge: "burst", topC: "#2a2a3a", top2: "#ffd21f", icon: "💼", pat: "gold" },
      lines: { intro: ["You want my network? Ha. Let's see your ratings.", "I've cancelled better shows than you."], win: ["You're cancelled.", "Ratings don't lie. Goodbye."], lose: ["Impossible! ...Fine. The network is yours.", "You've got the ratings. Welcome to the top."], right: ["Profitable.", "Obviously."], wrong: ["Fire the writers.", "Who wrote this question?"] },
    },
  };
  const ORDER = ["remix", "tiff", "gus", "spinz", "moxie", "pete", "sheila", "couch", "exec"];
  // painted portraits supplied as files: list a rival's id here once art/<id>.webp exists
  const ART = [];
  for (const id of ART) VJ[id].spec.art = `art/${id}.webp`;
  // what you unlock for beating each VJ
  const PRIZE = { remix: "Kid Remix joins your crew", tiff: "Tiffani joins your crew", gus: "Grunge Gus joins your crew", spinz: "DJ Spinz joins your crew + 🎧 icon", moxie: "Mama Moxie joins your crew", pete: "Pixel Pete joins your crew", sheila: "Sheila Static joins your crew", couch: "Captain Couch joins your crew", exec: "The Network Exec joins your crew + 💼 icon" };

  // ---------- Gold Records ----------
  const ACH = [
    { id: "first", name: "Tuned In", desc: "Finish your first Prime Time episode.", prize: "📺 icon" },
    { id: "perfect", name: "Perfect Show", desc: "Get every question right in a show.", prize: "🎯 icon" },
    { id: "streak10", name: "On a Roll", desc: "Get 10 answers right in a row." },
    { id: "streak25", name: "Can't Touch This", desc: "Get 25 answers right in a row." },
    { id: "diamond", name: "Five-Star Ratings", desc: "Score a 5-star episode.", prize: "💎 icon" },
    { id: "war1", name: "Hostile Takeover", desc: "Win your first Ratings War." },
    { id: "rave", name: "Ratings Machine", desc: "Win 5 Ratings Wars.", prize: "🪩 icon" },
    { id: "champion", name: "Own the Network", desc: "Beat The Network Exec.", prize: "👑 icon + Gold theme" },
    { id: "crew", name: "Full Crew", desc: "Recruit every VJ." },
    { id: "platinum", name: "Platinum", desc: "Reach level 20.", prize: "Gold pattern" },
    { id: "lv10", name: "Prime Time Player", desc: "Reach level 10." },
    { id: "daily1", name: "Morning Broadcast", desc: "Play your first Daily Broadcast." },
    { id: "daily7", name: "Must-See TV", desc: "Play the Daily Broadcast 7 days in a row." },
    { id: "marathon20", name: "Couch Marathon", desc: "Score 20 or more in Marathon." },
    { id: "marathon50", name: "Binge Watcher", desc: "Score 50 or more in Marathon." },
    { id: "blitz12", name: "Buzzer Beater", desc: "Get 12 right in one Buzzer Blitz." },
    { id: "exact5", name: "Time Lord", desc: "Guess the exact year 5 times." },
    { id: "order5", name: "Be Kind", desc: "Put a whole Rewind set in order 5 times." },
    { id: "speller", name: "Spelling Bee", desc: "Get 25 typed answers right." },
    { id: "pics", name: "Picture Perfect", desc: "Get 25 picture questions right." },
    { id: "r100", name: "Century", desc: "Answer 100 questions right." },
    { id: "r1000", name: "Trivia Titan", desc: "Answer 1,000 questions right." },
    { id: "fast", name: "Quick Draw", desc: "Answer right in under 2 seconds 25 times." },
    { id: "allcats", name: "Channel Master", desc: "Get 40 right in every channel." },
    { id: "oz50", name: "Sweet As", desc: "Get 50 Down Under questions right." },
    { id: "caps25", name: "Cap Collector", desc: "Collect 25 different caps." },
    { id: "caps48", name: "Slammer Supreme", desc: "Collect every cap." },
    { id: "holo", name: "Shiny!", desc: "Find a holo cap." },
    { id: "party", name: "House Party", desc: "Play a Party episode." },
    { id: "perks10", name: "Team Player", desc: "Use 10 co-host perks." },
  ];

  // ---------- channel themes ----------
  const THEMES = [
    { id: "saturday", name: "Sunny Saturday", lv: 1, desc: "Blue skies and fluffy clouds." },
    { id: "grunge", name: "Rainy Day", lv: 3, desc: "Grey sky, perfect for cartoons inside." },
    { id: "rave", name: "Sleepover", lv: 6, desc: "Stars and a big moon." },
    { id: "pastel", name: "Sunset", lv: 10, desc: "Pink and orange evening sky." },
    { id: "arcade", name: "Outer Space", lv: 14, desc: "Purple space and twinkling stars." },
    { id: "hyper", name: "Rainbow", lv: 20, desc: "Every colour at once." },
    { id: "gold", name: "Golden", ach: "champion", desc: "For the owner of the network." },
  ];

  // ---------- milk caps ----------
  const CAPS = [
    ["RAD", "🤘"], ["AS IF!", "💅"], ["WHATEVER", "🙄"], ["DA BOMB", "💣"], ["PHAT", "🔥"], ["BOO-YAH", "💥"], ["PSYCH!", "😜"], ["...NOT!", "🚫"],
    ["TALK TO THE HAND", "✋"], ["DUH", "🤪"], ["BOGUS", "👎"], ["TUBULAR", "🏄"], ["WICKED", "⚡"], ["FLY", "🪽"], ["FRESH", "🍃"], ["GNARLY", "🌊"],
    ["WORD UP", "💬"], ["DOPE", "😎"], ["SWEET AS", "🥝"], ["CHUR", "🤙"], ["CHOICE", "👌"], ["HARD OUT", "💪"], ["TOO EASY", "🦘"], ["STREWTH", "🐊"],
    ["EXCELLENT", "🎸"], ["ALL THAT", "🌟"], ["CHILL PILL", "💊"], ["BUZZKILL", "🐝"], ["GET JIGGY", "🕺"], ["OH SNAP", "📸"], ["MY BAD", "🤷"], ["FAR OUT", "🌀"],
    ["KEEN AS", "🎯"], ["EXTREME!", "🛹"], ["BE KIND", "📼"], ["CYBER", "💾"], ["POWER UP", "🍄"], ["GAME OVER", "👾"], ["SLAMMER", "🥏"], ["MIXTAPE", "📻"],
    ["HOLO RAD", "🌈"], ["HOLO BOMB", "💎"], ["HOLO TAPE", "📀"], ["HOLO STAR", "⭐"], ["HOLO SKULL", "💀"], ["HOLO YIN-YANG", "☯️"], ["HOLO ALIEN", "👽"], ["HOLO CROWN", "👑"],
  ].map(([name, icon], i) => ({ id: "c" + i, name, icon, rare: i >= 40 ? "holo" : i % 5 === 4 ? "rare" : "common", pal: i % 8 }));
  const CAP_PAL = [["#ff3f8e", "#ffe14d"], ["#2fd8ff", "#7b3cff"], ["#1ee3a1", "#1d1d26"], ["#ff7a1a", "#2f4fd6"], ["#ffe14d", "#e8473a"], ["#7b3cff", "#1ee3a1"], ["#f4f1ea", "#ff3f8e"], ["#1d1d26", "#ffe14d"]];
  function capSvg(cap, owned = true) {
    if (!owned) return `<div class="cap none"><span>?</span></div>`;
    const [a, b] = CAP_PAL[cap.pal];
    return `<div class="cap ${cap.rare}" style="--a:${a};--b:${b}"><i>${cap.icon}</i><b>${Core.esc(cap.name)}</b></div>`;
  }

  return { PERKS, VJ, ORDER, PRIZE, ACH, THEMES, CAPS, capSvg };
})();
