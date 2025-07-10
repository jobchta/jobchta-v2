import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { URL } from 'url';

export const dynamic = 'force-dynamic'

const PLATFORM_FOOTPRINTS = {
    "greenhouse": "boards.greenhouse.io",
    "lever": "jobs.lever.co",
    "workday": "myworkdayjobs.com",
};

async function fetchHtml(url: string): Promise<string | null> {
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    if (!scraperApiKey) return null;

    console.log(`  - Analyzing URL: ${url}`);
    const targetUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}`;
    try {
        const response = await axios.get(targetUrl, { timeout: 60000 });
        return response.data;
    } catch (error) {
        console.error(`  - Error fetching ${url}:`, error);
        return null;
    }
}

export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    console.log("--- Starting Discovery Bot Cron Job ---");

    try {
        const search_query = '"we are hiring" OR "careers" -site:linkedin.com -site:indeed.com';
        const google_url = `https://www.google.com/search?q=${encodeURIComponent(search_query)}`;

        console.log("🔎 Searching Google for new company career pages...");
        const googleHtml = await fetchHtml(google_url);
        if (!googleHtml) {
            throw new Error("Could not fetch Google search results.");
        }

        const $ = cheerio.load(googleHtml);
        const potentialUrls: string[] = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith("/url?q=")) {
                const urlParams = new URLSearchParams(href.substring(href.indexOf('?')));
                const actualUrl = urlParams.get('q');
                if (actualUrl && !Object.values(PLATFORM_FOOTPRINTS).some(p => actualUrl.includes(p))) {
                    potentialUrls.push(actualUrl);
                }
            }
        });

        const uniqueUrls = [...new Set(potentialUrls)];
        console.log(`Found ${uniqueUrls.length} potential pages to analyze.`);

        const newCompanies = [];
        for (const url of uniqueUrls) {
            const pageHtml = await fetchHtml(url);
            if (pageHtml) {
                const pageContentLower = pageHtml.toLowerCase();
                for (const [platform, footprint] of Object.entries(PLATFORM_FOOTPRINTS)) {
                    if (pageContentLower.includes(footprint)) {
                        const companyName = new URL(url).hostname.replace('www.', '').split('.')[0];
                        console.log(`  ✅ Found '${platform}' footprint on ${url}`);
                        newCompanies.push({
                            name: companyName.charAt(0).toUpperCase() + companyName.slice(1),
                            career_page_url: url,
                            source: platform
                        });
                        break;
                    }
                }
            }
        }

        if (newCompanies.length > 0) {
            const { error } = await supabase.from("companies").upsert(newCompanies, { onConflict: "career_page_url" });
            if (error) throw error;
            console.log(`\n🎉 Successfully discovered and saved ${newCompanies.length} new companies.`);
        } else {
            console.log("No new companies with known job board footprints found.");
        }

        return NextResponse.json({ success: true, discovered: newCompanies.length });

    } catch (error) {
        console.error("Error in Discovery Bot:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
