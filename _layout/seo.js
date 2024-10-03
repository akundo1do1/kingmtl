const Seo = (config) => {
  let title = "";
  let keyword = "";
  if (config.typePage === "homepage" || config.typePage === "page") {
    keyword = config.keywords;
    if (config.titlePage == "") {
      if (config.tagline == "") {
        title = config.title;
      } else {
        title = config.title + " - " + config.tagline;
      }
    } else {
      title = config.titlePage + " - " + config.title;
    }
  } else {
    config.description = config.desc;
    keyword = config.titlePage.toLowerCase();
    keyword = keyword + ", " + keyword.replace(/\s/g, ", ");
    title = config.titlePage + " - " + config.title;
  }

  return `<title>${title}</title>
<meta name="description" content="${config.description}" />
<meta name="keywords" content="${keyword}" />
<meta name="author" content="${config.author}">
<meta property="og:type" content="${config.type}" />
<meta property="article:author" content="${config.author}"> 
<meta property="og:site_name" content="${config.title}" />
<meta property="og:title" content="${title}" />
<meta property="og:image" content="${config.image}" />
<meta property="og:description" content="${config.description}" />
<meta property="og:url" content="${config.fullUrl}" />
<meta name="twitter:card" content="summary_large_image" />`;
};

module.exports = Seo;
