import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
    const API_KEY = "AIzaSyDMMXxZSQABzr5wTWxecIKrzvOcrtbkdVk";
    const genAI = new GoogleGenerativeAI(API_KEY);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Testing gemini-1.5-flash...");
        const result = await model.generateContent("Hi");
        console.log("Success with 1.5 flash");
    } catch (error) {
        console.log("Flash Error Name:", error.name);
        console.log("Flash Error Message:", error.message);
        if (error.response) console.log("Response:", JSON.stringify(error.response));
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log("Testing gemini-pro...");
        const result = await model.generateContent("Hi");
        console.log("Success with gemini-pro");
    } catch (error) {
        console.log("Pro Error:", error.message);
    }
}

testGemini();
