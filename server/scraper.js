const { url, max_iter, max_retries } = require("./constants");
const { sleep, curlContent } = require("./utils");
const NC = require("node-cache");
const Cache = new NC({ checkperiod: 0 });
const axios = require("axios");
const cheerio = require("cheerio");

// Fungsi untuk mengambil gambar dari Google
const getGoogleImages = async (query) => {
  const googleUrl = `https://www.google.com/search?hl=en&tbm=isch&q=${encodeURIComponent(query)}`;
  try {
    const { data } = await axios.get(googleUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(data);
    const images = [];
    
    $('img').each((i, element) => {
      const src = $(element).attr('src');
      if (src && src.startsWith("http")) {
        images.push(src);
      }
    });
    
    return images;
  } catch (error) {
    console.error("Error fetching images from Google:", error);
    return [];
  }
};
// Fungsi untuk mengambil gambar dari Bing
const getBingImages = async (query) => {
  const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
  try {
    const { data } = await axios.get(bingUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(data);
    const images = [];
    
    $('img').each((i, element) => {
      const src = $(element).attr('src');
      if (src && src.startsWith("http")) {
        images.push(src);
      }
    });
    
    return images;
  } catch (error) {
    console.error("Error fetching images from Bing:", error);
    return [];
  }
};
const getToken = async (query) => {
  let token = null;
  try {
    let reqUrl = url + "?";
    let params = new URLSearchParams({
      q: query,
      t: "h_",
      iax: "images",
      ia: "images",
    }).toString();
    let res = await curlContent(reqUrl + params);

    token = res.match(/vqd=([\d-]+)\&/)[1];
  } catch (error) {}

  return new Promise((resolve, reject) => {
    if (!token) reject("Failed to get token");
    resolve(token);
  });
};

const getImages = async (query, moderate, retries, iterations) => {
  let reqUrl = url + "i.js?";
  let keywords = query;
  let p = moderate ? 1 : -1; // by default moderate false
  let attempt = 0;
  if (!retries) retries = max_retries; // default to max if none provided
  if (!iterations) iterations = max_iter; // default to max if none provided

  let results = [];

  try {
    let dataCache = Cache.get("images::" + keywords);
    if (dataCache == undefined) {
      let token = await getToken(keywords);

      let params = new URLSearchParams({
        l: "wt-wt",
        o: "json",
        q: keywords,
        vqd: token,
        f: ",,,",
        p: "" + p,
      }).toString();

      let data = null;
      let itr = 0;

      while (itr < iterations) {
        while (true) {
          try {
            let response = await curlContent(reqUrl + params);

            data = response;
            data = await JSON.parse(data);
            if (!data.results) throw "No results";
            break;
          } catch (error) {
            attempt += 1;
            if (attempt > retries) {
              return new Promise((resolve, reject) => {
                Cache.set("images::" + keywords, results);
                resolve(results);
              });
            }
            await sleep(5000);
            continue;
          }
        }

        results = [...results, ...data.results];
        for (let i = 0; i < results.length; i++) {
          results[i]["title"] = results[i]["title"].replace(/\.+/gi, "");
        }
        Cache.set("images::" + keywords, results);
        if (!data.next) {
          return new Promise((resolve, reject) => {
            resolve(results);
          });
        }
        reqUrl = url + data["next"];
        itr += 1;
        attempt = 0;
      }
    } else {
      results = dataCache;
    }
  } catch (error) {}
  Cache.close();
  return results;
};
const getImages = async (query, moderate, retries, iterations) => {
  let results = [];

  try {
    // Cek cache dulu
    let dataCache = Cache.get("images::" + query);
    if (dataCache == undefined) {
      let googleImages = await getGoogleImages(query);
      let bingImages = await getBingImages(query);
      let otherImages = []; // Placeholder untuk gambar dari sumber lain jika diperlukan

      results = [...googleImages, ...bingImages, ...otherImages];

      // Hapus duplikat dan batasi hasil jika perlu
      results = [...new Set(results)];

      Cache.set("images::" + query, results);
    } else {
      results = dataCache;
    }

    return results;
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
};

const getSentences = async (query) => {
  let reqUrl = "https://html.duckduckgo.com/html/?";
  try {
    let results = [];
    let dataCache = Cache.get("text::" + query);
    if (dataCache == undefined) {
      let params = new URLSearchParams({
        q: query,
      }).toString();
      let response = await curlContent(reqUrl + params);
      if (response != "err") {
        response = response.match(
          /(?<=\<a\sclass="result__snippet.*?\>).*?(?=\<\/a\>)/g
        );
        if (response != null) {
          response.forEach((e) => {
            e = e.replace(/\.+/g, ".");
            e = removeCommonwords(e);
            results.push(e);
          });
        }
      }
      if (results.length == 0) {
        results[0] = `Hello, in this particular article you will provide several interesting pictures of <b>${query}</b>. We found many exciting and extraordinary <b>${query}</b> pictures that can be tips, input and information intended for you. In addition to be able to the <b>${query}</b> main picture, we also collect some other related images. Find typically the latest and best <b>${query}</b> images here that many of us get selected from plenty of other images.`;
        results[1] = `We all hope you can get actually looking for concerning <b>${query}</b> here. There is usually a large selection involving interesting image ideas that will can provide information in order to you. You can get the pictures here regarding free and save these people to be used because reference material or employed as collection images with regard to personal use. Our imaginative team provides large dimensions images with high image resolution or HD.`;
        results[2] = `<b>${query}</b> - To discover the image more plainly in this article, you are able to click on the preferred image to look at the photo in its original sizing or in full. A person can also see the <b>${query}</b> image gallery that we all get prepared to locate the image you are interested in.`;
        results[3] = `We all provide many pictures associated with <b>${query}</b> because our site is targeted on articles or articles relevant to <b>${query}</b>. Please check out our latest article upon the side if a person don't get the <b>${query}</b> picture you are looking regarding. There are various keywords related in order to and relevant to <b>${query}</b> below that you can surf our main page or even homepage.`;
        results[4] = `Hopefully you discover the image you happen to be looking for and all of us hope you want the <b>${query}</b> images which can be here, therefore that maybe they may be a great inspiration or ideas throughout the future.`;
        results[5] = `All <b>${query}</b> images that we provide in this article are usually sourced from the net, so if you get images with copyright concerns, please send your record on the contact webpage. Likewise with problematic or perhaps damaged image links or perhaps images that don't seem, then you could report this also. We certainly have provided a type for you to fill in.`;
        results[6] = `The pictures related to be able to <b>${query}</b> in the following paragraphs, hopefully they will can be useful and will increase your knowledge. Appreciate you for making the effort to be able to visit our website and even read our articles. Cya ~.`;
      }
      Cache.set("text::" + query, results);
    } else {
      results = dataCache;
    }
    return new Promise((resolve, reject) => {
      Cache.close();
      resolve(results);
    });
  } catch (e) {}
};

const removeCommonwords = (str) => {
  let cWords = [
    " a",
    "able",
    "about",
    "above",
    "abroad",
    "according",
    "accordingly",
    "across",
    "actually",
    "adj",
    "after",
    "afterwards",
    "again",
    "against",
    "ago",
    "ahead",
    "ain't",
    "all",
    "allow",
    "allows",
    "almost",
    "alone",
    "along",
    "alongside",
    "already",
    "also",
    "although",
    "always",
    "am",
    "amid",
    "amidst",
    "among",
    "amongst",
    "an",
    "and",
    "another",
    "any",
    "anybody",
    "anyhow",
    "anyone",
    "anything",
    "anyway",
    "anyways",
    "anywhere",
    "apart",
    "appear",
    "appreciate",
    "appropriate",
    "are",
    "aren't",
    "around",
    "as",
    "a's",
    "aside",
    "ask",
    "asking",
    "associated",
    "at",
    "available",
    "away",
    "awfully",
    " b ",
    "back",
    "backward",
    "backwards",
    "be",
    "became",
    "because",
    "become",
    "becomes",
    "becoming",
    "been",
    "before",
    "beforehand",
    "begin",
    "behind",
    "being",
    "believe",
    "below",
    "beside",
    "besides",
    "best",
    "better",
    "between",
    "beyond",
    "both",
    "brief",
    "but",
    "by",
    "c",
    "came",
    "can",
    "cannot",
    "cant",
    "can't",
    "caption",
    "cause",
    "causes",
    "certain",
    "certainly",
    "changes",
    "clearly",
    "c'mon",
    "co",
    "co.",
    "com",
    "come",
    "comes",
    "concerning",
    "consequently",
    "consider",
    "considering",
    "contain",
    "containing",
    "contains",
    "corresponding",
    "could",
    "couldn't",
    "course",
    "c's",
    "currently",
    "d",
    "dare",
    "daren't",
    "definitely",
    "described",
    "despite",
    "did",
    "didn't",
    "different",
    "directly",
    "do",
    "does",
    "doesn't",
    "doing",
    "done",
    "don't",
    "down",
    "downwards",
    "during",
    "e",
    "each",
    "edu",
    "eg",
    "eight",
    "eighty",
    "either",
    "else",
    "elsewhere",
    "end",
    "ending",
    "enough",
    "entirely",
    "especially",
    "et",
    "etc",
    "even",
    "ever",
    "evermore",
    "every",
    "everybody",
    "everyone",
    "everything",
    "everywhere",
    "ex",
    "exactly",
    "example",
    "except",
    "f",
    "fairly",
    "far",
    "farther",
    "few",
    "fewer",
    "fifth",
    "first",
    "five",
    "followed",
    "following",
    "follows",
    "for",
    "forever",
    "former",
    "formerly",
    "forth",
    "forward",
    "found",
    "four",
    "from",
    "further",
    "furthermore",
    "g",
    "get",
    "gets",
    "getting",
    "given",
    "gives",
    "go",
    "goes",
    "going",
    "gone",
    "got",
    "gotten",
    "greetings",
    "h",
    "had",
    "hadn't",
    "half",
    "happens",
    "hardly",
    "has",
    "hasn't",
    "have",
    "haven't",
    "having",
    "he",
    "he'd",
    "he'll",
    "hello",
    "help",
    "hence",
    "her",
    "here",
    "hereafter",
    "hereby",
    "herein",
    "here's",
    "hereupon",
    "hers",
    "herself",
    "he's",
    "hi",
    "him",
    "himself",
    "his",
    "hither",
    "hopefully",
    "how",
    "howbeit",
    "however",
    "hundred",
    "i",
    "i'd",
    "ie",
    "if",
    "ignored",
    "i'll",
    "i'm",
    "immediate",
    "in",
    "inasmuch",
    "inc",
    "inc.",
    "indeed",
    "indicate",
    "indicated",
    "indicates",
    "inner",
    "inside",
    "insofar",
    "instead",
    "into",
    "inward",
    "is",
    "isn't",
    "it",
    "it'd",
    "it'll",
    "its",
    "it's",
    "itself",
    "i've",
    "j",
    "just",
    "k",
    "keep",
    "keeps",
    "kept",
    "know",
    "known",
    "knows",
    "l",
    "last",
    "lately",
    "later",
    "latter",
    "latterly",
    "least",
    "less",
    "lest",
    "let",
    "let's",
    "like",
    "liked",
    "likely",
    "likewise",
    "little",
    "'ll",
    "look",
    "looking",
    "looks",
    "low",
    "lower",
    "ltd",
    "m",
    "made",
    "mainly",
    "make",
    "makes",
    "many",
    "may",
    "maybe",
    "mayn't",
    "me",
    "mean",
    "meantime",
    "meanwhile",
    "merely",
    "might",
    "mightn't",
    "mine",
    "minus",
    "miss",
    "more",
    "moreover",
    "most",
    "mostly",
    "mr",
    "mrs",
    "much",
    "must",
    "mustn't",
    "my",
    "myself",
    "n",
    "name",
    "namely",
    "nd",
    "near",
    "nearly",
    "necessary",
    "need",
    "needn't",
    "needs",
    "neither",
    "never",
    "neverf",
    "neverless",
    "nevertheless",
    "new",
    "next",
    "nine",
    "ninety",
    "no",
    "nobody",
    "non",
    "none",
    "nonetheless",
    "noone",
    "no-one",
    "nor",
    "normally",
    "not",
    "nothing",
    "notwithstanding",
    "novel",
    "now",
    "nowhere",
    "o",
    "obviously",
    "of",
    "off",
    "often",
    "oh",
    "ok",
    "okay",
    "old",
    "on",
    "once",
    "one",
    "ones",
    "one's",
    "only",
    "onto",
    "opposite",
    "or",
    "other",
    "others",
    "otherwise",
    "ought",
    "oughtn't",
    "our",
    "ours",
    "ourselves",
    "out",
    "outside",
    "over",
    "overall",
    "own",
    "particular",
    "particularly",
    "past",
    "per",
    "perhaps",
    "placed",
    "please",
    "plus",
    "possible",
    "presumably",
    "probably",
    "provided",
    "provides",
    "q",
    "que",
    "quite",
    "qv",
    "r",
    "rather",
    "rd",
    "re",
    "really",
    "reasonably",
    "recent",
    "recently",
    "regarding",
    "regardless",
    "regards",
    "relatively",
    "respectively",
    "right",
    "round",
    "s",
    "said",
    "same",
    "saw",
    "say",
    "saying",
    "says",
    "second",
    "secondly",
    "see",
    "seeing",
    "seem",
    "seemed",
    "seeming",
    "seems",
    "seen",
    "self",
    "selves",
    "sensible",
    "sent",
    "serious",
    "seriously",
    "seven",
    "several",
    "shall",
    "shan't",
    "she",
    "she'd",
    "she'll",
    "she's",
    "should",
    "shouldn't",
    "since",
    "six",
    "so",
    "some",
    "somebody",
    "someday",
    "somehow",
    "someone",
    "something",
    "sometime",
    "sometimes",
    "somewhat",
    "somewhere",
    "soon",
    "sorry",
    "specified",
    "specify",
    "specifying",
    "still",
    "sub",
    "such",
    "sup",
    "sure",
    "t",
    "take",
    "taken",
    "taking",
    "tell",
    "tends",
    "th",
    "than",
    "thank",
    "thanks",
    "thanx",
    "that",
    "that'll",
    "thats",
    "that's",
    "that've",
    "'ve",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "thence",
    "there",
    "thereafter",
    "thereby",
    "there'd",
    "therefore",
    "therein",
    "there'll",
    "there're",
    "theres",
    "there's",
    "thereupon",
    "there've",
    "these",
    "they",
    "they'd",
    "they'll",
    "they're",
    "they've",
    "thing",
    "things",
    "think",
    "third",
    "thirty",
    "this",
    "thorough",
    "thoroughly",
    "those",
    "though",
    "three",
    "through",
    "throughout",
    "thru",
    "thus",
    "till",
    "to",
    "together",
    "too",
    "took",
    "toward",
    "towards",
    "tried",
    "tries",
    "truly",
    "try",
    "trying",
    "t's",
    "twice",
    "two",
    "u",
    "un",
    "under",
    "underneath",
    "undoing",
    "unfortunately",
    "unless",
    "unlike",
    "unlikely",
    "until",
    "unto",
    "up",
    "upon",
    "upwards",
    "us",
    "use",
    "used",
    "useful",
    "uses",
    "using",
    "usually",
    "v",
    "value",
    "various",
    "versus",
    "very",
    "via",
    "viz",
    "vs",
    "w",
    "want",
    "wants",
    "was",
    "wasn't",
    "way",
    "we",
    "we'd",
    "welcome",
    "well",
    "we'll",
    "went",
    "were",
    "we're",
    "weren't",
    "we've",
    "what",
    "whatever",
    "what'll",
    "what's",
    "what've",
    "when",
    "whence",
    "whenever",
    "where",
    "whereafter",
    "whereas",
    "whereby",
    "wherein",
    "where's",
    "whereupon",
    "wherever",
    "whether",
    "which",
    "whichever",
    "while",
    "whilst",
    "whither",
    "who",
    "who'd",
    "whoever",
    "whole",
    "who'll",
    "whom",
    "whomever",
    "who's",
    "whose",
    "why",
    "will",
    "willing",
    "wish",
    "with",
    "within",
    "without",
    "wonder",
    "won't",
    "would",
    "wouldn't",
    "x",
    "y",
    "yes",
    "yet",
    "you",
    "you'd",
    "you'll",
    "your",
    "you're",
    "you've",
    "yours",
    "yourself",
    "yourselves",
    "you've",
    "z",
    "zero",
    "ada",
    "adalah",
    "agak",
    "agar",
    "akan",
    "aku",
    "amat",
    "anda",
    "apa",
    "apabila",
    "atau",
    "bahwa",
    "bagai",
    "baru",
    "beberapa",
    "begitu",
    "begini",
    "bila",
    "belum",
    "betapa",
    "banyak",
    "boleh",
    "cara",
    "cuma",
    "dan",
    "dalam",
    "dari",
    "dapat",
    "demikian",
    "dengan",
    "di",
    "dia",
    "hanya",
    "harus",
    "ialah",
    "ini",
    "ingin",
    "itu",
    "hanya",
    "jika",
    "juga",
    "hendak",
    "kali",
    "kalau",
    "kami",
    "kan",
    "karena",
    "ke",
    "kelak",
    "kemudian",
    "kenapa",
    "kepada",
    "kini",
    "ku",
    "lah",
    "lain-lain",
    "lagi",
    "lalu",
    "lama",
    "lantas",
    "maka",
    "mana",
    "masa",
    "masih",
    "mau",
    "me",
    "mereka",
    "merupakan",
    "meng",
    "mengapa",
    "mesti",
    "mu",
    "namun",
    "nan",
    "nun",
    "nya",
    "orang",
    "pada",
    "paling",
    "pasti",
    "para",
    "pen",
    "pengen",
    "pernah",
    "saat",
    "saja",
    "sana",
    "sang",
    "sangat",
    "saya",
    "sebagainya",
    "sedang",
    "sehingga",
    "selain",
    "selalu",
    "seluruh",
    "sekali",
    "sekarang",
    "sementara",
    "semua",
    "senantiasa",
    "seorang",
    "seseorang",
    "seperti",
    "serba",
    "sering",
    "serta",
    "sesuatu",
    "si",
    "sini",
    "situ",
    "suatu",
    "sudah",
    "supaya",
    "tahun",
    "tanpa",
    "telah",
    "terus",
    "untuk",
    "yakni",
    "yaitu",
    "yang",
  ];

  let sentences;
  try {
    let rgx = new RegExp(cWords.join(" | "), "gi");
    sentences = str.replace(rgx, " ");
    sentences = sentences.replace(/\s+/g, " ");
    return sentences;
  } catch (e) {}
};

module.exports = { getImages, getSentences };
