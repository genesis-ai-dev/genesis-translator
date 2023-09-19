const awaitFetch = import('node-fetch');

export const promptOllama = async (fileContent: string) => {
const fetch: any = await awaitFetch
    // Make POST request to the API
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "llama2",
            prompt: fileContent
        })
    });
    const responseText = await response.text();
    let responseLines = responseText.split('\n');
    let finalResponse = "";

    responseLines.forEach((line:any) => {
        if (line) {
            let jsonResponse = JSON.parse(line);
            if (jsonResponse.response) {
            finalResponse += jsonResponse.response;
            }
            if (jsonResponse.done) {
            // The operation is complete
            console.log("Final response:", finalResponse);
            }
        }
    })

    return finalResponse;
}