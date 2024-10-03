const { getFile } = require("../server/utils");
const Seo = require("./seo");

const Head = async (config) => {
  let injectHead = await getFile("inject_head.txt");
  let kw = config.keywords.split(",");
  let ldJson = "";
  if (config.typePage === "homepage") {
    ldJson = `
<script type="application/ld+json">
    {
        "@context": "http://schema.org",
        "@type": "WebSite",
        "name": "${config.title}",
        "headline": "${config.title} - ${config.tagline}",
        "alternativeHeadline": "${config.title}",
        "description": "${config.description}",
        "isFamilyFriendly": "true",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${config.baseUrl}/"
        },
        "author" : {
            "@type": "Person",
            "name": "${config.author}"
        },
        "creator" : {
            "@type": "Person",
            "name": "${config.author}"
        },
        "accountablePerson" : {
            "@type": "Person",
            "name": "${config.author}"
        },
        "copyrightHolder" : "${config.title}",
        "copyrightYear" : "${new Date().getFullYear()}",
        "dateCreated": "${new Date().toISOString()}",
        "datePublished": "${new Date().toISOString()}",
        "dateModified": "${new Date().toISOString()}",
        "publisher":{
            "@type":"Organization",
            "name": "${config.title}",
            "url": "${config.baseUrl}/",
            "logo": {
                "@type": "ImageObject",
                "url": "${config.favicon}",
                "width":"32",
                "height":"32"
            }
        },
        "image": "${config.image}",
        "url" : "${config.baseUrl}/",
        "keywords" : ${JSON.stringify(kw)}
    }
</script>`;
  }
  return `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
${Seo(config)}
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="googlebot-news" content="index,follow" />
<meta name="googlebot" content="index,follow" />
<link rel="canonical" href="${config.fullUrl}" />
<link rel="alternate" href="${
    config.baseUrl
  }/feed" type="application/rss+xml" title="${config.title} Feed" />
<link rel="icon" type="image/x-icon" href="${config.favicon}" />
<link rel="shortcut icon" type="image/x-icon" href="${config.favicon}" />
<link rel="preconnect" href="https://stackpath.bootstrapcdn.com" />
<link rel="dns-prefetch" href="https://stackpath.bootstrapcdn.com" />
<link rel="preconnect" href="https://code.jquery.com" />
<link rel="dns-prefetch" href="https://code.jquery.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="preload" as="style" href="https://fonts.googleapis.com/css?family=Lora:400,400i,700">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lora:400,400i,700" />
<link rel="stylesheet" href="/all.css" />
<link rel="stylesheet" href="/main.css" />
<link rel="stylesheet" href="/theme.css" />${ldJson}
${injectHead}`;
};

module.exports = Head;
