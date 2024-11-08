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

  if (!token) throw new Error("Failed to get token");
  return token;
};

const getImages = async (query, moderate = false, retries = max_retries, iterations = max_iter) => {
  let reqUrl = url + "i.js?";
  let keywords = query;
  let p = moderate ? 1 : -1;
  let attempt = 0;

  let results = [];

  try {
    let dataCache = Cache.get("images::" + keywords);
    if (dataCache === undefined) {
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

            data = await JSON.parse(response);
            if (!data.results) throw new Error("No results");
            break;
          } catch (error) {
            attempt += 1;
            if (attempt > retries) {
              Cache.set("images::" + keywords, results);
              return results;
            }
            await sleep(5000);
          }
        }

        results = [...results, ...data.results];
        for (let i = 0; i < results.length; i++) {
          results[i]["title"] = results[i]["title"].replace(/\.+/gi, "");
        }

        Cache.set("images::" + keywords, results);

        if (!data.next) {
          return results;
        }

        reqUrl = url + data["next"];
        itr += 1;
        attempt = 0;
      }
    } else {
      results = dataCache;
    }
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }

  return results;
};

const getSentences = async (query) => {
  const reqUrl = "https://html.duckduckgo.com/html/?";
  try {
    let results = [];
    let dataCache = Cache.get("text::" + query);
    if (dataCache === undefined) {
      const params = new URLSearchParams({
        q: query,
      }).toString();
      let response = await curlContent(reqUrl + params);

      if (response !== "err") {
        response = response.match(/(?<=\<a\sclass="result__snippet.*?\>).*?(?=\<\/a\>)/g);
        if (response != null) {
          response.forEach((e) => {
            e = e.replace(/\.+/g, ".");
            e = removeCommonwords(e);
            results.push(e);
          });
        }
      }

      if (results.length === 0) {
        results = generateFallbackSentences(query);
      }

      Cache.set("text::" + query, results);
    } else {
      results = dataCache;
    }

    return results;
  } catch (error) {
    console.error("Error fetching sentences:", error);
    return [];
  }
};

const generateFallbackSentences = (query) => {
  return [
    `Hello, in this particular article you will provide several interesting pictures of <b>${query}</b>. We found many exciting and extraordinary <b>${query}</b> pictures that can be tips, input and information intended for you.`,
    `We hope you can get actually looking for concerning <b>${query}</b> here. There is usually a large selection involving interesting image ideas that can provide information to you.`,
    `All <b>${query}</b> images that we provide in this article are usually sourced from the net, so if you get images with copyright concerns, please send your record on the contact webpage.`,
    // ... other fallback sentences
  ];
};

const removeCommonwords = (str) => {
  let cWords = [/* your list of common words */];
  try {
    let rgx = new RegExp(cWords.join(" | "), "gi");
    return str.replace(rgx, " ").replace(/\s+/g, " ");
  } catch (e) {
    console.error("Error removing common words:", e);
    return str;
  }
};

module.exports = { getImages, getSentences };
