const BASE_URL = "https://filma365.me";

async function request(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": BASE_URL
    }
  });

  return await response.text();
}

function clean(text) {
  return text
    ?.replace(/<[^>]*>/g, "")
    ?.replace(/\s+/g, " ")
    ?.trim() || "";
}

function extractVideos(html) {
  const videos = [];

  const regex =
    /"label":"(.*?)".*?"source":"(.*?)"/g;

  let match;

  while ((match = regex.exec(html)) !== null) {
    videos.push({
      server: match[1],
      url: match[2].replace(/\\\//g, "/")
    });
  }

  return videos;
}

module.exports = {
  name: "FILMA365",
  baseUrl: BASE_URL,
  lang: "sq",
  type: "anime",

  async search(query) {
    const html = await request(
      `${BASE_URL}/browse?search=${encodeURIComponent(query)}`
    );

    const results = [];

    const regex =
      /href="(https:\/\/filma365\.me\/(?:movie|tv)\/.*?)".*?<img.*?src="(.*?)".*?alt="(.*?)"/gs;

    let match;

    while ((match = regex.exec(html)) !== null) {
      results.push({
        title: clean(match[3]),
        image: match[2],
        link: match[1]
      });
    }

    return results;
  },

  async latest(page) {
    const html = await request(
      `${BASE_URL}/movies?page=${page || 1}`
    );

    const results = [];

    const regex =
      /href="(https:\/\/filma365\.me\/(?:movie|tv)\/.*?)".*?<img.*?src="(.*?)".*?alt="(.*?)"/gs;

    let match;

    while ((match = regex.exec(html)) !== null) {
      results.push({
        title: clean(match[3]),
        image: match[2],
        link: match[1]
      });
    }

    return results;
  },

  async detail(url) {
    const html = await request(url);

    const title =
      clean(
        html.match(/<h1.*?>(.*?)<\/h1>/s)?.[1]
      ) || "Unknown";

    const image =
      html.match(/property="og:image".*?content="(.*?)"/)?.[1] ||
      "";

    const description =
      clean(
        html.match(/<p.*?>(.*?)<\/p>/s)?.[1]
      ) || "";

    const episodes = [];

    const episodeRegex =
      /href="(https:\/\/filma365\.me\/episode\/.*?)"/g;

    let ep;
    let index = 1;

    while ((ep = episodeRegex.exec(html)) !== null) {
      episodes.push({
        number: index,
        title: `Episode ${index}`,
        link: ep[1]
      });

      index++;
    }

    if (episodes.length === 0) {
      episodes.push({
        number: 1,
        title: "Movie",
        link: url
      });
    }

    return {
      title,
      image,
      description,
      episodes
    };
  },

  async watch(url) {
    const html = await request(url);

    const videos = extractVideos(html);

    return videos.map(video => ({
      url: video.url,
      quality: video.server
    }));
  }
};
