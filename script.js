async function getAIResponse(userInput) {
    // Make a request to the OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "65f67d7476fa4f98982acd06129c58dc" // Replace with your actual API key
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",  // You can use a specific model like "gpt-3.5-turbo"
            messages: [{ role: "user", content: userInput }],
            max_tokens: 100 // Adjust the token limit according to your needs
        })
    });

    const data = await response.json();
    return data.choices[0].message.content; // Extract and return the AI's response
}

async function sendMessage() {
    const userInput = document.getElementById("user-input").value;
    if (userInput.trim() === "") return;

    addMessageToChat(userInput, "user-message");
    document.getElementById("user-input").value = "";

    const botResponse = await getAIResponse(userInput); // Fetch AI response
    addMessageToChat(botResponse, "bot-message");
}

function addMessageToChat(message, className) {
    const messageContainer = document.createElement("div");
    messageContainer.className = "message ${className}";
    messageContainer.textContent = message;

    const chatMessages = document.getElementById("messages");
    chatMessages.appendChild(messageContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}