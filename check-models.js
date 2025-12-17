
const API_KEY = "AIzaSyDMMXxZSQABzr5wTWxecIKrzvOcrtbkdVk";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function check() {
    try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.error) {
            console.error("API Error:", json.error.message);
        } else {
            console.log("Models found:", json.models ? json.models.length : 0);
            if (json.models) {
                json.models.forEach(m => console.log(m.name));
            }
        }
    } catch (e) {
        console.error("Network/Fetch Error:", e.message);
    }
}

check();
