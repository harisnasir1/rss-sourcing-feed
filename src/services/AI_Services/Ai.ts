

import Groq from "groq-sdk";
import { jsonrepair } from 'jsonrepair';
import { ListingGender,ListingCondition, AI_Response } from "../../types/Data_types";
import OpenAI from "openai";
export class AI {
  private api_key: string;
  private apiUrl: string = "https://api.x.ai/v1/chat/completions";
  private  openai : OpenAI;

  private groq;
  constructor() {
    this.api_key = process.env.GROQ_API_KEY || "";
    this.openai=new OpenAI({apiKey:process.env.GPT_API_KEY})||""
    if (!this.api_key) {
      console.warn("Warning: Grok API key not found in environment variables");
    }
    this.groq= new Groq({ apiKey:this.api_key });
  }

  async extractProductInfo(description: string,imgs:string[]):Promise<AI_Response> {
    try {
      console.log("image ai main get",imgs)
      const chatCompletion = await this.getGroqChatCompletion(description);
      const content =chatCompletion.choices[0]?.message?.content;
      console.log("ai response=>",content)
    if(!content)  throw new Error("data coming from ai is wrong!") 
    
    let cleaned =jsonrepair(content)     
    const parsed = JSON.parse(cleaned)
    let hai=null
    if( !parsed||parsed?.brand==""||parsed.productType=="")
    {
        console.log("calling image ai as backup")
        hai= await this.getopenaicompletion(imgs[0])
        console.log("backup ai response= ",hai)
    }
    
  
  return {
    price: parsed.price ?? 0,
    brand: parsed.brand ??hai?.brand?? "",
    productType: parsed.productType??hai?.product ?? "",
    gender: parsed.gender ?? "unisex",
    size: parsed.size ?? "",
    condition: parsed.condition ?? "new",
    iswtb:parsed.iswtb??false,
    iswts:parsed.iswts??true
  };

    } catch (error) {
      console.error("Error extracting product info:", error);
      // Return default values on error
      return {
        price: 0,
        brand: "",
        productType: "",
        gender: "unisex",
        size: "",
        condition: "new",
        iswtb:false,
        iswts:true
      };
    }
  }
  
  private  getGroqChatCompletion(message:string) {

  return this.groq.chat.completions.create({

    model: "moonshotai/kimi-k2-instruct-0905",
              messages: [
            {
                 role: "system",
    content: `You are a product information extraction assistant for a resale marketplace.

             Your job is to extract structured product details from text descriptions and return a **strict JSON object only** — with no extra characters, explanations, or markdown.
             
             ---
             
             **Product Details to Extract:**
             - price: Extract the numeric value only. Detect currency symbols (£, $, €, ₹) or keywords like "price" or "cost". If no price is found, return 0.
             - brand: Brand name (Nike, Adidas, Dior, Gucci, Supreme, etc.). Return an empty string if not found.
             - productType: Product type (e.g., sneakers, hoodie, jeans, bag). Common categories:
               * Footwear: "sneakers", "trainers", "shoes", "boots", "slides"
               * Clothing: "shirt", "t-shirt", "hoodie", "jacket", "jeans", "pants", "shorts"
               * Accessories: "bag", "backpack", "watch", "hat", "belt"
               * Luxury: "handbag", "wallet", "sunglasses"
             - gender: Target gender — one of "men", "women", "unisex", or "kids".
             - size: Extract UK/EU/US shoe or clothing sizes (e.g., 9, 10, 42, S, M, L, XL, etc.)
             - condition: Product condition — one of:
               * "new" - brand new, unworn, with tags/box
               * "like new" - barely used, perfect condition
               * "used" - worn but good condition
               * "fair" - signs of wear
               * "poor" - heavy wear
             
             ---
             
             **Intent Detection (Critical):**
             - iswtb: true ONLY if the person is looking to BUY. Trigger phrases include:
               * "WTB" (want to buy)
               * "want to buy", "wanted to buy"
               * "looking for", "searching for"
               * "ISO" (in search of)
               * "anyone have", "does anyone have"
               * "anybody selling"
               * "need to buy"
             - iswts: true ONLY if the person is looking to SELL. Trigger phrases include:
               * "WTS" (want to sell)
               * "want to sell", "selling"
               * "for sale"
               * "available", "in stock"
               * "selling this"
               * "DM to buy", "message to purchase"
               * presence of a price
             
             ---
             
             **Important Rules:**
             1. A post can ONLY be WTB OR WTS, never both.
             2. If unclear, and a price exists → assume WTS.
             3. If asking questions about availability → assume WTB.
             4. If neither intent is clear → set both to false.
             5. The JSON format must be exact — no markdown, no explanation, no text before or after.
             
             ---
             
             **Return JSON format (exactly this structure):**
             {
               "price": number,
               "brand": string,
               "productType": string,
               "gender": string,
               "size": string,
               "condition": string,
               "iswtb": boolean,
               "iswts": boolean
             }
             
             ---
             
             **Defaults if unknown:**
             - price: 0  
             - brand: ""  
             - productType: ""  
             - gender: "unisex"  
             - size: ""  
             - condition: "new"  
             - iswtb: false  
             - iswts: false  
             
             Return ONLY the JSON. No explanations, no markdown, no commentary.
             
                     `
                 },
                 {
                   role: "user",
                   content: message
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "product_extraction",
              description:"extract information from product description",
              strict: true,
              schema: {
                type: "object",
                properties: {
               price: {
                    type: "number",
                    description: "The price of the product as a number"
                  },
                  brand: {
                    type: "string",
                    description: "The brand or manufacturer name"
                  },
                  productType: {
                    type: "string",
                    description: "The type of product (e.g., shoes, shirt, jeans)"
                  },
                  gender: {
                    type: "string",
                    description: "Target gender: men, women, unisex, or kids",
                    enum: ["men", "women", "unisex", "kids"]
                  },
                  size: {
                    type: "string",
                    description: "The size of the product"
                  },
                  condition: {
                    type: "string",
                    description: "The condition of the product",
                    enum: ["new", "used", "like_new"]
                  },
                  iswtb: {
                    type: "boolean",
                    description: "true if text contains product details and phrases like wtb or want to buy"
                  },
                  iswts: {
                    type: "boolean",
                    description: "true if text contains product details and phrases like wts or want to sell"
                  }
                },
                required: ["price", "brand", "productType", "gender", "size", "condition","iswtb","iswts"],
                additionalProperties: false
              }
            }
          }

  });

}

private async getopenaicompletion(img:string){

  console.log("image openai get",img)
const response = await this.openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
        {
            role: "user",
            content: [
                { 
                    type: "text", 
                    text: "Analyze this product image and identify the brand, category, and product type." 
                },
                {
                    type: "image_url",
                    image_url: {
                        url:  img
                    }
                }
            ]
        }
    ],
    functions: [
        {
            name: "identify_product",
            description: "Identify product brand and details from image. if you failed to generate the brand or product just generate empty strings",
            parameters: {
                type: "object",
                properties: {
                    brand: {
                        type: "string",
                        description: "The brand name of the product"
                    },
                    product: {
                        type: "string",
                        description: "Specific product type"
                    }
                },
                required: ["brand", "product"]
            }
        }
    ],
    function_call: { name: "identify_product" }
});
  console.log("gpt res =>",response)
  if (!response?.choices?.[0]?.message?.function_call?.arguments) {
    console.log("⚠️ No function_call arguments from OpenAI — returning defaults.");
    return { brand: "", product: "" };
  }

const res = jsonrepair(response.choices[0].message.function_call.arguments);
  console.log("after json repair",jsonrepair)
  let result: { brand: string; product: string };
  try {
    result = JSON.parse(res);
    console.log("after parsing the result",result)
  } catch (err) {
    console.log("Error parsing function_call arguments:", err);
    result = { brand: "", product: "" };
  }

  console.log("result sending back", result)
  return result;
}

}
