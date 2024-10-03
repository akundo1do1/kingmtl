const { headers } = require("./constants");
const unirest = require("unirest");
const fs = require("fs");

const curlContent = async (url) => {
  return new Promise((resolve, reject) => {
    let dataBody = "";
    unirest
      .request({
        uri: url,
        headers: headers,
        gzip: true,
      })
      .on("error", (error) => {
        resolve("err");
      })
      .on("data", (data) => {
        dataBody += data;
      })
      .on("end", () => {
        resolve(dataBody);
      });
  });
};

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const ucwords = (str) => {
  let strVal = [];
  str = str.split(" ");
  for (var chr = 0; chr < str.length; chr++) {
    strVal[chr] =
      str[chr].substring(0, 1).toUpperCase() +
      str[chr].substring(1, str[chr].length);
  }
  return strVal.join(" ");
};

const getFile = async (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(process.cwd() + "/" + path, "utf-8", (err, data) => {
      if (err) {
        resolve("err");
      } else {
        resolve(data);
      }
    });
  });
};

const getListFile = async (path) => {
  return new Promise((resolve, reject) => {
    fs.readdir(process.cwd() + "/" + path, (err, files) => {
      if (err) {
        resolve([]);
      } else {
        let dataBack = [];
        files.forEach((file) => {
          // dataBack.push(file);
          dataBack.push(path + "/" + file);
        });
        resolve(dataBack);
      }
    });
  });
};

const removeBadWords = (str, badWords) => {
  let sentences;
  try {
    let cWords = " " + badWords;
    cWords = cWords.split(",");
    let rgx = new RegExp(cWords.join(" | "), "gi");
    sentences = str.replace(rgx, " ");
    sentences = sentences.replace(/\s+/g, " ");
  } catch (e) {}

  return new Promise((resolve, reject) => {
    resolve(sentences);
  });
};

const validStr = (str) => {
  return new Promise((resolve, reject) => {
    if (str.indexOf("&fbclid") > 0) {
      resolve(validStrSpace(str.split("&fbclid")[0]));
    } else {
      resolve(validStrSpace(str));
    }
  });
};

const validStrSpace = (str) => {
  str = str.toLowerCase();
  str = str.replace(/-/g, " ");
  str = str.replace(/\s+/g, " ");
  return limitWords(str, 7);
};

const limitWords = (str, int) => {
  str = str.split(" ");
  if (str.length <= int) {
    return str.join(" ");
  } else {
    let res = [];
    for (let i = 0; i < int; i++) {
      res.push(str[i]);
    }
    return res.join(" ");
  }
};

module.exports = {
  curlContent,
  sleep,
  ucwords,
  getFile,
  getListFile,
  removeBadWords,
  validStr,
};
