import express from "express";
import pkg from "paapi5-nodejs-sdk";
const { Configuration, DefaultApi } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

const config = new Configuration({
  accessKey: process.env.AMAZON_ACCESS_KEY!,
  secretKey: process.env.AMAZON_SECRET_KEY!,
  partnerTag: process.env.AMAZON_ASSOCIATE_TAG!,
  partnerType: "Associates",
  marketplace: "www.amazon.com"
});

const amazonApi = new DefaultApi(config);

app.get("/", (req, res) => {
  res.send("Amazon GPT backend using official SDK is running.");
});

app.get("/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Missing search query (?q=...)" });
  }

  try {
    const request = {
      keywords: query,
      resources: [
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "Images.Primary.Medium",
        "DetailPageURL"
      ],
      searchIndex: "All"
    };

    const response = await amazonApi.searchItems(request);

    const items = response?.searchResult?.items || [];

    const results = items.slice(0, 5).map((item: any) => ({
      title: item.itemInfo?.title?.displayValue,
      price: item.offers?.listings?.[0]?.price?.displayAmount,
      image: item.images?.primary?.medium?.url,
      url: item.detailPageURL
    }));

    res.json({ query, results });
  } catch (err: any) {
    console.error("Amazon API error:", err.message || err);
    res.status(500).json({
      error: "Failed to fetch products from Amazon.",
      details: err.message || err
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
