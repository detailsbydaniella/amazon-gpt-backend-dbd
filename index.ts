import express from "express";
import axios from "axios";
import crypto from "crypto";
import qs from "querystring";

const app = express();
const PORT = process.env.PORT || 3000;

const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY!;
const SECRET_KEY = process.env.AMAZON_SECRET_KEY!;
const ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG!;

app.get("/", (req, res) => {
  res.send("Amazon GPT backend with real products is running.");
});

app.get("/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Missing search query (?q=...)" });
  }

  try {
    const endpoint = "webservices.amazon.com";
    const uri = "/paapi5/searchitems";
    const payload = {
      Keywords: query,
      SearchIndex: "All",
      Resources: [
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "Images.Primary.Medium",
      ],
      PartnerTag: ASSOCIATE_TAG,
      PartnerType: "Associates",
      Marketplace: "www.amazon.com",
    };

    const jsonPayload = JSON.stringify(payload);
    const currentTimestamp = new Date().toISOString();
    const headers = {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      host: endpoint,
      "x-amz-date": currentTimestamp,
      "x-amz-target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
    };

    // Create canonical request
    const canonicalHeaders = `content-encoding:${headers["content-encoding"]}\ncontent-type:${headers["content-type"]}\nhost:${headers["host"]}\nx-amz-date:${headers["x-amz-date"]}\nx-amz-target:${headers["x-amz-target"]}\n`;
    const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
    const hashedPayload = crypto.createHash("sha256").update(jsonPayload).digest("hex");

    const canonicalRequest = `POST\n${uri}\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;

    // Create string to sign
    const date = currentTimestamp.slice(0, 8);
    const region = "us-east-1";
    const service = "ProductAdvertisingAPI";
    const credentialScope = `${date}/${region}/${service}/aws4_request`;

    const stringToSign = `AWS4-HMAC-SHA256\n${currentTimestamp}\n${credentialScope}\n${crypto
      .createHash("sha256")
      .update(canonicalRequest)
      .digest("hex")}`;

    // Generate signing key
    const kDate = crypto
      .createHmac("sha256", "AWS4" + SECRET_KEY)
      .update(date)
      .digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
    const kService = crypto.createHmac("sha256", kRegion).update(service).digest();
    const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();

    // Sign the string
    const signature = crypto
      .createHmac("sha256", kSigning)
      .update(stringToSign)
      .digest("hex");

    // Build authorization header
    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await axios.post(`https://${endpoint}${uri}`, jsonPayload, {
      headers: {
        ...headers,
        Authorization: authorizationHeader,
      },
    });

    const items = response.data.SearchResult?.Items || [];
    const results = items.slice(0, 5).map((item: any) => ({
      title: item.ItemInfo?.Title?.DisplayValue,
      price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
      image: item.Images?.Primary?.Medium?.URL,
      url: item.DetailPageURL,
    }));

    res.json({ query, results });
  } catch (err: any) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch products from Amazon." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
