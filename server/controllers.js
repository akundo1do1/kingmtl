const appConfig = require("../appConfig");
const Layout = require("../_layout/layout");
const { getFile, validStr, ucwords, removeBadWords } = require("./utils");
const { getImages, getSentences } = require("./scraper");

const Feed = async (req, res) => {
  let proto = req.headers["x-forwarded-proto"];
  if (proto) {
    proto = proto;
  } else {
    proto = "http";
  }
  let originUrl = proto + "://" + req.headers.host;

  let listKw = await getFile("keywords.txt");
  listKw = listKw.split("\n");
  let kw = [];
  listKw.forEach((e) => {
    kw.push(e.replace(/\s+?$/, ""));
  });

  res.header("Content-Type", "application/xml; charset=ISO-8859-1");
  res.write(
    '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:sy="http://purl.org/rss/1.0/modules/syndication/" xmlns:slash="http://purl.org/rss/1.0/modules/slash/">\n'
  );
  res.write("<channel>\n");
  res.write(`\t<title><![CDATA[${appConfig["title"]}]]></title>
\t<atom:link href="${originUrl}/feed" rel="self" type="application/rss+xml" />
\t<link>${originUrl}/</link>
\t<description><![CDATA[${appConfig["description"]}]]></description>
\t<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
\t<language>en-US</language>
\t<sy:updatePeriod>hourly</sy:updatePeriod>
\t<sy:updateFrequency>1</sy:updateFrequency>
\t<generator><![CDATA[${appConfig["title"]}]]></generator>\n`);

  let time = new Date().getTime();
  for (let i in kw) {
    time = time - 60000 * 10;
    let pubDate = new Date(time).toUTCString();
    res.write(`\t<item>
\t\t<title><![CDATA[${ucwords(kw[i])}]]></title>
\t\t<description><![CDATA[Read Or Download ${ucwords(kw[i])} at ${
      appConfig["title"]
    }]]></description>
\t\t<link><![CDATA[${originUrl}/${kw[i].replace(/\s+/g, " ").replace(/\s/g, "-")}/]]></link>
\t\t<pubDate>${pubDate}</pubDate>
\t</item>\n`);
  }

  res.write("</channel>\n</rss>");
  res.send();
};

const SitemapXML = async (req, res) => {
  let proto = req.headers["x-forwarded-proto"];
  if (proto) {
    proto = proto;
  } else {
    proto = "http";
  }
  let originUrl = proto + "://" + req.headers.host;

  let listKw = await getFile("keywords.txt");
  listKw = listKw.split("\n");
  let kw = [];
  listKw.forEach((e) => {
    kw.push(e.replace(/\s+?$/, ""));
  });

  let time = new Date().getTime();

  res.header("Content-Type", "text/xml");
  res.write(
    `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="${originUrl}/main-sitemap.xsl"?>\n`
  );
  res.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
  res.write(
    `\t<url>\n\t\t<loc><![CDATA[${originUrl}/]]></loc>\n\t\t<lastmod><![CDATA[${new Date(
      time
    ).toISOString()}]]></lastmod>\n\t</url>\n`
  );

  for (let i in kw) {
    time = time - 60000 * 10;
    if(kw[i] != '') {
      res.write(
      `\t<url>\n\t\t<loc><![CDATA[${originUrl}/${kw[i]
        .replace(/\s+/g, " ")
        .replace(/\s/g, "-")}/]]></loc>\n\t\t<lastmod><![CDATA[${new Date(
        time
        ).toISOString()}]]></lastmod>\n\t</url>\n`
      );
    }
  }

  res.write("</urlset>");
  res.send();
};

const Pagination = async (req, res) => {
  let proto = req.headers["x-forwarded-proto"];
  if (proto) {
    proto = proto;
  } else {
    proto = "http";
  }
  let originUrl = proto + "://" + req.headers.host;
  let fullUrl = originUrl + req.url;

  let listKw = await getFile("keywords.txt");
  listKw = listKw.split("\n");
  let kw = [];
  listKw.forEach((e) => {
    kw.push(e.replace(/\s+?$/, ""));
  });
  let id = req.params.id;
  if (id == 0) {
    res.redirect("/");
  } else {
    let start = parseInt(id) * 10;
    let end = start + 10;
    let data = [];
    for (let i = start; i < end; i++) {
      if (kw[i] != undefined) {
        data.push(kw[i]);
      }
    }

    if (data == "") {
      let html = await getFile("404.html");
      html = html.replace("[FAVICON]", appConfig["favicon"]);
      res.status(404);
      res.write(html);
      res.send();
    } else {
      appConfig["typePage"] = "homepage";
      appConfig["type"] = "website";
      appConfig["titlePage"] = "Page " + id;
      appConfig["kw"] = kw;
      appConfig["dataKw"] = data;
      appConfig["currentPage"] = id;
      appConfig["prevPage"] = parseInt(id) - 1;
      appConfig["nextPage"] = parseInt(id) + 1;
      appConfig["image"] = appConfig["favicon"];
      appConfig["baseUrl"] = originUrl;
      appConfig["fullUrl"] = fullUrl;
      res.type("html");
      res.write(await Layout(appConfig));
    }
    res.send();
  }
};

const Homepage = async (req, res) => {
  let proto = req.headers["x-forwarded-proto"];
  if (proto) {
    proto = proto;
  } else {
    proto = "http";
  }
  let originUrl = proto + "://" + req.headers.host;
  let fullUrl = originUrl + req.url;

  let listKw = await getFile("keywords.txt");
  listKw = listKw.split("\n");
  let kw = [];
  listKw.forEach((e) => {
    kw.push(e.replace(/\s+?$/, ""));
  });
  appConfig["typePage"] = "homepage";
  appConfig["type"] = "website";
  appConfig["titlePage"] = "";
  appConfig["kw"] = kw;
  appConfig["dataKw"] = kw;
  appConfig["currentPage"] = "";
  appConfig["prevPage"] = "";
  appConfig["nextPage"] = 1;
  appConfig["image"] = appConfig["favicon"];
  appConfig["baseUrl"] = originUrl;
  appConfig["fullUrl"] = fullUrl;

  res.type("html");
  res.write(await Layout(appConfig));
  res.send();
};

const Robots = async (req, res) => {
  let file = await getFile("robots.txt");
  res.header("Content-Type", "text/plain");
  if (file == "err") {
    res.write("User-Agent: *\nDisallow:");
    res.send();
  } else {
    res.write(file);
    res.send();
  }
};
const ads = async (req, res) => {
  let file = await getFile("ads.txt");
  res.header("Content-Type", "text/plain");
  if (file == "err") {
    res.write("google.com");
    res.send();
  } else {
    res.write(file);
    res.send();
  }
};

const PlaceHolder = (req, res) => {
  res.header("Content-Type", "image/svg+xml");
  res.write(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" version="1.1" viewBox="0 0 720 380">
  <metadata>
   <rdf:RDF>
    <cc:Work rdf:about="">
     <dc:format>image/svg+xml</dc:format>
     <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
     <dc:title/>
    </cc:Work>
   </rdf:RDF>
  </metadata>
  <g transform="translate(0 -672.36)">
   <g transform="translate(-12.857 661.32)">
    <rect x="12.857" y="11.038" width="720" height="380" fill="#f2f2f2"/>
    <path d="m406.45 171.65h-67.181c-2.322 0-4.1988 1.8769-4.1988 4.1988v50.386c0 2.3178 1.8769 4.1988 4.1988 4.1988h67.181c2.322 0 4.1988-1.8811 4.1988-4.1988v-50.386c0-2.3178-1.8769-4.1988-4.1988-4.1988zm-19.944 14.696c2.8972 0 5.2485 2.3513 5.2485 5.2485s-2.3513 5.2485-5.2485 5.2485-5.2485-2.3513-5.2485-5.2485 2.3513-5.2485 5.2485-5.2485zm-38.839 31.491 13.915-31.991 15.825 25.621 13.566-6.7391 7.0792 13.109h-50.386z" fill="#ccc"/>
    <text x="330.2663" y="265.41037" fill="#cccccc" font-family="sans-serif" font-size="21.695px" letter-spacing="0px" stroke-width=".54238" word-spacing="0px" style="line-height:1.25" xml:space="preserve"><tspan x="330.2663" y="265.41037" fill="#cccccc" font-family="Lato" stroke-width=".54238">Loading..</tspan></text>
   </g>
  </g>
 </svg>`);
  res.send();
};

const PostApi = async (req, res) => {
  let query = req.params.query;
  query = await validStr(query);
  try {
    let img = await getImages(query);
    res.send(img[0]["thumbnail"]);
  } catch (e) {}
};

const Post = async (req, res) => {
  let proto = req.headers["x-forwarded-proto"];
  if (proto) {
    proto = proto;
  } else {
    proto = "http";
  }
  let originUrl = proto + "://" + req.headers.host;
  let fullUrl = originUrl + req.url;

  let listKw = await getFile("keywords.txt");
  listKw = listKw.split("\n");
  let kw = [];
  listKw.forEach((e) => {
    kw.push(e.replace(/\s+?$/, ""));
  });
  let oriQuery = req.params.query;
  oriQuery = decodeURIComponent(oriQuery);
  oriQuery = oriQuery.replace(/-+/g, "-").replace(/-/g, " ");
  let query = req.params.query;
  query = decodeURIComponent(query);
  query = await validStr(query);
  try {
    let img = await getImages(query);
    let text = await getSentences(query);
    appConfig["typePage"] = "post";
    appConfig["type"] = "article";
    appConfig["desc"] = await removeBadWords(
      text[0].replace(/<b>/g, "").replace(/<\/b>/g, ""),
      appConfig["removeBadWords"]
    );
    appConfig["image"] = img[Math.floor(Math.random() * img.length)]["image"];
    appConfig["kw"] = kw;
    appConfig["img"] = img;
    appConfig["text"] = text;
    appConfig["titlePage"] = ucwords(oriQuery);
    appConfig["baseUrl"] = originUrl;
    appConfig["fullUrl"] = fullUrl;

    res.type("html");
    res.write(await Layout(appConfig));
    res.send();
  } catch (e) {}
};

const err404 = async (req, res) => {
  let html = await getFile("404.html");
  html = html.replace("[FAVICON]", appConfig["favicon"]);
  res.status(404);
  res.write(html);
  res.send();
};

const Contact = async (req, res) => {
  let proto = req.headers["x-forwarded-proto"];
  if (proto) {
    proto = proto;
  } else {
    proto = "http";
  }
  let originUrl = proto + "://" + req.headers.host;
  let fullUrl = originUrl + req.url;

  let listKw = await getFile("keywords.txt");
  listKw = listKw.split("\n");
  let kw = [];
  listKw.forEach((e) => {
    kw.push(e.replace(/\s+?$/, ""));
  });
  appConfig["typePage"] = "page";
  appConfig["type"] = "website";
  appConfig["titlePage"] = "Contact Us";
  appConfig["kw"] = kw;
  appConfig["dataKw"] = kw;
  appConfig["currentPage"] = "";
  appConfig["prevPage"] = "";
  appConfig["nextPage"] = 1;
  appConfig["image"] = appConfig["favicon"];
  appConfig["baseUrl"] = originUrl;
  appConfig["fullUrl"] = fullUrl;
  appConfig[
    "contents"
  ] = `<p style="text-align: justify;">Have any question, comment, suggestion or news tip to pass along to this site?</p>
  <br>
  <p style="text-align: justify;">We are open to discuss all of the possibilities with you. This page offering the right way to sent any comments to this site admin related to your feedback, news coverage and other issues related to this site.</p>
  <br>
  <p style="text-align: left;">We are happy to hear information from you please write a subject format: </p><br>
  <ul style="text-align: left;">
      <li><strong>Claim Picture</strong> [picture name] [url to real picture] : if you are the real owner to claim your picture and need back links.</li>
      <li><strong>Submit Wallpapers</strong> [wallpaper name] : if you wanna submit your or your wallpaper design to us.</li>
      <li><strong>Advertise</strong> : if you interested to advertising on our site.</li>
      <li><strong>Support</strong> : if you need our support.</li>
  </ul>
  <br>
  <p style="text-align: left;">And send all your inquiries to our official mail at admin@${req.headers.host}</p>
  <br>
  <p style="text-align: justify;">Don't hesitate to contact us according your concerns and don't worry, all of your comment are welcome. :) </p>
  <br>
  <p style="text-align: justify;">Thank you.</p>`;

  res.type("html");
  res.write(await Layout(appConfig));
  res.send();
};

const Copyright = async (req, res) => {
  let proto = req.headers["x-forwarded-proto"];
  if (proto) {
    proto = proto;
  } else {
    proto = "http";
  }
  let originUrl = proto + "://" + req.headers.host;
  let fullUrl = originUrl + req.url;

  let listKw = await getFile("keywords.txt");
  listKw = listKw.split("\n");
  let kw = [];
  listKw.forEach((e) => {
    kw.push(e.replace(/\s+?$/, ""));
  });
  appConfig["typePage"] = "page";
  appConfig["type"] = "website";
  appConfig["titlePage"] = "Copyright";
  appConfig["kw"] = kw;
  appConfig["dataKw"] = kw;
  appConfig["currentPage"] = "";
  appConfig["prevPage"] = "";
  appConfig["nextPage"] = 1;
  appConfig["image"] = appConfig["favicon"];
  appConfig["baseUrl"] = originUrl;
  appConfig["fullUrl"] = fullUrl;
  appConfig[
    "contents"
  ] = `<p style="text-align: justify;"><strong>Digital Millennium Copyright Act Notification Guidelines</strong></p>
  <br>
  <p style="text-align: justify;">All images displayed on this site are copyrighted to their respective owners/uploaders. <strong>${req.headers.host}</strong>&nbsp;policy is to remove all images that violate copyrights. Please&nbsp;<a href="/p/contact/">contact us</a>&nbsp;to request that images be removed or to assign proper credit. The images displayed on this site may be used for Free or educational purposes only. If you would like to use any of the images displayed on this site for any other purpose, please obtain permission from the owner. <strong>${req.headers.host}</strong>&nbsp;does not have the rights to give you such permission. By submitting Picture(s)to <strong>${req.headers.host}</strong>&nbsp;you agree that you have permission from the owner to use his/her picture(s) in your picture(s), or you own the rights yourself to the picture(s) that is(are) used in the picture(s)/photo(s) you submit. All images in this site are taken from public forum and user submit.</p>
  <p>“ Disclaimer : this site&nbsp;consists of a compilation of public information available on the internet. The Photo file [TITLE] Collected from multiple source in internet. We are NOT affiliated with the publisher of this part, and we take no responsibility for material inside this part. ”</p>
  <p style="text-align: justify;">It is our policy to respond to clear notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act. In addition, we will promptly terminate without notice the accounts of those determined by us to be “repeat infringers”. this site&nbsp;will respond expeditiously to claims of copyright infringement that are reported to this site.</p>
  <p style="text-align: justify;">If you are a copyright owner, or are authorized to act on behalf of an owner of the copyright or of any exclusive right under the copyright, and believe that your work has been copied in a way that constitutes copyright infringement, please report your notice of infringement to this site&nbsp;by providing all the necessary information through the&nbsp;<a href="/p/contact/">Contact Page</a>.</p>`;

  res.type("html");
  res.write(await Layout(appConfig));
  res.send();
};

const Dmca = async (req, res) => {
  let proto = req.headers["x-forwarded-proto"];
  if (proto) {
    proto = proto;
  } else {
    proto = "http";
  }
  let originUrl = proto + "://" + req.headers.host;
  let fullUrl = originUrl + req.url;

  let listKw = await getFile("keywords.txt");
  listKw = listKw.split("\n");
  let kw = [];
  listKw.forEach((e) => {
    kw.push(e.replace(/\s+?$/, ""));
  });
  appConfig["typePage"] = "page";
  appConfig["type"] = "website";
  appConfig["titlePage"] = "DMCA";
  appConfig["kw"] = kw;
  appConfig["dataKw"] = kw;
  appConfig["currentPage"] = "";
  appConfig["prevPage"] = "";
  appConfig["nextPage"] = 1;
  appConfig["image"] = appConfig["favicon"];
  appConfig["baseUrl"] = originUrl;
  appConfig["fullUrl"] = fullUrl;
  appConfig[
    "contents"
  ] = `<p style="text-align: justify;"><strong>Notification of Copyright Infringement</strong></p>
  
  <p style="text-align: justify;">We respect the intellectual property rights of others and expects our users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at <a title="DMCA" href="http://www.copyright.gov/legislation/dmca.pdf">www.copyright.gov/legislation/dmca.pdf</a>, we will respond expeditiously to claims of copyright infringement committed using our service that are reported to our Designated Copyright Agent identified in the sample notice below.</p>
  
  <p style="text-align: justify;">If you are a copyright owner, or are authorized to act on behalf of one or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the site and service (collectively the “Service”) by completing the following DMCA Notice of Alleged Infringement and delivering it to our Designated Copyright Agent.</p>
  
  <p style="text-align: justify;">Upon receipt of Notice as described below, our Designated Copyright Agent will take whatever action, in its sole discretion, it deems appropriate, including removal of the challenged use from the Service and/or termination of the user’s account in appropriate circumstances.</p>
  
  <p style="text-align: justify;"><strong>DMCA Notice of Alleged Infringement (“Notice”)</strong></p>
  <ul style="text-align: justify;">
      <li>Identify the copyrighted work that you claim has been infringed, or – if multiple copyrighted works are covered by this Notice – you may provide a representative list of the copyrighted works that you claim have been infringed.</li>
      <li>Identify the material or link you claim is infringing (or the subject of infringing activity) and that access to which is to be disabled, including at a minimum, if applicable, the URL of the link shown on the Service where such material may be found.</li>
      <li>Provide your mailing address, telephone number, and, if available, email address.</li>
      <li>Include both of the following statements in the body of the Notice:
          <ul>
              <li>“I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use).”</li>
              <li>“I hereby state that the information in this Notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed.”</li>
          </ul>
      </li>
      <li>Provide your full legal name and your electronic or physical signature.</li>
  </ul>
  
  <p style="text-align: justify;">Deliver this Notice, with all items completed, to our Designated Copyright Agent: Copyright Agent this site DMCA Division.</p>
  <p style="text-align: justify;"><strong>Counter Notices</strong><br/>One who has posted material that allegedly infringes a copyright may send our Designated Copyright Agent a counter notice pursuant to Sections 512(g)(2) and 512(g)(3) of the DMCA. When our Designated Copyright Agent receives a counter notice, it may in its discretion reinstate the material in question in not less than 10 nor more than 14 days after it receives the counter notice unless it first receive notice from the copyright claimant that they have filed a legal action to restrain the allegedly infringing activity.</p>
  
  <p style="text-align: justify;">To provide a counter notice to our Designated Copyright Agent, please return the following form to the Designated Copyright Agent. Please note that if you provide a counter notice, in accordance with the our Privacy Policy (located at the site) and the terms of the DMCA, the counter notice will be given to the complaining party.</p>
  
  <p style="text-align: justify;"><strong>COUNTER NOTICE</strong></p>
  <ul style="text-align: justify;">
      <li>Identification of the material that has been removed or to which access has been disabled on the service and the location at which the material appeared before it was removed or access to it was disabled:</li>
      <li>I hereby state under penalty of perjury that I have a good faith belief that the material was removed or disabled as a result of mistake or misidentification of the material to be removed or disabled.</li>
      <li>Your name, address, telephone number and, if available, email address:</li>
      <li>I hereby state that I consent to the jurisdiction of the Federal District Court for the judicial district in which my address is located or, if my address is outside of the United States, for any judicial district in which we may be found, and I will accept service of process from the complaining party who notified us of the alleged infringement or an agent of such person.</li>
      <li>Your physical or electronic signature (full legal name):____________________________</li>
  </ul>
  
  <p style="text-align: justify;">The Counter Notice should be delivered to our Designated Copyright Agent: Copyright Agent this site DMCA Division</p>
  <p style="text-align: justify;"><strong>Notification of Trademark Infringement</strong></p>
  
  <p style="text-align: justify;">If you believe that your trademark (the “Mark”) is being used by a user in a way that constitutes trademark infringement, please provide our Designated Copyright Agent (specified above) with the following information:</p>
  <ul style="text-align: justify;">
      <li>Your physical or electronic signature, or a physical or electronic signature of a person authorized to act on your behalf;</li>
      <li>Information reasonably sufficient to permit it to contact you or your authorized agent, including a name, address, telephone number and, if available, an email address;</li>
      <li>Identification of the Mark(s) alleged to have been infringed, including
          <ul>
              <li>for registered Marks, a copy of each relevant federal trademark registration certificate or</li>
              <li>for common law or other Marks, evidence sufficient to establish your claimed rights in the Mark, including the nature of your use of the Mark, and the time period and geographic area in which the Mark has been used by you;</li>
          </ul>
      </li>
      <li>Information reasonably sufficient to permit our Designated Copyright Agent to identify the use being challenged;</li>
      <li>A statement that you have not authorized the challenged use, and that you have a good-faith belief that the challenged use is not authorized by law; and</li>
      <li>A statement under penalty of perjury that all of the information in the notification is accurate and that you are the Mark owner, or are authorized to act on behalf of the Mark owner.</li>
  </ul>
  
  <p style="text-align: justify;">Upon receipt of notice as described above, our Designated Copyright Agent will seek to confirm the existence of the Mark on the Service, notify the registered user who posted the content including the Mark, and take whatever action, in its sole discretion, it deems appropriate, including temporary or permanent removal of the Mark from the Service.</p>
  
  <p style="text-align: justify;">A registered user may respond to notice of takedown by showing either (a) that the Mark has been cancelled, or has expired or lapsed or (b) that the registered user has a trademark registration, an unexpired license covering the use, or some other relevant right to the Mark, or (c) that the use is for other reasons shown by the registered user non-infringing. If the registered user makes an appropriate showing of either (a), (b) or (c) then our Designated Copyright Agent may exercise its discretion not to remove the Mark.</p>
  
  <p style="text-align: justify;">If our Designated Copyright Agent decides to comply with a takedown request, it will do so within a reasonably expeditious period of time. Notwithstanding the foregoing, our Designated Copyright Agent will comply as appropriate with the terms of any court order relating to alleged trademark infringement on the Service.</p>
  
  <p style="text-align: justify;"><strong>Notification of Other Intellectual Property (“IP”) Infringement</strong></p>
  
  <p style="text-align: justify;">If you believe that some other IP right of yours is being infringed by a user, please provide our Designated Copyright Agent (specified above) with the following information:</p>
  <ul style="text-align: justify;">
      <li>Your physical or electronic signature, or a physical or electronic signature of a person authorized to act on your behalf;</li>
      <li>Information reasonably sufficient to permit our Designated Copyright Agent to contact you or your authorized agent, including a name, address, telephone number and, if available, an email address;</li>
      <li>Identification of the IP alleged to have been infringed, including (i) a complete description or explanation of the nature of the IP, (ii) evidence that you own the IP in the relevant jurisdiction, including copies of relevant patents, registrations, certifications or other documentary evidence of your ownership, and (iii) a showing sufficient for our Designated Copyright Agent to determine without unreasonable effort that the IP has been infringed;</li>
      <li>Information reasonably sufficient to permit our Designated Copyright Agent to identify the use being challenged;</li>
      <li>A statement that you have not authorized the challenged use, and that you have a good-faith belief that the challenged use is not authorized by law; and</li>
      <li>A statement under penalty of perjury that all of the information in the notification is accurate and, that you are the IP owner, or are authorized to act on behalf of the IP owner.</li>
  </ul>
  
  <p style="text-align: justify;">Upon receipt of notice as described above, our Designated Copyright Agent will seek to confirm the existence of the IP on the Service, notify the registered user who posted the content including the IP, and take whatever action, in its sole discretion, it deems appropriate, including temporary or permanent removal of the IP from the Service.</p>
  
  <p style="text-align: justify;">A registered user may respond to notice of takedown by showing either (a) that the claimant does not own the IP or (b) that the IP is not infringed. If the registered user succeeds in showing either (a), (b) or (c) then our Designated Copyright Agent may exercise its discretion not to remove the IP.</p>
  
  <p style="text-align: justify;">If our Designated Copyright Agent decides to comply with a takedown request, it will do so within a reasonably expeditious period of time.</p>
  
  <p style="text-align: justify;">We Have No Obligation to Adjudicate IP Claims – User’s Agreement to Hold Us Harmless From Claims</p>
  
  <p style="text-align: justify;">Claimants and users must understand that we are not an intellectual property tribunal. While we and our Designated Copyright Agent may in our discretion use the information provided in order to decide how to respond to infringement claims, we are not responsible for determining the merits of such claims. If a user responds to a claim of infringement by providing assurances that its content is not infringing, the user agrees that if we thereafter restore or maintain the content, the user will defend and hold us harmless from any resulting claims of infringement brought against us and our Designated Copyright Agent.</p>`;

  res.type("html");
  res.write(await Layout(appConfig));
  res.send();
};

const Privacy = async (req, res) => {
  let proto = req.headers["x-forwarded-proto"];
  if (proto) {
    proto = proto;
  } else {
    proto = "http";
  }
  let originUrl = proto + "://" + req.headers.host;
  let fullUrl = originUrl + req.url;

  let listKw = await getFile("keywords.txt");
  listKw = listKw.split("\n");
  let kw = [];
  listKw.forEach((e) => {
    kw.push(e.replace(/\s+?$/, ""));
  });
  appConfig["typePage"] = "page";
  appConfig["type"] = "website";
  appConfig["titlePage"] = "Privacy Policy";
  appConfig["kw"] = kw;
  appConfig["dataKw"] = kw;
  appConfig["currentPage"] = "";
  appConfig["prevPage"] = "";
  appConfig["nextPage"] = 1;
  appConfig["image"] = appConfig["favicon"];
  appConfig["baseUrl"] = originUrl;
  appConfig["fullUrl"] = fullUrl;
  appConfig[
    "contents"
  ] = `<p style="text-align: justify;">The following is the privacy policy of google, so with that I will implement on my blog by e-mail address admin@${req.headers.host}.</p>
  
  <p style="text-align: justify;">Last modified: March 1, 2012 (<a href="http://www.google.com/policies/privacy/archive/" rel="nofollow">view archived versions</a>)</p>
  
  <p style="text-align: justify;">There are many different ways you can use our services – to search for and share information, to communicate with other people or to create new content. When you share information with us, for example by creating a&nbsp;<a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-account" rel="nofollow">Google Account</a>, we can make those services even better – to show you more relevant search results and ads, to help you connect with people or to make sharing with others quicker and easier. As you use our services, we want you to be clear how we’re using information and the ways in which you can protect your privacy.</p>
  
  <p>Our Privacy Policy explains: <br/>
  <ul>
      <li>What information we collect and why we collect it.</li>
      <li>How we use that information.</li>
      <li>The choices we offer, including how to access and update information.</li>
  </ul>
  </p>
  
  <p style="text-align: justify;">We’ve tried to keep it as simple as possible, but if you’re not familiar with terms like cookies, IP addresses, pixel tags and browsers, then read about these&nbsp;<a href="http://www.google.com/policies/privacy/key-terms/" rel="nofollow">key terms</a>&nbsp;first. Your privacy matters to Google so whether you are new to Google or a long-time user, please do take the time to get to know our practices – and if you have any questions&nbsp;<a href="http://www.google.com/support/websearch/bin/answer.py?answer=151265&amp;hl=en" rel="nofollow">contact us</a>.</p>
  <h3 id="infocollect" style="text-align: justify;">Information we collect</h3>
  
  <p style="text-align: justify;">We collect information to provide better services to all of our users – from figuring out basic stuff like which language you speak, to more complex things like which ads you’ll find most useful or the people who matter most to you online.</p>
  
  <p style="text-align: justify;">We collect information in two ways:</p>
  <ul style="text-align: justify;">
      <li>Information you give us.&nbsp;For example, many of our services require you to sign up for a Google Account. When you do, we’ll ask for&nbsp;<a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-personal-info" rel="nofollow">personal information</a>, like your name, email address, telephone number or credit card. If you want to take full advantage of the sharing features we offer, we might also ask you to create a publicly visible&nbsp;<a href="http://support.google.com/accounts/bin/answer.py?hl=en&amp;answer=112783" rel="nofollow">Google Profile</a>, which may include your name and photo.</li>
      <li>Information we get from your use of our services.&nbsp;We may collect information about the services that you use and how you use them, like when you visit a website that uses our advertising services or you view and interact with our ads and content. This information includes:
          <ul>
              <li>Device informationWe may collect device-specific information (such as your hardware model, operating system version, unique device identifiers, and mobile network information including phone number). Google may associate your device identifiers or phone number with your Google Account.</li>
              <li>Log informationWhen you use our services or view content provided by Google, we may automatically collect and store certain information in&nbsp;<a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-server-logs" rel="nofollow">server logs</a>. This may include:
                  <ul>
                      <li>details of how you used our service, such as your search queries.</li>
                      <li>telephony log information like your phone number, calling-party number, forwarding numbers, time and date of calls, duration of calls, SMS routing information and types of calls.</li>
                      <li><a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-ip" rel="nofollow">Internet protocol address</a>.</li>
                      <li>device event information such as crashes, system activity, hardware settings, browser type, browser language, the date and time of your request and referral URL.</li>
                      <li>cookies that may uniquely identify your browser or your Google Account.</li>
                  </ul>
              </li>
              <li>Location informationWhen you use a location-enabled Google service, we may collect and process information about your actual location, like GPS signals sent by a mobile device. We may also use various technologies to determine location, such as sensor data from your device that may, for example, provide information on nearby Wi-Fi access points and cell towers.</li>
              <li>Unique application numbersCertain services include a unique application number. This number and information about your installation (for example, the operating system type and application version number) may be sent to Google when you install or uninstall that service or when that service periodically contacts our servers, such as for automatic updates.</li>
              <li>Local storageWe may collect and store information (including personal information) locally on your device using mechanisms such as browser web storage (including HTML&nbsp;5) and application data caches.</li>
              <li>Cookies and anonymous identifiersWe use various technologies to collect and store information when you visit a Google service, and this may include sending one or more&nbsp;<a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-cookie" rel="nofollow">cookies</a>&nbsp;or&nbsp;<a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-identifier" rel="nofollow">anonymous identifiers</a>&nbsp;to your device. We also use cookies and anonymous identifiers when you interact with services we offer to our partners, such as advertising services or Google features that may appear on other sites.</li>
          </ul>
      </li>
  </ul>
  <h3 id="infouse" style="text-align: justify;">How we use information we collect</h3>
  
  <p style="text-align: justify;">We use the information we collect from all of our services to provide, maintain, protect and improve them, to develop new ones, and to protect Google and our users. We also use this information to offer you tailored content – like giving you more relevant search results and ads.</p>
  
  <p style="text-align: justify;">We may use the name you provide for your Google Profile across all of the services we offer that require a Google Account. In addition, we may replace past names associated with your Google Account so that you are represented consistently across all our services. If other users already have your email, or other information that identifies you, we may show them your publicly visible Google Profile information, such as your name and photo.</p>
  
  <p style="text-align: justify;">When you contact Google, we may keep a record of your communication to help solve any issues you might be facing. We may use your email address to inform you about our services, such as letting you know about upcoming changes or improvements.</p>
  
  <p style="text-align: justify;">We use information collected from cookies and other technologies, like&nbsp;<a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-pixel" rel="nofollow">pixel tags</a>, to improve your user experience and the overall quality of our services. For example, by saving your language preferences, we’ll be able to have our services appear in the language you prefer. When showing you tailored ads, we will not associate a cookie or anonymous identifier with sensitive categories, such as those based on race, religion, sexual orientation or health.</p>
  
  <p style="text-align: justify;">We may combine personal information from one service with information, including personal information, from other Google services – for example to make it easier to share things with people you know. We will not combine DoubleClick cookie information with personally identifiable information unless we have your opt-in consent.</p>
  
  <p style="text-align: justify;">We will ask for your consent before using information for a purpose other than those that are set out in this Privacy Policy.</p>
  
  <p style="text-align: justify;">Google processes personal information on our servers in many countries around the world. We may process your personal information on a server located outside the country where you live.</p>
  <h3 id="infochoices" style="text-align: justify;">Transparency and choice</h3>
  
  <p style="text-align: justify;">People have different privacy concerns. Our goal is to be clear about what information we collect, so that you can make meaningful choices about how it is used. For example, you can:</p>
  <ul style="text-align: justify;">
      <li><a href="https://www.google.com/dashboard/?hl=en" rel="nofollow">Review and control</a>&nbsp;certain types of information tied to your Google Account by using Google Dashboard.</li>
      <li><a href="https://www.google.com/settings/ads/preferences?hl=en" rel="nofollow">View and edit</a>&nbsp;your ads preferences, such as which categories might interest you, using the Ads Preferences Manager. You can also opt out of certain Google advertising services here.</li>
      <li><a href="http://support.google.com/accounts/bin/answer.py?hl=en&amp;answer=97706" rel="nofollow">Use our editor</a>&nbsp;to see and adjust how your Google Profile appears to particular individuals.</li>
      <li><a href="http://support.google.com/plus/bin/static.py?hl=en&amp;page=guide.cs&amp;guide=1257347" rel="nofollow">Control</a>&nbsp;who you share information with.</li>
      <li><a href="http://www.dataliberation.org/" rel="nofollow">Take information</a>&nbsp;out of many of our services.</li>
  </ul>
  
  <p style="text-align: justify;">You may also set your browser to block all cookies, including cookies associated with our services, or to indicate when a cookie is being set by us. However, it’s important to remember that many of our services may not function properly if your cookies are disabled. For example, we may not remember your language preferences.</p>
  <h3 id="infosharing" style="text-align: justify;">Information you share</h3>
  
  <p style="text-align: justify;">Many of our services let you share information with others. Remember that when you share information publicly, it may be indexable by search engines, including Google. Our services provide you with different options on sharing and removing your content.</p>
  <h3 id="access" style="text-align: justify;">Accessing and updating your personal information</h3>
  
  <p style="text-align: justify;">Whenever you use our services, we aim to provide you with access to your personal information. If that information is wrong, we strive to give you ways to update it quickly or to delete it – unless we have to keep that information for legitimate business or legal purposes. When updating your personal information, we may ask you to verify your identity before we can act on your request.</p>
  
  <p style="text-align: justify;">We may reject requests that are unreasonably repetitive, require disproportionate technical effort (for example, developing a new system or fundamentally changing an existing practice), risk the privacy of others, or would be extremely impractical (for instance, requests concerning information residing on backup tapes).</p>
  
  <p style="text-align: justify;">Where we can provide information access and correction, we will do so for free, except where it would require a disproportionate effort. We aim to maintain our services in a manner that protects information from accidental or malicious destruction. Because of this, after you delete information from our services, we may not immediately delete residual copies from our active servers and may not remove information from our backup systems.</p>
  <h3 id="nosharing" style="text-align: justify;">Information we share</h3>
  
  <p style="text-align: justify;">We do not share personal information with companies, organizations and individuals outside of Google unless one of the following circumstances apply:</p>
  <ul style="text-align: justify;">
      <li>With your consentWe will share personal information with companies, organizations or individuals outside of Google when we have your consent to do so. We require opt-in consent for the sharing of any&nbsp;<a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-sensitive-info" rel="nofollow">sensitive personal information</a>.</li>
      <li>With domain administratorsIf your Google Account is managed for you by a&nbsp;<a href="http://support.google.com/a/bin/answer.py?hl=en&amp;answer=178897" rel="nofollow">domain administrator</a>&nbsp;(for example, for Google Apps users) then your domain administrator and resellers who provide user support to your organization will have access to your Google Account information (including your email and other data). Your domain administrator may be able to:
          <ul>
              <li>view statistics regarding your account, like statistics regarding applications you install.</li>
              <li>change your account password.</li>
              <li>suspend or terminate your account access.</li>
              <li>access or retain information stored as part of your account.</li>
              <li>receive your account information in order to satisfy applicable law, regulation, legal process or enforceable governmental request.</li>
              <li>restrict your ability to delete or edit information or privacy settings.</li>
          </ul>
          <p>Please refer to your domain administrator’s privacy policy for more information.</p>
      </li>
      <li>For external processingWe provide personal information to our affiliates or other trusted businesses or persons to process it for us, based on our instructions and in compliance with our Privacy Policy and any other appropriate confidentiality and security measures.</li>
      <li>For legal reasonsWe will share personal information with companies, organizations or individuals outside of Google if we have a good-faith belief that access, use, preservation or disclosure of the information is reasonably necessary to:
          <ul>
              <li>meet any applicable law, regulation, legal process or enforceable governmental request.</li>
              <li>enforce applicable Terms of Service, including investigation of potential violations.</li>
              <li>detect, prevent, or otherwise address fraud, security or technical issues.</li>
              <li>protect against harm to the rights, property or safety of Google, our users or the public as required or permitted by law.</li>
          </ul>
      </li>
  </ul>
  
  <p style="text-align: justify;">We may share aggregated,&nbsp;<a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-info" rel="nofollow">non-personally identifiable information</a>&nbsp;publicly and with our partners – like publishers, advertisers or connected sites. For example, we may share information publicly to show trends about the general use of our services.</p>
  
  <p style="text-align: justify;">If Google is involved in a merger, acquisition or asset sale, we will continue to ensure the confidentiality of any personal information and give affected users notice before personal information is transferred or becomes subject to a different privacy policy.</p>
  <h3 id="infosecurity" style="text-align: justify;">Information security</h3>
  
  <p style="text-align: justify;">We work hard to protect Google and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold. In particular:</p>
  <ul style="text-align: justify;">
      <li>We encrypt many of our services&nbsp;<a href="http://support.google.com/websearch/bin/answer.py?answer=173733&amp;en">using SSL</a>.</li>
      <li>We offer you&nbsp;<a href="http://support.google.com/accounts/bin/static.py?hl=en&amp;page=guide.cs&amp;guide=1056283&amp;topic=1056284" rel="nofollow">two step verification</a>&nbsp;when you access your Google Account, and a&nbsp;<a href="http://www.google.com/chrome/intl/en/more/security.html" rel="nofollow">Safe Browsing feature</a>&nbsp;in Google Chrome.</li>
      <li>We review our information collection, storage and processing practices, including physical security measures, to guard against unauthorized access to systems.</li>
      <li>We restrict access to personal information to Google employees, contractors and agents who need to know that information in order to process it for us, and who are subject to strict contractual confidentiality obligations and may be disciplined or terminated if they fail to meet these obligations.</li>
  </ul>
  <h3 id="application" style="text-align: justify;">Application</h3>
  
  <p style="text-align: justify;">Our Privacy Policy applies to all of the services offered by Google Inc. and its affiliates, including services offered on other sites (such as our advertising services), but excludes services that have separate privacy policies that do not incorporate this Privacy Policy.</p>
  
  <p style="text-align: justify;">Our Privacy Policy does not apply to services offered by other companies or individuals, including products or sites that may be displayed to you in search results, sites that may include Google services, or other sites linked from our services. Our Privacy Policy does not cover the information practices of other companies and organizations who advertise our services, and who may use cookies, pixel tags and other technologies to serve and offer relevant ads.</p>
  <h3 id="enforcement" style="text-align: justify;">Enforcement</h3>
  
  <p style="text-align: justify;">We regularly review our compliance with our Privacy Policy. We also adhere to several&nbsp;<a href="http://www.google.com/policies/privacy/frameworks/" rel="nofollow">self regulatory frameworks</a>. When we receive formal written complaints, we will contact the person who made the complaint to follow up. We work with the appropriate regulatory authorities, including local data protection authorities, to resolve any complaints regarding the transfer of personal data that we cannot resolve with our users directly.</p>
  <h3 id="policychanges" style="text-align: justify;">Changes</h3>
  
  <p style="text-align: justify;">Our Privacy Policy may change from time to time. We will not reduce your rights under this Privacy Policy without your explicit consent. We will post any privacy policy changes on this page and, if the changes are significant, we will provide a more prominent notice (including, for certain services, email notification of privacy policy changes). We will also keep prior versions of this Privacy Policy in an archive for your review.</p>
  <h3 id="products" style="text-align: justify;">Specific product practices</h3>
  
  <p style="text-align: justify;">The following notices explain specific privacy practices with respect to certain Google products and services that you may use:</p>
  <ul style="text-align: justify;">
      <li><a href="http://www.google.com/chrome/intl/en/privacy.html" rel="nofollow">Chrome and Chrome OS</a></li>
      <li><a href="http://books.google.com/intl/en/googlebooks/privacy.html" rel="nofollow">Books</a></li>
      <li><a href="http://wallet.google.com/files/privacy.html?hl=en" rel="nofollow">Wallet</a></li>
  </ul>
  
  <p style="text-align: justify;">The contents of this statement may be altered at any time, at our discretion. If you have any questions regarding the privacy policy of&nbsp;this site&nbsp;then you may&nbsp;<a href="/p/contact/">contact us</a>.</p>`;

  res.type("html");
  res.write(await Layout(appConfig));
  res.send();
};

module.exports = {
  Pagination,
  Homepage,
  Robots,
  ads,
  PlaceHolder,
  PostApi,
  Post,
  err404,
  Contact,
  Copyright,
  Dmca,
  Privacy,
  Feed,
  SitemapXML,
};
