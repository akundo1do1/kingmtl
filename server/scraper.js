const axios = require('axios');
const { url, max_iter, max_retries } = require("./constants");
const { sleep } = require("./utils");
const NC = require("node-cache");
const Cache = new NC({ checkperiod: 0 });
const https = require('https');
const { HttpProxyAgent } = require('https-proxy-agent');

// Define a list of proxies (Replace with your actual proxy list)
const proxies = [
  'http://ariaatr.com:8080',
  // Add more proxies as needed
];

// Helper function to select a random proxy
const getRandomProxy = () => {
  return proxies[Math.floor(Math.random() * proxies.length)];
};

// Modified curlContent function to use axios with a proxy
const curlContent = async (url, retries = 3) => {
  let attempt = 0;
  let response = null;

  while (attempt < retries) {
    try {
      const proxyUrl = getRandomProxy();
      const agent = new HttpProxyAgent(proxyUrl);

      // Send request using axios with the selected proxy
      response = await axios.get(url, {
        httpsAgent: agent,
        httpAgent: agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      return response.data;
    } catch (error) {
      console.log(`Request failed with proxy ${getRandomProxy()}. Attempt ${attempt + 1} of ${retries}.`);
      attempt += 1;
      if (attempt >= retries) {
        throw new Error('All proxy attempts failed');
      }
      await sleep(3000); // Wait before retrying
    }
  }
};

// getToken function remains the same
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
  } catch (error) {
    console.error('Error getting token:', error);
  }

  return new Promise((resolve, reject) => {
    if (!token) reject("Failed to get token");
    resolve(token);
  });
};

// getImages function
const getImages = async (query, moderate, retries, iterations) => {
  let reqUrl = url + "i.js?";
  let keywords = query;
  let p = moderate ? 1 : -1;
  let attempt = 0;
  if (!retries) retries = max_retries;
  if (!iterations) iterations = max_iter;

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
            data = await JSON.parse(response);
            if (!data.results) throw "No results";
            break;
          } catch (error) {
            attempt += 1;
            if (attempt > retries) {
              Cache.set("images::" + keywords, results);
              return results;
            }
            await sleep(5000); // Wait before retrying
            continue;
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
    console.error('Error fetching images:', error);
  }
  Cache.close();
  return results;
};

// getSentences function
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
      if (response !== "err") {
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
  } catch (e) {
    console.error('Error fetching sentences:', e);
  }
};

// Utility function to remove common words (unchanged)
const removeCommonwords = (text) => {
  return text.replace(/(?:\b(?:this|that|is|was|for|the|to|with)\b[\s,]*)+/gi, ' ').trim();
};
